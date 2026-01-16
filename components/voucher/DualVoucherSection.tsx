/**
 * DualVoucherSection - Hỗ trợ 2 loại voucher cùng lúc
 * ====================================================
 * - ORDER Voucher: Giảm giá đơn hàng
 * - SHIPPING Voucher: Giảm phí vận chuyển
 * - Có thể dùng cả 2 cùng lúc
 * - Hỗ trợ xóa/đổi voucher
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

type VoucherType = 'ORDER' | 'SHIPPING';

interface DualVoucherSectionProps {
    orderAmount: number;
    shippingFee: number;
    onOrderVoucherApplied: (discountAmount: number, voucherCode: string) => void;
    onShippingVoucherApplied: (discountAmount: number, voucherCode: string) => void;
}

interface AppliedVoucher {
    voucher: Voucher;
    discountAmount: number;
    code: string;
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

export function DualVoucherSection({
    orderAmount,
    shippingFee,
    onOrderVoucherApplied,
    onShippingVoucherApplied,
}: DualVoucherSectionProps) {
    const { user, isAuthenticated } = useAuth();

    // State for ORDER voucher
    const [orderVoucherCode, setOrderVoucherCode] = useState('');
    const [appliedOrderVoucher, setAppliedOrderVoucher] = useState<AppliedVoucher | null>(null);

    // State for SHIPPING voucher
    const [shippingVoucherCode, setShippingVoucherCode] = useState('');
    const [appliedShippingVoucher, setAppliedShippingVoucher] = useState<AppliedVoucher | null>(null);

    // Modal state
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [modalType, setModalType] = useState<VoucherType>('ORDER');
    const [savedVouchers, setSavedVouchers] = useState<UserVoucher[]>([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Fetch saved vouchers when modal opens
    useEffect(() => {
        if (showVoucherModal && isAuthenticated && user?.id) {
            fetchSavedVouchers();
        }
    }, [showVoucherModal, isAuthenticated, user?.id, modalType]);

    const fetchSavedVouchers = async () => {
        if (!user?.id) return;

        setLoadingVouchers(true);
        try {
            const vouchers = await userVoucherService.getValidUserVouchers(user.id);
            console.log('📦 [DualVoucher] All vouchers from API:', vouchers);
            
            // Helper: Determine if a voucher is SHIPPING type
            const isShippingVoucher = (v: UserVoucher): boolean => {
                // 1. Explicit voucherType
                if (v.voucherType === 'SHIPPING') return true;
                if (v.voucherType === 'ORDER') return false;
                
                // 2. Check by code naming convention (FREESHIP, SHIP, etc.)
                const code = v.voucherCode?.toUpperCase() || '';
                if (code.includes('FREESHIP') || code.includes('SHIP') || code.includes('VANCHU')) {
                    return true;
                }
                
                // 3. Check if has maxShippingDiscount (shipping voucher specific field)
                if (v.maxShippingDiscount && v.maxShippingDiscount > 0) {
                    return true;
                }
                
                // 4. Default: treat as ORDER voucher if can't determine
                return false;
            };
            
            // Filter by voucher type
            const filteredVouchers = vouchers.filter((v: UserVoucher) => {
                const isShipping = isShippingVoucher(v);
                const matchesType = modalType === 'SHIPPING' ? isShipping : !isShipping;
                
                const meetsMinOrder = v.minOrderAmount <= orderAmount;
                const isValid = v.isValid && !v.isUsed;
                
                console.log(`📋 [DualVoucher] Voucher ${v.voucherCode}: isShipping=${isShipping}, matchesType=${matchesType}, meetsMinOrder=${meetsMinOrder}, isValid=${isValid}`);
                
                return matchesType && meetsMinOrder && isValid;
            });
            
            console.log(`✅ [DualVoucher] Filtered ${modalType} vouchers:`, filteredVouchers.length);
            setSavedVouchers(filteredVouchers);
        } catch (error) {
            console.error('Error fetching saved vouchers:', error);
            setSavedVouchers([]);
        } finally {
            setLoadingVouchers(false);
        }
    };

    // =================== ORDER VOUCHER HANDLERS =====================

    const handleApplyOrderVoucher = async (code?: string) => {
        const codeToUse = code || orderVoucherCode.trim();
        if (!codeToUse) {
            Alert.alert('Thông báo', 'Vui lòng nhập mã giảm giá');
            return;
        }

        if (!isAuthenticated || !user?.id) {
            Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng mã giảm giá');
            return;
        }

        // Quick check: if code looks like shipping voucher, reject early
        const upperCode = codeToUse.toUpperCase();
        if (upperCode.includes('FREESHIP') || upperCode.includes('SHIP') || upperCode.includes('VANCHU')) {
            Alert.alert(
                'Sai loại voucher', 
                'Đây có vẻ là voucher vận chuyển. Vui lòng sử dụng ở mục "Mã giảm phí vận chuyển" bên dưới.'
            );
            return;
        }

        setIsChecking(true);
        try {
            console.log('🎟️ [DualVoucher] Checking ORDER voucher:', codeToUse);
            const result = await voucherService.check(codeToUse, orderAmount);
            
            if (result.valid && result.voucher) {
                // Verify it's NOT a SHIPPING voucher
                const voucher = result.voucher;
                const isShippingType = voucher.voucherType === 'SHIPPING' || 
                    (voucher.maxShippingDiscount && voucher.maxShippingDiscount > 0);
                
                if (isShippingType) {
                    Alert.alert('Sai loại voucher', 'Đây là voucher giảm phí ship. Vui lòng dùng ở ô "Giảm phí vận chuyển".');
                    setIsChecking(false);
                    return;
                }
                
                setAppliedOrderVoucher({
                    voucher: result.voucher,
                    discountAmount: result.discountAmount || 0,
                    code: codeToUse.toUpperCase(),
                });
                setOrderVoucherCode(codeToUse.toUpperCase());
                onOrderVoucherApplied(result.discountAmount || 0, codeToUse.toUpperCase());
                Alert.alert('Thành công', 'Đã áp dụng mã giảm giá đơn hàng!');
            } else {
                Alert.alert('Không hợp lệ', result.message || 'Mã giảm giá không hợp lệ');
            }
        } catch (error: any) {
            console.error('❌ [DualVoucher] Error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể kiểm tra mã giảm giá');
        } finally {
            setIsChecking(false);
        }
    };

    const handleRemoveOrderVoucher = () => {
        setAppliedOrderVoucher(null);
        setOrderVoucherCode('');
        onOrderVoucherApplied(0, '');
    };

    // =================== SHIPPING VOUCHER HANDLERS =====================

    const handleApplyShippingVoucher = async (code?: string) => {
        const codeToUse = code || shippingVoucherCode.trim();
        if (!codeToUse) {
            Alert.alert('Thông báo', 'Vui lòng nhập mã giảm phí ship');
            return;
        }

        if (!isAuthenticated || !user?.id) {
            Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng mã giảm giá');
            return;
        }

        if (shippingFee <= 0) {
            Alert.alert('Thông báo', 'Đơn hàng đã được miễn phí ship');
            return;
        }

        setIsChecking(true);
        try {
            console.log('🚚 [DualVoucher] Checking SHIPPING voucher:', codeToUse);
            const result = await voucherService.checkShippingVoucher(codeToUse, shippingFee, orderAmount);
            console.log('📋 [DualVoucher] SHIPPING check result:', result);
            
            if (result.valid && result.voucher) {
                const voucher = result.voucher;
                const upperCode = codeToUse.toUpperCase();
                
                // Determine if it's a SHIPPING voucher using multiple methods
                const isShippingType = voucher.voucherType === 'SHIPPING' ||
                    upperCode.includes('FREESHIP') || 
                    upperCode.includes('SHIP') || 
                    upperCode.includes('VANCHU') ||
                    (voucher.maxShippingDiscount && voucher.maxShippingDiscount > 0);
                
                // If explicitly ORDER type, reject
                if (voucher.voucherType === 'ORDER' && !upperCode.includes('SHIP')) {
                    Alert.alert('Sai loại voucher', 'Đây là voucher giảm giá đơn hàng. Vui lòng dùng ở ô "Giảm giá đơn hàng".');
                    setIsChecking(false);
                    return;
                }
                
                const discount = Math.min(result.discountAmount || 0, shippingFee);
                console.log('✅ [DualVoucher] SHIPPING voucher valid! Discount:', discount);
                
                setAppliedShippingVoucher({
                    voucher: result.voucher,
                    discountAmount: discount,
                    code: codeToUse.toUpperCase(),
                });
                setShippingVoucherCode(codeToUse.toUpperCase());
                onShippingVoucherApplied(discount, codeToUse.toUpperCase());
                Alert.alert('Thành công', `Đã giảm ${formatPrice(discount)} phí vận chuyển!`);
            } else {
                console.log('❌ [DualVoucher] SHIPPING check failed:', result.message);
                Alert.alert('Không hợp lệ', result.message || 'Mã giảm phí ship không hợp lệ');
            }
        } catch (error: any) {
            console.error('❌ [DualVoucher] Error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể kiểm tra mã giảm giá');
        } finally {
            setIsChecking(false);
        }
    };

    const handleRemoveShippingVoucher = () => {
        setAppliedShippingVoucher(null);
        setShippingVoucherCode('');
        onShippingVoucherApplied(0, '');
    };

    // =================== MODAL HANDLERS =====================

    const openModal = (type: VoucherType) => {
        setModalType(type);
        setShowVoucherModal(true);
    };

    const handleSelectVoucher = (userVoucher: UserVoucher) => {
        setShowVoucherModal(false);
        
        if (modalType === 'ORDER') {
            setOrderVoucherCode(userVoucher.voucherCode);
            setTimeout(() => handleApplyOrderVoucher(userVoucher.voucherCode), 100);
        } else {
            setShippingVoucherCode(userVoucher.voucherCode);
            setTimeout(() => handleApplyShippingVoucher(userVoucher.voucherCode), 100);
        }
    };

    // =================== RENDER VOUCHER ITEM =====================

    const renderVoucherItem = ({ item }: { item: UserVoucher }) => {
        const canApply = item.minOrderAmount <= orderAmount;
        const isShipping = item.voucherType === 'SHIPPING';

        return (
            <TouchableOpacity
                style={[styles.voucherItem, !canApply && styles.voucherItemDisabled]}
                onPress={() => canApply && handleSelectVoucher(item)}
                disabled={!canApply}
            >
                <View style={[
                    styles.voucherBadge, 
                    !canApply && styles.voucherBadgeDisabled,
                    isShipping && { backgroundColor: '#F59E0B' }
                ]}>
                    <Ionicons 
                        name={isShipping ? 'car' : 'pricetag'} 
                        size={18} 
                        color={canApply ? '#FFFFFF' : '#94A3B8'} 
                    />
                    <Text style={[styles.voucherBadgeText, !canApply && styles.voucherBadgeTextDisabled]}>
                        {item.discountType === 'PERCENTAGE'
                            ? `${item.discount}%`
                            : formatPrice(item.discount)}
                    </Text>
                </View>
                
                <View style={styles.voucherInfo}>
                    <Text style={[styles.voucherCode, !canApply && styles.voucherTextDisabled]}>
                        {item.voucherCode}
                    </Text>
                    <Text style={[styles.voucherDiscount, !canApply && styles.voucherTextDisabled]}>
                        {isShipping ? 'Giảm phí ship ' : 'Giảm '}
                        {item.discountType === 'PERCENTAGE'
                            ? `${item.discount}%`
                            : formatPrice(item.discount)}
                    </Text>
                    {item.minOrderAmount > 0 && (
                        <Text style={styles.voucherCondition}>
                            Đơn tối thiểu: {formatPrice(item.minOrderAmount)}
                        </Text>
                    )}
                    <Text style={styles.voucherExpiry}>HSD: {formatDate(item.expiryDate)}</Text>
                </View>
                
                {canApply && (
                    <TouchableOpacity style={styles.selectButton} onPress={() => handleSelectVoucher(item)}>
                        <Text style={styles.selectButtonText}>Chọn</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    // =================== RENDER APPLIED VOUCHER =====================

    const renderAppliedVoucher = (
        applied: AppliedVoucher | null,
        type: VoucherType,
        onRemove: () => void
    ) => {
        if (!applied) return null;
        
        const isShipping = type === 'SHIPPING';
        const bgColor = isShipping ? '#FFF7ED' : '#ECFDF5';
        const borderColor = isShipping ? '#FDBA74' : '#A7F3D0';
        const iconColor = isShipping ? '#F59E0B' : '#10B981';
        const textColor = isShipping ? '#EA580C' : '#047857';

        return (
            <View style={[styles.appliedContainer, { backgroundColor: bgColor, borderColor }]}>
                <View style={styles.appliedInfo}>
                    <View style={styles.appliedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={iconColor} />
                    </View>
                    <View style={styles.appliedText}>
                        <Text style={[styles.appliedCode, { color: textColor }]}>{applied.code}</Text>
                        <Text style={[styles.appliedDiscount, { color: iconColor }]}>
                            -{formatPrice(applied.discountAmount)}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>
        );
    };

    // =================== RENDER INPUT ROW =====================

    const renderInputRow = (
        type: VoucherType,
        code: string,
        setCode: (v: string) => void,
        onApply: () => void,
        applied: AppliedVoucher | null
    ) => {
        if (applied) return null;
        
        const isShipping = type === 'SHIPPING';
        const placeholder = isShipping ? 'Nhập mã giảm phí ship' : 'Nhập mã giảm giá đơn hàng';

        return (
            <>
                <View style={styles.inputRow}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor="#94A3B8"
                            value={code}
                            onChangeText={(text) => setCode(text.toUpperCase())}
                            autoCapitalize="characters"
                            editable={!isChecking}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.applyButton, isChecking && styles.applyButtonDisabled]}
                        onPress={onApply}
                        disabled={isChecking}
                    >
                        {isChecking ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.applyButtonText}>Áp dụng</Text>
                        )}
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.showListButton} onPress={() => openModal(type)}>
                    <Ionicons name="bookmark-outline" size={14} color="#5B9EE1" />
                    <Text style={styles.showListText}>Chọn từ voucher đã lưu</Text>
                    <Ionicons name="chevron-forward" size={14} color="#5B9EE1" />
                </TouchableOpacity>
            </>
        );
    };

    // =================== MAIN RENDER =====================

    return (
        <View style={styles.container}>
            {/* ORDER Voucher Section */}
            <View style={styles.section}>
                <View style={styles.header}>
                    <Ionicons name="pricetag-outline" size={18} color="#10B981" />
                    <Text style={styles.headerText}>Mã giảm giá đơn hàng</Text>
                </View>
                
                {renderAppliedVoucher(appliedOrderVoucher, 'ORDER', handleRemoveOrderVoucher)}
                {renderInputRow('ORDER', orderVoucherCode, setOrderVoucherCode, () => handleApplyOrderVoucher(), appliedOrderVoucher)}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* SHIPPING Voucher Section */}
            <View style={styles.section}>
                <View style={styles.header}>
                    <Ionicons name="car-outline" size={18} color="#F59E0B" />
                    <Text style={styles.headerText}>Mã giảm phí vận chuyển</Text>
                    {shippingFee <= 0 && (
                        <View style={styles.freeBadge}>
                            <Text style={styles.freeBadgeText}>Đã miễn phí</Text>
                        </View>
                    )}
                </View>
                
                {shippingFee > 0 ? (
                    <>
                        {renderAppliedVoucher(appliedShippingVoucher, 'SHIPPING', handleRemoveShippingVoucher)}
                        {renderInputRow('SHIPPING', shippingVoucherCode, setShippingVoucherCode, () => handleApplyShippingVoucher(), appliedShippingVoucher)}
                    </>
                ) : (
                    <Text style={styles.freeShippingText}>Đơn hàng đã được miễn phí vận chuyển!</Text>
                )}
            </View>

            {/* Voucher Selection Modal */}
            <Modal
                visible={showVoucherModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowVoucherModal(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {modalType === 'ORDER' ? '🛒 Voucher Đơn hàng' : '🚚 Voucher Vận chuyển'}
                        </Text>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowVoucherModal(false)}>
                            <Ionicons name="close" size={24} color="#0F172A" />
                        </TouchableOpacity>
                    </View>

                    {/* Info */}
                    <View style={[styles.orderInfo, { backgroundColor: modalType === 'SHIPPING' ? '#FFF7ED' : '#EBF4FF' }]}>
                        <Text style={[styles.orderInfoText, { color: modalType === 'SHIPPING' ? '#EA580C' : '#3B82F6' }]}>
                            {modalType === 'ORDER' 
                                ? `Đơn hàng: ${formatPrice(orderAmount)}`
                                : `Phí ship hiện tại: ${formatPrice(shippingFee)}`
                            }
                        </Text>
                    </View>

                    {/* Loading / List */}
                    {loadingVouchers ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#5B9EE1" />
                            <Text style={styles.loadingText}>Đang tải voucher...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={savedVouchers}
                            keyExtractor={(item) => item.id?.toString() || item.voucherId?.toString()}
                            renderItem={renderVoucherItem}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="bookmark-outline" size={64} color="#CBD5E1" />
                                    <Text style={styles.emptyTitle}>
                                        {modalType === 'ORDER' ? 'Không có voucher đơn hàng' : 'Không có voucher vận chuyển'}
                                    </Text>
                                    <Text style={styles.emptyText}>
                                        Hãy vào mục "Mã giảm giá" trong hồ sơ để lưu voucher!
                                    </Text>
                                </View>
                            )}
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
    section: {
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        marginLeft: 8,
        flex: 1,
    },
    freeBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    freeBadgeText: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '600',
    },
    freeShippingText: {
        fontSize: 13,
        color: '#10B981',
        fontStyle: 'italic',
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
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    applyButton: {
        backgroundColor: '#5B9EE1',
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    showListButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingVertical: 6,
    },
    showListText: {
        color: '#5B9EE1',
        fontSize: 13,
        fontWeight: '500',
        marginHorizontal: 4,
    },

    // Applied Voucher
    appliedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
    },
    appliedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appliedBadge: {
        marginRight: 10,
    },
    appliedText: {},
    appliedCode: {
        fontSize: 14,
        fontWeight: '700',
    },
    appliedDiscount: {
        fontSize: 13,
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
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    orderInfoText: {
        fontSize: 14,
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
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    voucherItemDisabled: {
        backgroundColor: '#F8FAFC',
        opacity: 0.7,
    },
    voucherBadge: {
        width: 46,
        height: 46,
        borderRadius: 10,
        backgroundColor: '#5B9EE1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    voucherBadgeDisabled: {
        backgroundColor: '#E2E8F0',
    },
    voucherBadgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 10,
        marginTop: 2,
    },
    voucherBadgeTextDisabled: {
        color: '#94A3B8',
    },
    voucherInfo: {
        flex: 1,
    },
    voucherCode: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    voucherDiscount: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
        marginBottom: 2,
    },
    voucherCondition: {
        fontSize: 10,
        color: '#64748B',
    },
    voucherExpiry: {
        fontSize: 10,
        color: '#64748B',
    },
    voucherTextDisabled: {
        color: '#94A3B8',
    },
    selectButton: {
        backgroundColor: '#5B9EE1',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
    },
    selectButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
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
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default DualVoucherSection;
