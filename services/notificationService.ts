/**
 * Notification Service - React Native
 * ====================================
 * Handles notifications API calls and polling for updates
 * 
 * NOTE: Không dùng WebSocket STOMP vì nó không hoạt động tốt với React Native.
 * Thay vào đó, sử dụng polling để lấy notifications mới.
 * Nếu cần realtime, có thể tích hợp Firebase Cloud Messaging (FCM) sau.
 */

import { api, getStoredUser, getToken } from './api';

// =================== TYPES =====================

export interface NotificationDto {
    id: number;
    type: string;
    title: string;
    content: string;
    level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    action_url?: string;
    metadata?: Record<string, any>;
    is_read: boolean;
    read_at?: string;
    created_at: string;
    recipient_type: 'USER' | 'ADMIN';
    recipient_id?: number;
    ticket_id?: number;
    ticket_code?: string;
}

export interface NotificationListResponse {
    content: NotificationDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
}

export interface UnreadCountResponse {
    unread_count: number;
}

// =================== API CALLS =====================

/**
 * Lấy danh sách thông báo của user hiện tại
 */
export const getMyNotifications = async (
    page: number = 0,
    size: number = 20,
    unreadOnly: boolean = false
): Promise<NotificationListResponse> => {
    const response = await api.get<NotificationListResponse>('/api/notifications/me', {
        params: { page, size, unreadOnly }
    });
    return response.data;
};

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCount = async (): Promise<number> => {
    try {
        const response = await api.get<UnreadCountResponse>('/api/notifications/me/unread-count');
        return response.data.unread_count;
    } catch (error) {
        console.error('[NotificationService] Error getting unread count:', error);
        return 0;
    }
};

/**
 * Đánh dấu một thông báo đã đọc
 */
export const markAsRead = async (notificationId: number): Promise<boolean> => {
    try {
        const response = await api.post<{ success: boolean }>(`/api/notifications/me/${notificationId}/read`);
        return response.data.success;
    } catch (error) {
        console.error('[NotificationService] Error marking as read:', error);
        return false;
    }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export const markAllAsRead = async (): Promise<number> => {
    try {
        const response = await api.post<{ markedCount: number }>('/api/notifications/me/read-all');
        return response.data.markedCount;
    } catch (error) {
        console.error('[NotificationService] Error marking all as read:', error);
        return 0;
    }
};

// =================== POLLING SERVICE =====================

type NotificationCallback = (notification: NotificationDto) => void;
type UnreadCountCallback = (count: number) => void;

class NotificationPollingService {
    private pollingInterval: NodeJS.Timeout | null = null;
    private unreadCountCallbacks: UnreadCountCallback[] = [];
    private notificationCallbacks: NotificationCallback[] = [];
    private lastUnreadCount: number = 0;
    private lastNotificationId: number = 0;
    private isPolling: boolean = false;
    private userId: number | null = null;

    /**
     * Bắt đầu polling để lấy notifications mới
     * @param intervalMs Thời gian giữa các lần poll (mặc định 15 giây)
     */
    async startPolling(intervalMs: number = 15000): Promise<void> {
        if (this.isPolling) {
            console.log('[NotificationPolling] Already polling');
            return;
        }

        try {
            const token = await getToken();
            const user = await getStoredUser();

            if (!token || !user) {
                console.log('[NotificationPolling] No token or user, skipping');
                return;
            }

            this.userId = user.id;
            this.isPolling = true;

            // Initial fetch
            await this.poll();

            // Start interval polling
            this.pollingInterval = setInterval(() => {
                this.poll();
            }, intervalMs);

            console.log('[NotificationPolling] Started polling every', intervalMs / 1000, 'seconds');
        } catch (error) {
            console.error('[NotificationPolling] Error starting:', error);
        }
    }

    /**
     * Dừng polling
     */
    stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
        this.userId = null;
        console.log('[NotificationPolling] Stopped');
    }

    /**
     * Thực hiện một lần poll
     */
    private async poll(): Promise<void> {
        try {
            // Get unread count
            const count = await getUnreadCount();
            
            if (count !== this.lastUnreadCount) {
                this.lastUnreadCount = count;
                this.notifyUnreadCount(count);
            }

            // Check for new notifications
            if (count > 0) {
                const response = await getMyNotifications(0, 5, true);
                
                if (response.content.length > 0) {
                    const latestId = response.content[0].id;
                    
                    // If there's a new notification
                    if (latestId > this.lastNotificationId) {
                        this.lastNotificationId = latestId;
                        
                        // Notify about the new notification
                        this.notifyNotification(response.content[0]);
                    }
                }
            }
        } catch (error) {
            console.error('[NotificationPolling] Poll error:', error);
        }
    }

    /**
     * Đăng ký callback nhận notification mới
     */
    onNotification(callback: NotificationCallback): () => void {
        this.notificationCallbacks.push(callback);
        return () => {
            const idx = this.notificationCallbacks.indexOf(callback);
            if (idx > -1) this.notificationCallbacks.splice(idx, 1);
        };
    }

    /**
     * Đăng ký callback nhận unread count update
     */
    onUnreadCount(callback: UnreadCountCallback): () => void {
        this.unreadCountCallbacks.push(callback);
        
        // Immediately call with current count
        callback(this.lastUnreadCount);
        
        return () => {
            const idx = this.unreadCountCallbacks.indexOf(callback);
            if (idx > -1) this.unreadCountCallbacks.splice(idx, 1);
        };
    }

    // Notify callbacks
    private notifyNotification(notification: NotificationDto): void {
        this.notificationCallbacks.forEach(cb => cb(notification));
    }

    private notifyUnreadCount(count: number): void {
        this.unreadCountCallbacks.forEach(cb => cb(count));
    }

    /**
     * Kiểm tra trạng thái polling
     */
    isActive(): boolean {
        return this.isPolling;
    }

    /**
     * Force refresh ngay lập tức
     */
    async refresh(): Promise<void> {
        await this.poll();
    }

    /**
     * Giảm unread count locally (sau khi mark read)
     */
    decrementUnreadCount(): void {
        if (this.lastUnreadCount > 0) {
            this.lastUnreadCount--;
            this.notifyUnreadCount(this.lastUnreadCount);
        }
    }

    /**
     * Reset unread count về 0 (sau khi mark all read)
     */
    resetUnreadCount(): void {
        this.lastUnreadCount = 0;
        this.notifyUnreadCount(0);
    }
}

