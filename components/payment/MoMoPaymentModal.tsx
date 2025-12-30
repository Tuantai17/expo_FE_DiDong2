/**
 * MoMo Payment Modal Component
 * =============================
 * Modal hiển thị 2 options thanh toán MoMo:
 * 1. Quét QR Code
 * 2. Thanh toán bằng thẻ
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
    Platform,
    Animated,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

// =================== TYPES =====================

export type MoMoPaymentOption = 'QR' | 'CARD';

export interface MoMoPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onPaymentSuccess: (transactionId: string) => void;
    onPaymentFailed: (error: string) => void;
    paymentUrl: string | null;
    qrCodeUrl: string | null;
    amount: number;
    orderId: number;
    isLoading?: boolean;
    onCheckStatus: () => void;
    paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | null;
}

// =================== CONSTANTS =====================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MOMO_PINK = '#AE2070';
const MOMO_LIGHT_PINK = '#FFF0F5';

// =================== COMPONENT =====================

const MoMoPaymentModal: React.FC<MoMoPaymentModalProps> = ({
    visible,
    onClose,
    onPaymentSuccess,
    onPaymentFailed,
    paymentUrl,
    qrCodeUrl,
    amount,
    orderId,
    isLoading = false,
    onCheckStatus,
    paymentStatus,
}) => {
    const [selectedOption, setSelectedOption] = useState<MoMoPaymentOption>('QR');
    const [fadeAnim] = useState(new Animated.Value(0));
    const [countdown, setCountdown] = useState(300); // 5 minutes

    // =================== EFFECTS =====================

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Start countdown
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        } else {
            fadeAnim.setValue(0);
            setCountdown(300);
        }
    }, [visible]);

    // Check payment status periodically when QR is displayed
    useEffect(() => {
        if (visible && selectedOption === 'QR' && paymentUrl) {
            const checkInterval = setInterval(() => {
                onCheckStatus();
            }, 5000); // Check every 5 seconds

            return () => clearInterval(checkInterval);
        }
    }, [visible, selectedOption, paymentUrl, onCheckStatus]);

    // Handle payment status change
    useEffect(() => {
        if (paymentStatus === 'SUCCESS') {
            onPaymentSuccess(`MOMO_${orderId}_${Date.now()}`);
        } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
            onPaymentFailed('Thanh toán MoMo thất bại hoặc đã bị hủy');
        }
    }, [paymentStatus, onPaymentSuccess, onPaymentFailed, orderId]);

    // =================== HELPERS =====================

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    };

    // =================== RENDER =====================

    const renderQROption = () => (
        <View style={styles.qrContainer}>
            <View style={styles.qrHeader}>
                <View style={styles.momoIconContainer}>
                    <MaterialCommunityIcons name="wallet" size={32} color={MOMO_PINK} />
                </View>
                <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
            </View>

            <View style={styles.qrWrapper}>
                {isLoading ? (
                    <View style={styles.qrLoading}>
                        <ActivityIndicator size="large" color={MOMO_PINK} />
                        <Text style={styles.qrLoadingText}>Đang tạo mã QR...</Text>
                    </View>
                ) : qrCodeUrl || paymentUrl ? (
                    <>
                        <View style={styles.qrBorder}>
                            <QRCode
                                value={qrCodeUrl || paymentUrl || 'https://momo.vn'}
                                size={200}
                                backgroundColor="white"
                                color="#000"
                            />
                        </View>
                        <View style={styles.countdownContainer}>
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text style={styles.countdownText}>
                                Còn lại: {formatTime(countdown)}
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.qrLoading}>
                        <Ionicons name="qr-code-outline" size={60} color="#ccc" />
                        <Text style={styles.qrLoadingText}>Không có mã QR</Text>
                    </View>
                )}
            </View>

            <View style={styles.instructionContainer}>
                <Text style={styles.instructionTitle}>Hướng dẫn:</Text>
                <View style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>Mở ứng dụng MoMo trên điện thoại</Text>
                </View>
                <View style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>Chọn "Quét mã" và quét mã QR ở trên</Text>
                </View>
                <View style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>Xác nhận thanh toán trên ứng dụng MoMo</Text>
                </View>
            </View>
        </View>
    );

    const renderCardOption = () => (
        <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="credit-card-outline" size={32} color={MOMO_PINK} />
                <Text style={styles.cardTitle}>Thanh toán bằng thẻ</Text>
            </View>

            <View style={styles.cardInfo}>
                <Text style={styles.cardDescription}>
                    Thanh toán qua thẻ ATM/Visa/Mastercard liên kết với MoMo
                </Text>

                <View style={styles.cardLogos}>
                    <View style={styles.cardLogoItem}>
                        <MaterialCommunityIcons name="credit-card" size={24} color="#1A1F71" />
                        <Text style={styles.cardLogoText}>Visa</Text>
                    </View>
                    <View style={styles.cardLogoItem}>
                        <MaterialCommunityIcons name="credit-card-outline" size={24} color="#EB001B" />
                        <Text style={styles.cardLogoText}>Mastercard</Text>
                    </View>
                    <View style={styles.cardLogoItem}>
                        <MaterialCommunityIcons name="credit-card-chip" size={24} color="#006491" />
                        <Text style={styles.cardLogoText}>JCB</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.cardPayButton}
                disabled={isLoading || !paymentUrl}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="open-in-new" size={20} color="#fff" />
                        <Text style={styles.cardPayButtonText}>
                            Mở trang thanh toán
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            <Text style={styles.cardNote}>
                * Bạn sẽ được chuyển đến trang thanh toán của MoMo
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.momoIconContainer}>
                                <MaterialCommunityIcons
                                    name="wallet"
                                    size={24}
                                    color={MOMO_PINK}
                                />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Thanh toán MoMo</Text>
                                <Text style={styles.headerAmount}>{formatPrice(amount)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Payment Option Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                selectedOption === 'QR' && styles.tabActive,
                            ]}
                            onPress={() => setSelectedOption('QR')}
                        >
                            <Ionicons
                                name="qr-code-outline"
                                size={20}
                                color={selectedOption === 'QR' ? MOMO_PINK : '#666'}
                            />
                            <Text style={[
                                styles.tabText,
                                selectedOption === 'QR' && styles.tabTextActive,
                            ]}>
                                Quét QR
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tab,
                                selectedOption === 'CARD' && styles.tabActive,
                            ]}
                            onPress={() => setSelectedOption('CARD')}
                        >
                            <Ionicons
                                name="card-outline"
                                size={20}
                                color={selectedOption === 'CARD' ? MOMO_PINK : '#666'}
                            />
                            <Text style={[
                                styles.tabText,
                                selectedOption === 'CARD' && styles.tabTextActive,
                            ]}>
                                Thẻ Card
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {selectedOption === 'QR' ? renderQROption() : renderCardOption()}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.checkStatusButton}
                            onPress={onCheckStatus}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={MOMO_PINK} />
                            ) : (
                                <>
                                    <Ionicons name="refresh" size={18} color={MOMO_PINK} />
                                    <Text style={styles.checkStatusText}>
                                        Kiểm tra trạng thái thanh toán
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.securityBadge}>
                            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                            <Text style={styles.securityText}>
                                Giao dịch được bảo mật bởi MoMo
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
};

// =================== STYLES =====================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.9,
        minHeight: SCREEN_HEIGHT * 0.7,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    momoIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: MOMO_LIGHT_PINK,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    headerAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: MOMO_PINK,
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        gap: 8,
    },
    tabActive: {
        backgroundColor: MOMO_LIGHT_PINK,
        borderWidth: 1,
        borderColor: MOMO_PINK,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    tabTextActive: {
        color: MOMO_PINK,
        fontWeight: '600',
    },

    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },

    // QR Option
    qrContainer: {
        alignItems: 'center',
    },
    qrHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    momoLogo: {
        width: 80,
        height: 40,
        marginBottom: 8,
    },
    qrTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    qrWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    qrBorder: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: MOMO_PINK,
        ...Platform.select({
            ios: {
                shadowColor: MOMO_PINK,
                shadowOpacity: 0.2,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
    qrLoading: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
    },
    qrLoadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    countdownText: {
        fontSize: 14,
        color: '#666',
    },

    // Instructions
    instructionContainer: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
    },
    instructionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 12,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: MOMO_PINK,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    stepText: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },

    // Card Option
    cardContainer: {
        alignItems: 'center',
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginTop: 8,
    },
    cardInfo: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    cardDescription: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    cardLogos: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    cardLogoItem: {
        alignItems: 'center',
        gap: 4,
    },
    cardLogoText: {
        fontSize: 11,
        color: '#666',
    },
    cardPayButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: MOMO_PINK,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    cardPayButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cardNote: {
        marginTop: 12,
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
    },

    // Footer
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        alignItems: 'center',
    },
    checkStatusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: MOMO_PINK,
        gap: 8,
        marginBottom: 12,
    },
    checkStatusText: {
        fontSize: 14,
        fontWeight: '500',
        color: MOMO_PINK,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    securityText: {
        fontSize: 12,
        color: '#64748B',
    },
});

export default MoMoPaymentModal;
