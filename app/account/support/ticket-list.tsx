/**
 * Ticket List Screen - Danh sách yêu cầu hỗ trợ
 * =============================================
 */

import { useAuth } from '@/context/AuthContext';
import {
    getUserTickets,
    PRIORITY_COLORS,
    STATUS_COLORS,
    STATUS_LABELS,
    SupportTicket,
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

const TicketListScreen = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTickets = async () => {
        if (!user?.id) return;

        try {
            const result = await getUserTickets(user.id);
            setTickets(result.tickets);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [user?.id]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTickets();
    }, [user?.id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderTicketItem = ({ item }: { item: SupportTicket }) => (
        <TouchableOpacity
            style={styles.ticketItem}
            onPress={() =>
                router.push({
                    pathname: '/account/support/ticket-detail',
                    params: { ticketId: item.id },
                })
            }
            activeOpacity={0.7}
        >
            <View style={styles.ticketHeader}>
                <View style={styles.ticketCode}>
                    <Text style={styles.ticketCodeText}>{item.ticket_code}</Text>
                    {(item.unread_count ?? 0) > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unread_count}</Text>
                        </View>
                    )}
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: STATUS_COLORS[item.status] + '20' },
                    ]}
                >
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: STATUS_COLORS[item.status] },
                        ]}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            { color: STATUS_COLORS[item.status] },
                        ]}
                    >
                        {STATUS_LABELS[item.status]}
                    </Text>
                </View>
            </View>

            <Text style={styles.ticketSubject} numberOfLines={2}>
                {item.subject}
            </Text>

            <View style={styles.ticketMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                    <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
                </View>
                {item.order_code && (
                    <View style={styles.metaItem}>
                        <Ionicons name="receipt-outline" size={14} color="#9ca3af" />
                        <Text style={styles.metaText}>#{item.order_code}</Text>
                    </View>
                )}
            </View>

            {item.last_message_at && (
                <View style={styles.lastMessage}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6b7280" />
                    <Text style={styles.lastMessageText}>
                        Tin nhắn cuối: {formatDate(item.last_message_at)}
                    </Text>
                </View>
            )}

            <View style={styles.priorityIndicator}>
                <View
                    style={[
                        styles.priorityBar,
                        { backgroundColor: PRIORITY_COLORS[item.priority] },
                    ]}
                />
            </View>
        </TouchableOpacity>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
            <Text style={styles.emptyDescription}>
                Bạn chưa gửi yêu cầu hỗ trợ nào. Hãy tạo yêu cầu mới nếu cần hỗ trợ.
            </Text>
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/account/support/create-ticket')}
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Tạo yêu cầu mới</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Lịch sử yêu cầu',
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push('/account/support/create-ticket')}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <FlatList
                data={tickets}
                renderItem={renderTicketItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#10b981']}
                        tintColor="#10b981"
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
    },
    ticketItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ticketCode: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ticketCodeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    unreadBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    ticketSubject: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
        lineHeight: 22,
    },
    ticketMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    lastMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    lastMessageText: {
        fontSize: 12,
        color: '#6b7280',
    },
    priorityIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    priorityBar: {
        flex: 1,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 20,
        gap: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default TicketListScreen;
