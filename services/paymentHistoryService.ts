/**
 * Payment History API Service
 * API calls cho lịch sử thanh toán
 */

import { api } from './api';

// ==================== TYPES ====================

/**
 * Trạng thái thanh toán
 */
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'PROCESSING' | 'REFUNDED' | 'CANCELLED';

/**
 * Item trong danh sách lịch sử thanh toán
 */
export interface PaymentHistoryItem {
    id: number;
    orderId: number;
    orderCode: string;
    amount: number;
    status: PaymentStatus;
    statusDisplay: string;
    paymentMethod: string | null;
    paymentGateway: string | null;
    transactionId: string | null;
    paidAt: string | null;       // ISO datetime
    createdAt: string;           // ISO datetime
    gatewayResponse: string | null;
    displayTime?: string;        // paidAt || createdAt
}

/**
 * Response phân trang cho lịch sử thanh toán
 */
export interface PaymentHistoryResponse {
    content: PaymentHistoryItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

/**
 * Tóm tắt sản phẩm trong đơn hàng
 */
export interface OrderItemSummary {
    id: number;
    productId: number;
    productTitle: string;
    productImage: string | null;
    quantity: number;
    price: number;
    color: string | null;
    sizeValue: string | null;
    subtotal: number;
}

/**
 * Chi tiết thanh toán đầy đủ
 */
export interface PaymentDetail {
    id: number;
    orderId: number;
    orderCode: string;
    amount: number;
    status: PaymentStatus;
    statusDisplay: string;
    paymentMethod: string | null;
    paymentGateway: string | null;
    transactionId: string | null;
    paidAt: string | null;
    createdAt: string;
    gatewayResponse: string | null;
    
    // Order Info
    shippingName: string | null;
    shippingPhone: string | null;
    shippingAddress: string | null;
    shippingFee: number | null;
    discountAmount: number | null;
    totalAmount: number | null;
    orderStatus: string | null;
    
    // Order Items
    orderItems: OrderItemSummary[];
}

// ==================== API FUNCTIONS ====================

/**
 * Lấy lịch sử thanh toán của user hiện tại
 * GET /api/payments/my-history
 */
export const getMyPaymentHistory = async (
    page: number = 0,
    size: number = 10,
    status?: PaymentStatus
): Promise<PaymentHistoryResponse> => {
    const params: Record<string, string | number> = { page, size };
    if (status) {
        params.status = status;
    }
    
    const response = await api.get<PaymentHistoryResponse>('/api/payments/my-history', { params });
    return response.data;
};

/**
 * Lấy chi tiết một payment
 * GET /api/payments/my-history/{paymentId}
 */
export const getMyPaymentDetail = async (paymentId: number): Promise<PaymentDetail> => {
    const response = await api.get<PaymentDetail>(`/api/payments/my-history/${paymentId}`);
    return response.data;
};

/**
 * Đếm tổng số payments của user
 * GET /api/payments/my-history/count
 */
export const countMyPayments = async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/api/payments/my-history/count');
    return response.data.count;
};

// ==================== HELPERS ====================

/**
 * Mapping status color
 */
export const getStatusColor = (status: PaymentStatus): string => {
    switch (status) {
        case 'SUCCESS':
            return '#10B981'; // Green
        case 'FAILED':
        case 'CANCELLED':
            return '#EF4444'; // Red
        case 'PENDING':
        case 'PROCESSING':
            return '#F59E0B'; // Yellow/Amber
        case 'REFUNDED':
            return '#6366F1'; // Indigo
        default:
            return '#6B7280'; // Gray
    }
};

/**
 * Mapping gateway display name
 */
export const getGatewayDisplayName = (gateway: string | null): string => {
    if (!gateway) return 'Không xác định';
    switch (gateway.toUpperCase()) {
        case 'VNPAY':
            return 'VNPay';
        case 'MOMO':
            return 'MoMo';
        case 'COD':
            return 'Thanh toán khi nhận hàng';
        case 'PAYPAL':
            return 'PayPal';
        default:
            return gateway;
    }
};

/**
 * Format tiền VND
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

/**
 * Format datetime
 */
export const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    } catch {
        return isoString;
    }
};

/**
 * Lấy thời gian hiển thị (ưu tiên paidAt, fallback createdAt)
 */
export const getDisplayTime = (item: PaymentHistoryItem): string => {
    return formatDateTime(item.paidAt || item.createdAt);
};
