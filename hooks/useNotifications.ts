/**
 * useNotifications Hook
 * =====================
 * Hook để quản lý notifications trong app
 * - Sử dụng polling thay vì WebSocket
 * - Auto refresh
 * - Badge count
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getMyNotifications,
    getUnreadCount,
    markAllAsRead as markAllAsReadApi,
    markAsRead as markAsReadApi,
    NotificationDto,
    NotificationListResponse,
    notificationPolling,
} from '../services/notificationService';

interface UseNotificationsOptions {
    /** Tự động bắt đầu polling khi mount */
    autoConnect?: boolean;
    /** Tự động load notifications khi mount */
    autoLoad?: boolean;
    /** Số notifications per page */
    pageSize?: number;
}

interface UseNotificationsReturn {
    /** Danh sách notifications */
    notifications: NotificationDto[];
    /** Số thông báo chưa đọc */
    unreadCount: number;
    /** Đang loading */
    loading: boolean;
    /** Error nếu có */
    error: string | null;
    /** Polling đang active */
    connected: boolean;
    /** Có thêm page không */
    hasMore: boolean;
    /** Load thêm notifications */
    loadMore: () => Promise<void>;
    /** Refresh toàn bộ */
    refresh: () => Promise<void>;
    /** Đánh dấu đã đọc 1 notification */
    markAsRead: (id: number) => Promise<void>;
    /** Đánh dấu tất cả đã đọc */
    markAllAsRead: () => Promise<void>;
    /** Bắt đầu polling */
    connect: () => Promise<void>;
    /** Dừng polling */
    disconnect: () => void;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
    const {
        autoConnect = true,
        autoLoad = true,
        pageSize = 20,
    } = options;

    const { isAuthenticated, user } = useAuth();

    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);

    const isMounted = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Load notifications từ API
    const loadNotifications = useCallback(async (pageNum: number = 0, isRefresh: boolean = false) => {
        if (!isAuthenticated) return;

        try {
            setLoading(true);
            setError(null);

            const response: NotificationListResponse = await getMyNotifications(pageNum, pageSize);

            if (isMounted.current) {
                if (isRefresh || pageNum === 0) {
                    setNotifications(response.content);
                } else {
                    setNotifications(prev => [...prev, ...response.content]);
                }
                setHasMore(response.hasNext);
                setPage(pageNum);
            }
        } catch (err: any) {
            if (isMounted.current) {
                setError(err.message || 'Không thể tải thông báo');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [isAuthenticated, pageSize]);

    // Load unread count
    const loadUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const count = await getUnreadCount();
            if (isMounted.current) {
                setUnreadCount(count);
            }
        } catch (err) {
            console.error('[useNotifications] Error loading unread count:', err);
        }
    }, [isAuthenticated]);

    // Start polling
    const connect = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            await notificationPolling.startPolling(15000);
            setConnected(true);
        } catch (err) {
            console.error('[useNotifications] Polling start error:', err);
        }
    }, [isAuthenticated]);

    // Stop polling
    const disconnect = useCallback(() => {
        notificationPolling.stopPolling();
        setConnected(false);
    }, []);

    // Refresh
    const refresh = useCallback(async () => {
        await loadNotifications(0, true);
        await loadUnreadCount();
    }, [loadNotifications, loadUnreadCount]);

    // Load more
    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;
        await loadNotifications(page + 1, false);
    }, [loading, hasMore, page, loadNotifications]);

    // Mark as read
    const markAsRead = useCallback(async (id: number) => {
        try {
            await markAsReadApi(id);
            
            if (isMounted.current) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
                notificationPolling.decrementUnreadCount();
            }
        } catch (err: any) {
            console.error('[useNotifications] Mark as read error:', err);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await markAllAsReadApi();
            
            if (isMounted.current) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
                setUnreadCount(0);
                notificationPolling.resetUnreadCount();
            }
        } catch (err: any) {
            console.error('[useNotifications] Mark all as read error:', err);
        }
    }, []);

    // Setup polling listeners
    useEffect(() => {
        if (!isAuthenticated) return;

        // Listen for new notifications
        const unsubNotif = notificationPolling.onNotification((notification) => {
            if (isMounted.current) {
                // Thêm notification mới vào đầu list
                setNotifications(prev => [notification, ...prev.filter(n => n.id !== notification.id)]);
            }
        });

        // Listen for unread count updates
        const unsubCount = notificationPolling.onUnreadCount((count) => {
            if (isMounted.current) {
                setUnreadCount(count);
            }
        });

        return () => {
            unsubNotif();
            unsubCount();
        };
    }, [isAuthenticated]);

    // Auto connect và load khi login
    useEffect(() => {
        if (!isAuthenticated) {
            // Reset state khi logout
            setNotifications([]);
            setUnreadCount(0);
            setConnected(false);
            disconnect();
            return;
        }

        if (autoLoad) {
            loadNotifications(0, true);
            loadUnreadCount();
        }

        if (autoConnect) {
            connect().then(() => setConnected(true));
        }
    }, [isAuthenticated, autoLoad, autoConnect, loadNotifications, loadUnreadCount, connect, disconnect]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        connected,
        hasMore,
        loadMore,
        refresh,
        markAsRead,
        markAllAsRead,
        connect,
        disconnect,
    };
}

// =================== Badge Hook (for header) =====================

/**
 * Hook đơn giản chỉ để lấy unread count (cho notification badge)
 */
export function useNotificationBadge() {
    const [unreadCount, setUnreadCount] = useState(0);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }

        // Initial load
        getUnreadCount().then(setUnreadCount).catch(() => {});

        // Listen for updates
        const unsubCount = notificationPolling.onUnreadCount(setUnreadCount);

        return () => {
            unsubCount();
        };
    }, [isAuthenticated]);

    return unreadCount;
}
