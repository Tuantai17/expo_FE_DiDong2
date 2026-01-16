/**
 * Payment Pending Screen
 * ======================
 * Displayed when user cancels VNPay payment
 * Shows countdown timer (15 minutes) before auto-cancellation
 * Provides options to:
 * - Go to home page
 * - View order details (continue payment or cancel)
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// =================== CONSTANTS =====================

const PAYMENT_TIMEOUT_MINUTES = 15;
const PAYMENT_TIMEOUT_MS = PAYMENT_TIMEOUT_MINUTES * 60 * 1000;
const ORANGE_PRIMARY = '#F97316';
const ORANGE_DARK = '#EA580C';

// =================== COMPONENT =====================

export default function PaymentPendingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        orderId?: string;
        orderCode?: string;
        amount?: string;
        customerName?: string;
        paymentMethod?: string;
    }>();

    // Parse params
    const orderId = params.orderId || '';
    const orderCode = params.orderCode || '';
    const amount = params.amount ? parseInt(params.amount, 10) : 0;
    const customerName = params.customerName || '';
    const paymentMethod = params.paymentMethod || 'vnpay';

    // State for countdown
    const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT_MS);
    const pulseAnim = new Animated.Value(1);

    // =================== EFFECTS =====================

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1000) {
                    clearInterval(timer);
                    // Auto-navigate when time expires
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Pulse animation for clock icon
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // =================== HANDLERS =====================

    const formatTime = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    };

    const handleTimeExpired = () => {
        // Navigate to home when time expires
        router.replace('/');
    };

    const handleGoHome = () => {
        router.replace('/');
    };

    const handleViewOrderDetails = () => {
        // Navigate to order-status screen with the order info
        router.push({
            pathname: '/product/order-status',
            params: {
                orderId: orderId ? `#ORD-${orderId}` : '',
                orderCode,
                fromPaymentPending: 'true',
                paymentMethod,
                status: 'pending',
                total: amount.toString(),
            },
        });
    };

    // =================== RENDER =====================

    const minutes = Math.floor(timeLeft / 60000);
    const isUrgent = minutes < 5;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={[ORANGE_PRIMARY, ORANGE_DARK]}
                style={styles.headerGradient}
            >
                {/* Back button */}
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={handleGoHome}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.content}>
                {/* Icon with animation */}
                <Animated.View 
                    style={[
                        styles.iconContainer,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                >
                    <Ionicons 
                        name="time-outline" 
                        size={60} 
                        color={isUrgent ? '#EF4444' : ORANGE_PRIMARY} 
                    />
                </Animated.View>

                {/* Title */}
                <Text style={styles.title}>Chờ thanh toán.</Text>

                {/* Description */}
                <Text style={styles.description}>
                    Chọn "Chi tiết đơn hàng" để kiểm tra thời hạn thanh toán của đơn hàng. 
                    Hãy hoàn tất thanh toán trước thời gian này để không bị hủy đơn nhé!
                </Text>

                {/* Countdown Timer */}
                <View style={[
                    styles.timerContainer,
                    isUrgent && styles.timerContainerUrgent
                ]}>
                    <Ionicons 
                        name="alarm-outline" 
                        size={24} 
                        color={isUrgent ? '#EF4444' : ORANGE_PRIMARY} 
                    />
                    <Text style={[
                        styles.timerText,
                        isUrgent && styles.timerTextUrgent
                    ]}>
                        Còn lại: {formatTime(timeLeft)}
                    </Text>
                </View>

                {/* Order Info */}
                {(orderId || amount > 0) && (
                    <View style={styles.orderInfo}>
                        {orderCode && (
                            <Text style={styles.orderCode}>
                                Mã đơn: #{orderCode}
                            </Text>
                        )}
                        {amount > 0 && (
                            <Text style={styles.orderAmount}>
                                Số tiền: {formatPrice(amount)}
                            </Text>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.homeButton}
                        onPress={handleGoHome}
                    >
                        <Text style={styles.homeButtonText}>Về trang chủ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.detailButton}
                        onPress={handleViewOrderDetails}
                    >
                        <Text style={styles.detailButtonText}>Chi tiết đơn hàng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerGradient: {
        height: 80,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        marginTop: -40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: ORANGE_PRIMARY,
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: ORANGE_PRIMARY,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#FFF7ED',
        borderRadius: 12,
        marginBottom: 24,
    },
    timerContainerUrgent: {
        backgroundColor: '#FEE2E2',
    },
    timerText: {
        fontSize: 20,
        fontWeight: '700',
        color: ORANGE_PRIMARY,
    },
    timerTextUrgent: {
        color: '#EF4444',
    },
    orderInfo: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 32,
    },
    orderCode: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 4,
    },
    orderAmount: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    homeButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: ORANGE_PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    homeButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: ORANGE_PRIMARY,
    },
    detailButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: ORANGE_PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
