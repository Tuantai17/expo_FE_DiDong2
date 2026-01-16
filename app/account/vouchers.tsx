/**
 * Vouchers Screen - Danh sách mã giảm giá
 * =======================================
 * Trang xem tất cả vouchers có sẵn + voucher của tôi
 * Truy cập từ Profile → Mã giảm giá
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { VoucherCard } from '../../components/voucher';
import { useAuth } from '../../context/AuthContext';
import { useVouchers } from '../../hooks/useVouchers';
import { UserVoucher, userVoucherService, Voucher } from '../../services/voucherService';

// =================== TYPES =====================

type TabType = 'all' | 'saved';

// =================== COMPONENT =====================

export default function VouchersScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { vouchers, loading, error, refetch } = useVouchers();

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('all');

    // Saved vouchers state
    const [savedVouchers, setSavedVouchers] = useState<UserVoucher[]>([]);
    const [savedVouchersLoading, setSavedVouchersLoading] = useState(false);
    const [savedVoucherIds, setSavedVoucherIds] = useState<Set<number>>(new Set());
    const [savingVoucherId, setSavingVoucherId] = useState<number | null>(null);

    // Refresh state
    const [refreshing, setRefreshing] = useState(false);

    // =================== FETCH SAVED VOUCHERS =====================

    const fetchSavedVouchers = useCallback(async () => {
        if (!user?.id) return;

        setSavedVouchersLoading(true);
        try {
            const data = await userVoucherService.getUserVouchers(user.id);
            setSavedVouchers(data);
            // Build set of saved voucher IDs for quick lookup
            const ids = new Set(data.map((v: UserVoucher) => v.voucherId));
            setSavedVoucherIds(ids);
        } catch (err) {
            console.error('Error fetching saved vouchers:', err);
        } finally {
            setSavedVouchersLoading(false);
        }
    }, [user?.id]);

    // Load saved vouchers on mount
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchSavedVouchers();
        }
    }, [isAuthenticated, user?.id, fetchSavedVouchers]);

    // =================== HANDLERS =====================

    const handleRefresh = async () => {
        setRefreshing(true);
        if (activeTab === 'all') {
            await refetch();
        } else {
            await fetchSavedVouchers();
        }
        setRefreshing(false);
    };

    const handleSaveVoucher = async (voucher: Voucher) => {
        if (!isAuthenticated || !user?.id) {
            Alert.alert(
                'Chưa đăng nhập',
                'Vui lòng đăng nhập để lưu voucher',
                [
                    { text: 'Để sau', style: 'cancel' },
                    { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') },
                ]
            );
            return;
        }

        if (savedVoucherIds.has(voucher.id)) {
            Alert.alert('Thông báo', 'Bạn đã lưu voucher này rồi!');
            return;
        }

        setSavingVoucherId(voucher.id);
        try {
            const result = await userVoucherService.saveVoucher(user.id, voucher.id);
            if (result.success) {
                Alert.alert('Thành công', 'Đã lưu voucher vào kho của bạn!');
                // Update local state
                setSavedVoucherIds(prev => new Set([...prev, voucher.id]));
                await fetchSavedVouchers();
            } else {
                Alert.alert('Lỗi', result.message);
            }
        } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể lưu voucher');
        } finally {
            setSavingVoucherId(null);
        }
    };

    const handleRemoveVoucher = async (voucherId: number) => {
        if (!user?.id) return;

        Alert.alert(
            'Xác nhận',
            'Bạn có chắc muốn xóa voucher này khỏi kho?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userVoucherService.removeVoucher(user.id, voucherId);
                            setSavedVoucherIds(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(voucherId);
                                return newSet;
                            });
                            await fetchSavedVouchers();
                            Alert.alert('Thành công', 'Đã xóa voucher');
                        } catch (err) {
                            Alert.alert('Lỗi', 'Không thể xóa voucher');
                        }
                    },
                },
            ]
        );
    };

    // =================== RENDER FUNCTIONS =====================

    const renderTab = (tab: TabType, label: string, count?: number) => {
        const isActive = activeTab === tab;
        return (
            <TouchableOpacity
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
            >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {label}
                </Text>
                {count !== undefined && count > 0 && (
                    <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                        <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                            {count}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderVoucherItem = ({ item }: { item: Voucher }) => {
        const isSaved = savedVoucherIds.has(item.id);
        const isSaving = savingVoucherId === item.id;

        return (
            <View style={styles.voucherItemContainer}>
                <VoucherCard
                    voucher={item}
                    showSelectButton={false}
                    compact={false}
                />
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        isSaved && styles.savedButton,
                        isSaving && styles.savingButton,
                    ]}
                    onPress={() => handleSaveVoucher(item)}
                    disabled={isSaved || isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons
                                name={isSaved ? 'checkmark-circle' : 'bookmark-outline'}
                                size={16}
                                color={isSaved ? '#FFFFFF' : '#5B9EE1'}
                            />
                            <Text style={[styles.saveButtonText, isSaved && styles.savedButtonText]}>
                                {isSaved ? 'Đã lưu' : 'Lưu'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const renderSavedVoucherItem = ({ item }: { item: UserVoucher }) => {
        const mockVoucher: Voucher = {
            id: item.voucherId,
            code: item.voucherCode,
            discount: item.discount,
            discountType: item.discountType,
            minOrderAmount: item.minOrderAmount,
            maxDiscountAmount: item.maxDiscountAmount,
            expiryDate: item.expiryDate,
            description: item.description,
            usageLimit: item.usageLimit || 1,
            usedCount: item.usedCount || 0,
            isActive: item.isValid,
        };

        // Số lần còn có thể sử dụng
        const remainingUses = (item.usageLimit || 1) - (item.usedCount || 0);
        const isFullyUsed = remainingUses <= 0;

        return (
            <View style={styles.voucherItemContainer}>
                <VoucherCard
                    voucher={mockVoucher}
                    showSelectButton={false}
                    compact={false}
                />
                <View style={styles.savedVoucherActions}>
                    {/* Hiển thị số lần còn có thể sử dụng */}
                    {item.usageLimit > 1 && (
                        <View style={[
                            styles.usageCountBadge,
                            isFullyUsed && styles.usageCountBadgeExhausted
                        ]}>
                            <Ionicons 
                                name="ticket-outline" 
                                size={14} 
                                color={isFullyUsed ? '#94A3B8' : '#5B9EE1'} 
                            />
                            <Text style={[
                                styles.usageCountText,
                                isFullyUsed && styles.usageCountTextExhausted
                            ]}>
                                Còn {remainingUses}/{item.usageLimit} lượt
                            </Text>
                        </View>
                    )}
                    
                    {isFullyUsed || item.isUsed ? (
                        <View style={styles.usedBadge}>
                            <Ionicons name="checkmark-done" size={14} color="#64748B" />
                            <Text style={styles.usedBadgeText}>Đã sử dụng</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveVoucher(item.voucherId)}
                        >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyState = () => {
        const isAllTab = activeTab === 'all';
        return (
            <View style={styles.emptyContainer}>
                <Ionicons
                    name={isAllTab ? 'pricetag-outline' : 'bookmark-outline'}
                    size={64}
                    color="#CBD5E1"
                />
                <Text style={styles.emptyTitle}>
                    {isAllTab ? 'Chưa có mã giảm giá' : 'Chưa có voucher nào'}
                </Text>
                <Text style={styles.emptyText}>
                    {isAllTab
                        ? 'Hiện tại chưa có mã giảm giá nào. Hãy quay lại sau nhé!'
                        : 'Bạn chưa lưu voucher nào. Hãy lưu voucher từ tab "Tất cả voucher"!'}
                </Text>
                {!isAllTab && (
                    <TouchableOpacity
                        style={styles.goToAllButton}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text style={styles.goToAllButtonText}>Xem tất cả voucher</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderContent = () => {
        const currentLoading = activeTab === 'all' ? loading : savedVouchersLoading;
        const currentData = activeTab === 'all' ? vouchers : savedVouchers;

        if (currentLoading && currentData.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5B9EE1" />
                    <Text style={styles.loadingText}>Đang tải mã giảm giá...</Text>
                </View>
            );
        }

        if (error && activeTab === 'all' && vouchers.length === 0) {
            return (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            );
        }

        if (currentData.length === 0) {
            return renderEmptyState();
        }

        if (activeTab === 'all') {
            return (
                <FlatList
                    data={vouchers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderVoucherItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#5B9EE1']}
                            tintColor="#5B9EE1"
                        />
                    }
                />
            );
        }

        return (
            <FlatList
                data={savedVouchers}
                keyExtractor={(item) => item.id?.toString() || item.voucherId?.toString()}
                renderItem={renderSavedVoucherItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#5B9EE1']}
                        tintColor="#5B9EE1"
                    />
                }
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/(main)/profile')}
                >
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mã giảm giá</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {renderTab('all', 'Tất cả voucher', vouchers.length)}
                {/* Đếm tổng số lượt voucher còn dùng được */}
                {renderTab('saved', 'Voucher của tôi', 
                    savedVouchers.reduce((total, v) => {
                        const remaining = (v.usageLimit || 1) - (v.usedCount || 0);
                        return total + (remaining > 0 ? remaining : 0);
                    }, 0)
                )}
            </View>

            {/* Info Banner (only for All tab) */}
            {activeTab === 'all' && (
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        Nhấn "Lưu" để lưu voucher vào kho của bạn
                    </Text>
                </View>
            )}

            {/* Content */}
            {renderContent()}
        </SafeAreaView>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerRight: {
        width: 40,
    },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginHorizontal: 4,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    tabActive: {
        backgroundColor: '#5B9EE1',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    tabBadge: {
        marginLeft: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: '#E2E8F0',
    },
    tabBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    tabBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    tabBadgeTextActive: {
        color: '#FFFFFF',
    },

    // Info Banner
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },

    // List
    listContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    voucherItemContainer: {
        marginBottom: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginTop: -8,
        marginHorizontal: 16,
        marginBottom: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#5B9EE1',
        backgroundColor: '#FFFFFF',
    },
    savedButton: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    savingButton: {
        backgroundColor: '#94A3B8',
        borderColor: '#94A3B8',
    },
    saveButtonText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#5B9EE1',
    },
    savedButtonText: {
        color: '#FFFFFF',
    },
    savedVoucherActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        marginTop: -8,
    },
    removeButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
    },
    usedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    usedBadgeText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#64748B',
    },
    usageCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#EBF5FF',
        marginRight: 8,
    },
    usageCountBadgeExhausted: {
        backgroundColor: '#F1F5F9',
    },
    usageCountText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#5B9EE1',
    },
    usageCountTextExhausted: {
        color: '#94A3B8',
    },

    // Loading & Error
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
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
    },
    goToAllButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#5B9EE1',
        borderRadius: 10,
    },
    goToAllButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
