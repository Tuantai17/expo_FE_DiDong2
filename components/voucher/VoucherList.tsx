/**
 * VoucherList - Component danh sách vouchers
 * ===========================================
 * FlatList với pull-to-refresh, loading, empty state
 */

import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Voucher } from '../../services/voucherService';
import VoucherCard from './VoucherCard';

// =================== TYPES =====================

interface VoucherListProps {
    vouchers: Voucher[];
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => Promise<void>;
    onSelectVoucher?: (voucher: Voucher) => void;
    showSelectButton?: boolean;
    emptyMessage?: string;
    compact?: boolean;
}

// =================== COMPONENT =====================

export function VoucherList({
    vouchers,
    loading = false,
    error = null,
    onRefresh,
    onSelectVoucher,
    showSelectButton = true,
    emptyMessage = 'Không có mã giảm giá nào',
    compact = false,
}: VoucherListProps) {
    const [refreshing, setRefreshing] = React.useState(false);

    // Handle pull-to-refresh
    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            await onRefresh();
            setRefreshing(false);
        }
    };

    // =================== RENDER =====================

    // Loading state
    if (loading && vouchers.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5B9EE1" />
                <Text style={styles.loadingText}>Đang tải mã giảm giá...</Text>
            </View>
        );
    }

    // Error state
    if (error && vouchers.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    // Empty state
    if (vouchers.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="pricetag-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Chưa có mã giảm giá</Text>
                <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
        );
    }

    // List
    return (
        <FlatList
            data={vouchers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <VoucherCard
                    voucher={item}
                    onSelect={onSelectVoucher}
                    showSelectButton={showSelectButton}
                    compact={compact}
                />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#5B9EE1']}
                        tintColor="#5B9EE1"
                    />
                ) : undefined
            }
        />
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
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
});

export default VoucherList;
