/**
 * Support Service - API cho module Trợ giúp & Hỗ trợ
 * =====================================================
 * Xử lý tất cả API liên quan đến support tickets
 */

import { Platform } from 'react-native';
import { api, BASE_URL } from './api';

// =================== TYPES ===================

export interface SupportTicket {
    id: number;
    ticket_code: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    user_id: number;
    user_name: string;
    user_email: string;
    assigned_admin_id: number | null;
    assigned_admin_name: string | null;
    order_id: number | null;
    order_code: string | null;
    last_message_at: string | null;
    created_at: string;
    updated_at: string;
    unread_count?: number;
}

export interface SupportMessage {
    id: number;
    ticket_id: number;
    sender_id: number;
    sender_name: string;
    sender_avatar: string | null;
    sender_role: 'USER' | 'ADMIN';
    content: string;
    attachment_url: string | null;
    attachment_urls?: string[]; // Multiple attachments
    is_read: boolean;
    created_at: string;
}

export interface TicketDetail extends SupportTicket {
    messages: SupportMessage[];
}

export interface SupportNotification {
    id: number;
    user_id: number;
    ticket_id: number | null;
    ticket_code: string | null;
    type: NotificationType;
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationType = 'NEW_TICKET' | 'NEW_MESSAGE' | 'STATUS_CHANGED' | 'TICKET_ASSIGNED';

export interface CreateTicketRequest {
    subject: string;
    content: string;
    orderId?: number;
    priority?: TicketPriority;
    attachmentUrl?: string;
    attachmentUrls?: string[];
}

export interface SendMessageRequest {
    content: string;
    attachmentUrl?: string;
    attachmentUrls?: string[];
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    totalElements?: number;
    totalPages?: number;
    currentPage?: number;
}

export interface UploadResponse {
    success: boolean;
    url: string;
    filename: string;
}

export interface MultiUploadResponse {
    success: boolean;
    files: { url: string; filename: string }[];
    count: number;
}

// =================== STATUS HELPERS ===================

export const STATUS_LABELS: Record<TicketStatus, string> = {
    OPEN: 'Mới',
    IN_PROGRESS: 'Đang xử lý',
    WAITING_USER: 'Chờ phản hồi',
    RESOLVED: 'Đã giải quyết',
    CLOSED: 'Đã đóng',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
    OPEN: '#3b82f6',
    IN_PROGRESS: '#f59e0b',
    WAITING_USER: '#8b5cf6',
    RESOLVED: '#10b981',
    CLOSED: '#6b7280',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
    LOW: '#9ca3af',
    MEDIUM: '#3b82f6',
    HIGH: '#f59e0b',
    URGENT: '#ef4444',
};

// =================== UPLOAD FUNCTIONS ===================

/**
 * Upload single image
 */
export const uploadSupportImage = async (imageUri: string): Promise<string> => {
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
        // For web - imageUri is base64 data URL, convert to blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob, 'image.jpg');
    } else {
        // For native - imageUri is file path
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('file', {
            uri: imageUri,
            type: type,
            name: filename,
        } as any);
    }
    
    // Don't set Content-Type header - let the browser/axios set it with boundary
    const result = await api.post<UploadResponse>(
        '/api/support/upload',
        formData,
        {
            timeout: 30000,
            transformRequest: (data: any) => data, // Prevent axios from transforming FormData
        }
    );
    
    return result.data.url;
};

/**
 * Upload multiple images using single upload endpoint (more reliable)
 */
