/**
 * VoucherSection - Component tích hợp vào Checkout
 * ================================================
 * CHỈ hiển thị voucher đã lưu của người dùng
 * Input nhập mã, nút áp dụng, hiển thị voucher đã chọn
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { UserVoucher, userVoucherService, Voucher, voucherService } from '../../services/voucherService';

// =================== TYPES =====================

interface VoucherSectionProps {
    orderAmount: number;
    onVoucherApplied: (discountAmount: number, voucherCode: string) => void;
}

// =================== HELPERS =====================

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// =================== COMPONENT =====================

export function VoucherSection({ orderAmount, onVoucherApplied }: VoucherSectionProps) {
    const { user, isAuthenticated } = useAuth();

    // State
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [savedVouchers, setSavedVouchers] = useState<UserVoucher[]>([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);

    // Fetch saved vouchers when modal opens
    useEffect(() => {
        if (showVoucherModal && isAuthenticated && user?.id) {
            fetchSavedVouchers();
        }
    }, [showVoucherModal, isAuthenticated, user?.id]);

    const fetchSavedVouchers = async () => {
        if (!user?.id) return;

        setLoadingVouchers(true);
        try {
            // Chỉ lấy voucher đã lưu và còn hiệu lực của user
            const vouchers = await userVoucherService.getValidUserVouchers(user.id);
            // Lọc theo orderAmount
            const applicableVouchers = vouchers.filter(
                (v: UserVoucher) => v.minOrderAmount <= orderAmount && v.isValid && !v.isUsed
            );
            setSavedVouchers(applicableVouchers);
        } catch (error) {
            console.error('Error fetching saved vouchers:', error);
            setSavedVouchers([]);
        } finally {
            setLoadingVouchers(false);
        }
    };

    // Apply voucher
    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập mã giảm giá');
            return;
        }

        if (!isAuthenticated || !user?.id) {
            Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng mã giảm giá');
            return;
        }

        setIsChecking(true);
        try {
            // Kiểm tra xem user đã lưu voucher này chưa
            const savedVouchersList = await userVoucherService.getUserVouchers(user.id);
            const hasSaved = savedVouchersList.some(
                (v: UserVoucher) => v.voucherCode.toUpperCase() === voucherCode.toUpperCase()
            );

            if (!hasSaved) {
                Alert.alert(
                    'Không thể sử dụng',
                    'Bạn chưa lưu mã giảm giá này. Vui lòng vào mục "Mã giảm giá" trong hồ sơ để lưu voucher trước khi sử dụng.'
                );
                setIsChecking(false);
                return;
            }

            console.log('🎟️ [VoucherSection] Checking voucher:', voucherCode);
            const result = await voucherService.check(voucherCode, orderAmount);
            console.log('📋 [VoucherSection] Result:', result);

            if (result.valid && result.voucher) {
                setAppliedVoucher(result.voucher);
                setDiscountAmount(result.discountAmount || 0);
                onVoucherApplied(result.discountAmount || 0, voucherCode.toUpperCase());
                Alert.alert('Thành công', result.message || 'Áp dụng mã giảm giá thành công!');
            } else {
                Alert.alert('Không hợp lệ', result.message || 'Mã giảm giá không hợp lệ');
            }
        } catch (error: any) {
            console.error('❌ [VoucherSection] Error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể kiểm tra mã giảm giá');
        } finally {
            setIsChecking(false);
        }
    };

    // Select voucher from list
    const handleSelectVoucher = (userVoucher: UserVoucher) => {
        setVoucherCode(userVoucher.voucherCode);
        setShowVoucherModal(false);
        // Auto apply
        setTimeout(() => handleApplyWithCode(userVoucher.voucherCode), 100);
    };

    const handleApplyWithCode = async (code: string) => {
        setIsChecking(true);
        try {
            const result = await voucherService.check(code, orderAmount);
            if (result.valid && result.voucher) {
                setAppliedVoucher(result.voucher);
                setDiscountAmount(result.discountAmount || 0);
                onVoucherApplied(result.discountAmount || 0, code.toUpperCase());
            }
        } catch (error) {
            console.error('Error applying voucher:', error);
        } finally {
            setIsChecking(false);
        }
    };

    // Remove applied voucher
    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        setVoucherCode('');
        onVoucherApplied(0, '');
    };

    // Render saved voucher item
    const renderSavedVoucherItem = ({ item }: { item: UserVoucher }) => {
        const canApply = item.minOrderAmount <= orderAmount;

        return (
            <TouchableOpacity
                style={[
                    styles.voucherItem,
                    !canApply && styles.voucherItemDisabled
                ]}
                onPress={() => canApply && handleSelectVoucher(item)}
                disabled={!canApply}
            >
                <View style={[styles.voucherBadge, !canApply && styles.voucherBadgeDisabled]}>
                    <Ionicons name="pricetag" size={18} color={canApply ? '#FFFFFF' : '#94A3B8'} />
                    <Text style={[styles.voucherBadgeText, !canApply && styles.voucherBadgeTextDisabled]}>
                        {item.discountType === 'PERCENTAGE'
                            ? `${item.discount}%`
                            : formatPrice(item.discount)
                        }
                    </Text>
                </View>
                <View style={styles.voucherInfo}>
                    <Text style={[styles.voucherCode, !canApply && styles.voucherTextDisabled]}>
                        {item.voucherCode}
                    </Text>
                    <Text style={[styles.voucherDiscount, !canApply && styles.voucherTextDisabled]}>
                        {item.discountType === 'PERCENTAGE'
                            ? `Giảm ${item.discount}%`
                            : `Giảm ${formatPrice(item.discount)}`
                        }
                        {item.maxDiscountAmount > 0 && item.discountType === 'PERCENTAGE' && (
                            ` (tối đa ${formatPrice(item.maxDiscountAmount)})`
                        )}
                    </Text>
                    {item.minOrderAmount > 0 && (
                        <Text style={styles.voucherCondition}>
                            Đơn tối thiểu: {formatPrice(item.minOrderAmount)}
                        </Text>
                    )}
                    <Text style={styles.voucherExpiry}>
                        HSD: {formatDate(item.expiryDate)}
                    </Text>
                    {!canApply && (
                        <Text style={styles.notApplicableText}>
                            Đơn hàng chưa đủ điều kiện
                        </Text>
                    )}
                </View>
                {canApply && (
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => handleSelectVoucher(item)}
                    >
                        <Text style={styles.selectButtonText}>Chọn</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyVouchers = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Chưa có voucher đã lưu</Text>
            <Text style={styles.emptyText}>
                Bạn chưa lưu mã giảm giá nào phù hợp với đơn hàng này.
                Hãy vào mục "Mã giảm giá" trong hồ sơ để lưu voucher!
            </Text>
        </View>
    );

    // =================== RENDER =====================

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="pricetag-outline" size={18} color="#5B9EE1" />
                <Text style={styles.headerText}>Mã giảm giá</Text>
            </View>

            {/* Applied Voucher */}
            {appliedVoucher ? (
                <View style={styles.appliedContainer}>
                    <View style={styles.appliedInfo}>
                        <View style={styles.appliedBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        </View>
                        <View style={styles.appliedText}>
                            <Text style={styles.appliedCode}>{appliedVoucher.code}</Text>
                            <Text style={styles.appliedDiscount}>
                                -{formatPrice(discountAmount)}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={handleRemoveVoucher}
                    >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Input Row */}
                    <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mã giảm giá đã lưu"
                                placeholderTextColor="#94A3B8"
                                value={voucherCode}
                                onChangeText={(text) => setVoucherCode(text.toUpperCase())}
                                autoCapitalize="characters"
                                editable={!isChecking}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.applyButton, isChecking && styles.applyButtonDisabled]}
                            onPress={handleApplyVoucher}
                            disabled={isChecking}
                        >
                            {isChecking ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.applyButtonText}>Áp dụng</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Show saved vouchers link */}
                    <TouchableOpacity
                        style={styles.showListButton}
                        onPress={() => setShowVoucherModal(true)}
                    >
                        <Ionicons name="bookmark-outline" size={16} color="#5B9EE1" />
                        <Text style={styles.showListText}>
                            Chọn từ voucher đã lưu của bạn
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#5B9EE1" />
                    </TouchableOpacity>

                    {/* Info text */}
                    <View style={styles.infoRow}>
                        <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
                        <Text style={styles.infoText}>
                            Chỉ có thể sử dụng mã giảm giá đã lưu trong kho của bạn
                        </Text>
                    </View>
                </>
            )}

            {/* Voucher Modal */}
            <Modal
                visible={showVoucherModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowVoucherModal(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Voucher đã lưu của bạn</Text>
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setShowVoucherModal(false)}
                        >
                            <Ionicons name="close" size={24} color="#0F172A" />
                        </TouchableOpacity>
                    </View>

                    {/* Order Amount Info */}
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderInfoText}>
                            Đơn hàng: {formatPrice(orderAmount)}
                        </Text>
                    </View>

                    {/* Loading */}
                    {loadingVouchers ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#5B9EE1" />
                            <Text style={styles.loadingText}>Đang tải voucher...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={savedVouchers}
                            keyExtractor={(item) => item.id?.toString() || item.voucherId?.toString()}
                            renderItem={renderSavedVoucherItem}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={renderEmptyVouchers}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginLeft: 8,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    inputWrapper: {
        flex: 1,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    applyButton: {
        backgroundColor: '#5B9EE1',
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    showListButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        paddingVertical: 8,
    },
    showListText: {
        color: '#5B9EE1',
        fontSize: 14,
        fontWeight: '500',
        marginHorizontal: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#94A3B8',
        marginLeft: 4,
    },

    // Applied Voucher
    appliedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    appliedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appliedBadge: {
        marginRight: 10,
    },
    appliedText: {
        flexDirection: 'column',
    },
    appliedCode: {
        fontSize: 15,
        fontWeight: '700',
        color: '#047857',
    },
    appliedDiscount: {
        fontSize: 14,
        color: '#10B981',
        marginTop: 2,
    },
    removeButton: {
        padding: 4,
    },

    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    modalClose: {
        padding: 4,
    },
    orderInfo: {
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    orderInfoText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
    },

    // Voucher Item
    voucherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    voucherItemDisabled: {
        backgroundColor: '#F8FAFC',
        opacity: 0.7,
    },
    voucherBadge: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#5B9EE1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    voucherBadgeDisabled: {
        backgroundColor: '#E2E8F0',
    },
    voucherBadgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 11,
        marginTop: 2,
    },
    voucherBadgeTextDisabled: {
        color: '#94A3B8',
    },
    voucherInfo: {
        flex: 1,
    },
    voucherCode: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    voucherDiscount: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '600',
        marginBottom: 4,
    },
    voucherCondition: {
        fontSize: 11,
        color: '#64748B',
    },
    voucherExpiry: {
        fontSize: 11,
        color: '#64748B',
    },
    voucherTextDisabled: {
        color: '#94A3B8',
    },
    notApplicableText: {
        fontSize: 11,
        color: '#EF4444',
        marginTop: 4,
        fontStyle: 'italic',
    },
    selectButton: {
        backgroundColor: '#5B9EE1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    selectButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default VoucherSection;