// Singleton instance
export const notificationPolling = new NotificationPollingService();

// Alias for backward compatibility
export const notificationWS = {
    connect: () => notificationPolling.startPolling(),
    disconnect: () => notificationPolling.stopPolling(),
    isConnected: () => notificationPolling.isActive(),
    onNotification: (cb: NotificationCallback) => notificationPolling.onNotification(cb),
    onUnreadCount: (cb: UnreadCountCallback) => notificationPolling.onUnreadCount(cb),
    onConnectionStatus: (_cb: (connected: boolean) => void) => {
        // Polling is always "connected" when active
        return () => {};
    },
};

// =================== HELPER FUNCTIONS =====================

/**
 * Lấy icon dựa theo notification type
 */
export const getNotificationIcon = (type: string): string => {
    switch (type) {
        case 'ORDER_CREATED':
        case 'ORDER_NEW':
        case 'ORDER_CONFIRMED':
            return '🛒';
        case 'ORDER_SHIPPING':
            return '🚚';
        case 'ORDER_DELIVERED':
            return '✅';
        case 'ORDER_CANCELLED':
            return '❌';
        case 'PAYMENT_SUCCESS':
            return '💳';
        case 'PAYMENT_FAILED':
            return '⚠️';
        case 'CHAT_NEW_MESSAGE':
            return '💬';
        case 'NEW_TICKET':
        case 'NEW_MESSAGE':
            return '🎫';
        case 'VOUCHER_RECEIVED':
        case 'MINIGAME_WIN':
            return '🎁';
        case 'REVIEW_NEW':
        case 'REVIEW_REPLY':
            return '⭐';
        case 'SYSTEM_ANNOUNCEMENT':
            return '📢';
        default:
            return '🔔';
    }
};

/**
 * Lấy màu dựa theo notification level
 */
export const getNotificationColor = (level: string): string => {
    switch (level) {
        case 'SUCCESS':
            return '#22c55e'; // green
        case 'WARNING':
            return '#f59e0b'; // yellow
        case 'ERROR':
            return '#ef4444'; // red
        case 'INFO':
        default:
            return '#3b82f6'; // blue
    }
};

/**
 * Format thời gian notification
 */
export const formatNotificationTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    return date.toLocaleDateString('vi-VN');
};