export const uploadMultipleSupportImages = async (imageUris: string[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    // Upload one by one for more reliable handling
    for (const imageUri of imageUris) {
        try {
            const url = await uploadSupportImage(imageUri);
            uploadedUrls.push(url);
        } catch (error) {
            console.warn('Failed to upload one image:', error);
            // Continue with remaining images
        }
    }
    
    return uploadedUrls;
};

/**
 * Alternative: Upload multiple images in one request (if backend supports)
 */
export const uploadMultipleSupportImagesAtOnce = async (imageUris: string[]): Promise<string[]> => {
    const formData = new FormData();
    
    for (let i = 0; i < imageUris.length; i++) {
        const imageUri = imageUris[i];
        
        if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            formData.append('files', blob, `image_${i}.jpg`);
        } else {
            const filename = imageUri.split('/').pop() || `image_${i}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            
            formData.append('files', {
                uri: imageUri,
                type: type,
                name: filename,
            } as any);
        }
    }
    
    const result = await api.post<MultiUploadResponse>(
        '/api/support/upload-multiple',
        formData,
        {
            timeout: 60000,
            transformRequest: (data: any) => data,
        }
    );
    
    return result.data.files.map(f => f.url);
};

// =================== API FUNCTIONS ===================

/**
 * Tạo ticket mới (với optional images)
 */
export const createTicket = async (
    userId: number,
    request: CreateTicketRequest,
    imageUris?: string[]
): Promise<SupportTicket> => {
    // Upload images first if provided
    let attachmentUrls: string[] = [];
    if (imageUris && imageUris.length > 0) {
        try {
            attachmentUrls = await uploadMultipleSupportImages(imageUris);
        } catch (error) {
            console.warn('Failed to upload images:', error);
            // Continue without images
        }
    }
    
    const response = await api.post<ApiResponse<SupportTicket>>(
        `/api/support/tickets?userId=${userId}`,
        {
            ...request,
            attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        }
    );
    return response.data.data;
};

/**
 * Lấy danh sách tickets của user
 */
export const getUserTickets = async (
    userId: number,
    page: number = 0,
    size: number = 20
): Promise<{ tickets: SupportTicket[]; total: number }> => {
    const response = await api.get<ApiResponse<SupportTicket[]>>(
        `/api/support/tickets?userId=${userId}&page=${page}&size=${size}`
    );
    return {
        tickets: response.data.data,
        total: response.data.totalElements || response.data.data.length,
    };
};

/**
 * Lấy chi tiết ticket
 */
export const getTicketDetail = async (
    ticketId: number,
    userId: number
): Promise<TicketDetail> => {
    const response = await api.get<ApiResponse<TicketDetail>>(
        `/api/support/tickets/${ticketId}?userId=${userId}`
    );
    return response.data.data;
};

/**
 * Gửi message vào ticket (với optional images)
 */
export const sendMessage = async (
    ticketId: number,
    userId: number,
    request: SendMessageRequest,
    imageUris?: string[]
): Promise<SupportMessage> => {
    // Upload images first if provided
    let attachmentUrls: string[] = [];
    if (imageUris && imageUris.length > 0) {
        try {
            attachmentUrls = await uploadMultipleSupportImages(imageUris);
        } catch (error) {
            console.warn('Failed to upload images:', error);
        }
    }
    
    const response = await api.post<ApiResponse<SupportMessage>>(
        `/api/support/tickets/${ticketId}/messages?userId=${userId}`,
        {
            ...request,
            attachmentUrl: attachmentUrls.length > 0 ? attachmentUrls[0] : request.attachmentUrl,
            attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        }
    );
    return response.data.data;
};

/**
 * Lấy danh sách notifications
 */
export const getNotifications = async (
    userId: number,
    page: number = 0,
    size: number = 20
): Promise<{ notifications: SupportNotification[]; unreadCount: number; total: number }> => {
    const response = await api.get<ApiResponse<SupportNotification[]> & { unreadCount: number }>(
        `/api/support/notifications?userId=${userId}&page=${page}&size=${size}`
    );
    return {
        notifications: response.data.data,
        unreadCount: response.data.unreadCount || 0,
        total: response.data.totalElements || response.data.data.length,
    };
};

/**
 * Đánh dấu notification đã đọc
 */
export const markNotificationAsRead = async (
    notificationId: number,
    userId: number
): Promise<void> => {
    await api.patch(`/api/support/notifications/${notificationId}/read?userId=${userId}`);
};

/**
 * Đánh dấu tất cả notifications đã đọc
 */
export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
    await api.patch(`/api/support/notifications/read-all?userId=${userId}`);
};

/**
 * Helper để lấy URL đầy đủ cho attachment
 */
export const getAttachmentUrl = (path: string | null): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
};

/**
 * Parse multiple attachment URLs from comma-separated string or array
 */
export const getAttachmentUrls = (attachment: string | string[] | null): string[] => {
    if (!attachment) return [];
    
    if (Array.isArray(attachment)) {
        return attachment.map(url => getAttachmentUrl(url)).filter(Boolean) as string[];
    }
    
    // Handle comma-separated string
    return attachment.split(',')
        .map(url => url.trim())
        .filter(Boolean)
        .map(url => getAttachmentUrl(url))
        .filter(Boolean) as string[];
};

export default {
    createTicket,
    getUserTickets,
    getTicketDetail,
    sendMessage,
    uploadSupportImage,
    uploadMultipleSupportImages,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getAttachmentUrl,
    getAttachmentUrls,
    STATUS_LABELS,
    STATUS_COLORS,
    PRIORITY_LABELS,
    PRIORITY_COLORS,
};
