/**
 * Payment History Screen
 * Màn hình lịch sử thanh toán
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    formatCurrency,
    getDisplayTime,
    getGatewayDisplayName,
    getMyPaymentHistory,
    getStatusColor,
    PaymentHistoryItem,
    PaymentStatus,
} from '../../services/paymentHistoryService';

// ==================== CONSTANTS ====================

const STATUS_FILTERS: { label: string; value: PaymentStatus | 'ALL' }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Thành công', value: 'SUCCESS' },
    { label: 'Đang xử lý', value: 'PENDING' },
    { label: 'Thất bại', value: 'FAILED' },
];

// ==================== COMPONENT ====================

export default function PaymentHistoryScreen() {
    const router = useRouter();

    // State
    const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'ALL'>('ALL');
    const [error, setError] = useState<string | null>(null);

    // ==================== DATA FETCHING ====================

    const fetchPayments = useCallback(async (pageNum: number = 0, refresh: boolean = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
                setError(null);
            } else if (pageNum === 0) {
                setLoading(true);
                setError(null);
            } else {
                setLoadingMore(true);
            }

            const status = selectedStatus === 'ALL' ? undefined : selectedStatus;
            const response = await getMyPaymentHistory(pageNum, 10, status);

            if (refresh || pageNum === 0) {
                setPayments(response.content);
            } else {
                setPayments(prev => [...prev, ...response.content]);
            }

            setHasMore(!response.last);
            setPage(pageNum);

        } catch (err: any) {
            console.error('Error fetching payment history:', err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải lịch sử thanh toán');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [selectedStatus]);

    // Initial load
    useEffect(() => {
        fetchPayments(0, false);
    }, [fetchPayments]);

    // Reload when filter changes
    useEffect(() => {
        setPayments([]);
        setPage(0);
        setHasMore(true);
        fetchPayments(0, false);
    }, [selectedStatus]);

    // ==================== HANDLERS ====================

    const handleRefresh = () => {
        fetchPayments(0, true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && !loading) {
            fetchPayments(page + 1, false);
        }
    };

    const handlePaymentPress = (payment: PaymentHistoryItem) => {
        router.push({
            pathname: '/account/payment-detail',
            params: { paymentId: payment.id.toString() }
        });
    };

    // ==================== RENDER FUNCTIONS ====================

    const renderStatusFilter = () => (
        <View style={styles.filterContainer}>
            {STATUS_FILTERS.map((filter) => (
                <TouchableOpacity
                    key={filter.value}
                    style={[
                        styles.filterButton,
                        selectedStatus === filter.value && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedStatus(filter.value)}
                >
                    <Text style={[
                        styles.filterText,
                        selectedStatus === filter.value && styles.filterTextActive,
                    ]}>
                        {filter.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderPaymentItem = ({ item }: { item: PaymentHistoryItem }) => (
        <TouchableOpacity
            style={styles.paymentCard}
            onPress={() => handlePaymentPress(item)}
            activeOpacity={0.7}
        >
            {/* Header: Gateway + Status */}
            <View style={styles.cardHeader}>
                <View style={styles.gatewayContainer}>
                    <Ionicons 
                        name={getGatewayIcon(item.paymentGateway)} 
                        size={20} 
                        color="#6366F1" 
                    />
                    <Text style={styles.gatewayText}>
                        {getGatewayDisplayName(item.paymentGateway)}
                    </Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) + '20' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: getStatusColor(item.status) }
                    ]}>
                        {item.statusDisplay}
                    </Text>
                </View>
            </View>

            {/* Order Code */}
            <Text style={styles.orderCode}>
                Đơn hàng: #{item.orderCode || item.orderId}
            </Text>

            {/* Amount + Time */}
            <View style={styles.cardFooter}>
                <Text style={styles.amount}>
                    {formatCurrency(item.amount)}
                </Text>
                <Text style={styles.time}>
                    {getDisplayTime(item)}
                </Text>
            </View>

            {/* Arrow indicator */}
            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Chưa có lịch sử thanh toán</Text>
            <Text style={styles.emptySubtitle}>
                Các giao dịch thanh toán của bạn sẽ xuất hiện ở đây
            </Text>
            <TouchableOpacity 
                style={styles.shopButton}
                onPress={() => router.back()}
            >
                <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
            </TouchableOpacity>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#6366F1" />
            </View>
        );
    };

    const renderError = () => (
        <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchPayments(0, true)}
            >
                <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
        </View>
    );

    // ==================== MAIN RENDER ====================

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Status Filter */}
            {renderStatusFilter()}

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : error ? (
                renderError()
            ) : (
                <FlatList
                    data={payments}
                    renderItem={renderPaymentItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[
                        styles.listContent,
                        payments.length === 0 && styles.emptyListContent
                    ]}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={renderFooter}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#6366F1']}
                            tintColor="#6366F1"
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

// ==================== HELPERS ====================

const getGatewayIcon = (gateway: string | null): keyof typeof Ionicons.glyphMap => {
    if (!gateway) return 'card-outline';
    switch (gateway.toUpperCase()) {
        case 'VNPAY':
            return 'card';
        case 'MOMO':
            return 'wallet';
        case 'COD':
            return 'cash';
        default:
            return 'card-outline';
    }
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    headerRight: {
        width: 40,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    filterButtonActive: {
        backgroundColor: '#6366F1',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    emptyListContent: {
        flex: 1,
    },
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    gatewayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    gatewayText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderCode: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    time: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    arrowContainer: {
        position: 'absolute',
        right: 16,
        top: '50%',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
    shopButton: {
        marginTop: 24,
        backgroundColor: '#6366F1',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    shopButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    loadingFooter: {
        paddingVertical: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
    },
    retryButton: {
        marginTop: 24,
        backgroundColor: '#6366F1',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
