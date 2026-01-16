/**
 * Notifications Screen
 * ====================
 * Màn hình hiển thị danh sách thông báo của user
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    useNotifications,
} from '../../hooks/useNotifications';
import {
    NotificationDto,
    formatNotificationTime,
    getNotificationColor,
    getNotificationIcon,
} from '../../services/notificationService';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const {
        notifications,
        unreadCount,
        loading,
        error,
        hasMore,
        connected,
        loadMore,
        refresh,
        markAsRead,
        markAllAsRead,
    } = useNotifications({ autoConnect: true, autoLoad: true });

    // Handle notification press
    const handleNotificationPress = useCallback(async (notification: NotificationDto) => {
        // Mark as read nếu chưa đọc
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigate based on action_url
        if (notification.action_url) {
            const url = notification.action_url;
            
            // Parse action_url và navigate
            if (url.startsWith('/orders/')) {
                const orderId = url.replace('/orders/', '');
                router.push(`/product/order-status?orderId=${orderId}`);
            } else if (url.startsWith('/vouchers')) {
                router.push('/account/vouchers');
            } else if (url.startsWith('/support/')) {
                const ticketId = url.replace('/support/', '');
                router.push(`/account/support?ticketId=${ticketId}`);
            } else if (url.startsWith('/chat/')) {
                router.push('/chat');
            } else {
                // Default navigation
                console.log('[Notifications] Unknown action_url:', url);
            }
        }
    }, [markAsRead, router]);

    // Render notification item
    const renderItem = useCallback(({ item }: { item: NotificationDto }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.is_read && styles.unreadItem,
            ]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            {/* Icon */}
            <View style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(item.level) + '20' }
            ]}>
                <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.is_read && styles.unreadTitle]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.content} numberOfLines={2}>
                    {item.content}
                </Text>
                <Text style={styles.time}>
                    {formatNotificationTime(item.created_at)}
                </Text>
            </View>

            {/* Arrow */}
            {item.action_url && (
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            )}
        </TouchableOpacity>
    ), [handleNotificationPress]);

    // Render header
    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thông báo</Text>
            {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                    <Text style={styles.markAllText}>Đọc tất cả</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // Render empty state
    const renderEmptyState = () => {
        if (loading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
                <Text style={styles.emptySubtitle}>
                    Các thông báo về đơn hàng, khuyến mãi sẽ xuất hiện ở đây
                </Text>
            </View>
        );
    };

    // Render footer (loading more)
    const renderFooter = () => {
        if (!hasMore || notifications.length === 0) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#6366f1" />
            </View>
        );
    };

    // Connection status indicator
    const renderConnectionStatus = () => {
        if (connected) return null;

        return (
            <View style={styles.connectionBanner}>
                <Ionicons name="cloud-offline-outline" size={16} color="#f59e0b" />
                <Text style={styles.connectionText}>Đang kết nối realtime...</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderHeader()}
            {renderConnectionStatus()}

            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={refresh}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && notifications.length === 0}
                        onRefresh={refresh}
                        colors={['#6366f1']}
                        tintColor="#6366f1"
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginLeft: 12,
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#eef2ff',
        borderRadius: 16,
    },
    markAllText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6366f1',
    },
    connectionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: '#fef3c7',
        gap: 6,
    },
    connectionText: {
        fontSize: 13,
        color: '#92400e',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#fef2f2',
        gap: 12,
    },
    errorText: {
        fontSize: 13,
        color: '#991b1b',
    },
    retryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366f1',
    },
    list: {
        paddingVertical: 8,
    },
    emptyList: {
        flex: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
    },
    unreadItem: {
        backgroundColor: '#f0f9ff',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 20,
    },
    contentContainer: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
        flex: 1,
    },
    unreadTitle: {
        color: '#1f2937',
        fontWeight: '600',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6366f1',
    },
    content: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginLeft: 72,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});
