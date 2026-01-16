/**
 * Notifications Screen - Thông báo hỗ trợ
 */

import { useAuth } from '@/context/AuthContext';
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    NotificationType,
    SupportNotification,
} from '@/services/supportService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const NotificationsScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<SupportNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const result = await getNotifications(user.id);
            setNotifications(result.notifications);
            setUnreadCount(result.unreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, [user?.id]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, [user?.id]);

    const handleMarkAllRead = async () => {
        if (!user?.id) return;
        try {
            await markAllNotificationsAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationPress = async (notification: SupportNotification) => {
        if (!user?.id) return;
        if (!notification.is_read) {
            await markNotificationAsRead(notification.id, user.id);
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        if (notification.ticket_id) {
            router.push({ pathname: '/account/support/ticket-detail', params: { ticketId: notification.ticket_id } });
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'NEW_MESSAGE': return 'chatbubble';
            case 'STATUS_CHANGED': return 'sync';
            case 'TICKET_ASSIGNED': return 'person-add';
            default: return 'notifications';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }: { item: SupportNotification }) => (
        <TouchableOpacity
            style={[styles.item, !item.is_read && styles.itemUnread]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={[styles.iconWrap, !item.is_read && { backgroundColor: '#dcfce7' }]}>
                <Ionicons name={getIcon(item.type) as any} size={20} color={item.is_read ? '#9ca3af' : '#10b981'} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.title, !item.is_read && { fontWeight: '700' }]}>{item.title}</Text>
                <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
                <Text style={styles.time}>{formatDate(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={styles.dot} />}
        </TouchableOpacity>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10b981" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Thông báo hỗ trợ',
                    headerRight: () => unreadCount > 0 ? (
                        <TouchableOpacity onPress={handleMarkAllRead}>
                            <Text style={{ color: '#fff', fontSize: 14 }}>Đọc tất cả</Text>
                        </TouchableOpacity>
                    ) : null,
                }}
            />
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ flexGrow: 1, padding: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#10b981']} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                    </View>
                }
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    item: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, gap: 12, alignItems: 'flex-start' },
    itemUnread: { backgroundColor: '#f0fdf4' },
    iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
    content: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    time: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginTop: 4 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 12 },
});

export default NotificationsScreen;
