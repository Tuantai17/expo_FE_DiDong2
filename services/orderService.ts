/**
 * Order Service - API cho đơn hàng
 * =================================
 * Quản lý tất cả API calls liên quan đến đặt hàng và quản lý đơn hàng
 */

import { api } from './api';

// =================== TYPES =====================

export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';

export type PaymentMethod = 'COD' | 'VNPAY' | 'BANKING';

export interface OrderItem {
    productId: number;
    productName: string;
    productImage: string;
    size: string;
    quantity: number;
    price: number;
}

export interface MobileCheckoutRequest {
    userId: number;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    addressId?: number;
    paymentMethod: PaymentMethod;
    note?: string;
    voucherCode?: string;
    items: OrderItem[];
    subtotal: number;
    shippingFee: number;
    discount: number;
    totalAmount: number;
}

export interface Order {
    orderId: number;
    orderCode: string;
    userId: number;
    status: OrderStatus;
    totalAmount: number;
    shippingFee: number;
    discountAmount: number;
    paymentMethod: string;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    note?: string;
    items: OrderItem[];
    createdAt: string;
    updatedAt?: string;
}

export interface OrderStats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
}

export interface MonthlyStats {
    month: number;
    year: number;
    orderCount: number;
    revenue: number;
}

// =================== STATUS HELPERS =====================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: 'Chờ xử lý',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPING: 'Đang giao hàng',
    SHIPPED: 'Đã chuyển hàng',
    DELIVERED: 'Đã giao hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: '#FFA500',      // Orange
    CONFIRMED: '#007BFF',    // Blue
    PROCESSING: '#9C27B0',   // Purple
    SHIPPING: '#17A2B8',     // Teal
    SHIPPED: '#17A2B8',      // Teal
    DELIVERED: '#28A745',    // Green
    COMPLETED: '#4CAF50',    // Dark Green
    CANCELLED: '#DC3545',    // Red
};

export const getStatusLabel = (status: OrderStatus): string => {
    return ORDER_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status: OrderStatus): string => {
    return ORDER_STATUS_COLORS[status] || '#999';
};

// =================== API CALLS =====================

export const orderService = {
    /**
     * Đặt hàng từ Mobile App
     * POST /api/orders/mobile-checkout
     */
    mobileCheckout: async (data: MobileCheckoutRequest): Promise<Order> => {
        const response = await api.post('/api/orders/mobile-checkout', data);
        return response.data;
    },

    /**
     * Lấy danh sách đơn hàng của user
     * GET /api/orders/user/{userId}
     */
    getByUser: async (userId: number, status?: OrderStatus): Promise<Order[]> => {
        const response = await api.get(`/api/orders/user/${userId}`, {
            params: status ? { status } : {},
        });
        return response.data;
    },

    /**
     * Lấy danh sách đơn hàng của user (DTO format)
     * GET /api/orders/user/{userId}/detail
     */
    getByUserDetail: async (userId: number): Promise<Order[]> => {
        const response = await api.get(`/api/orders/user/${userId}/detail`);
        return response.data;
    },

    /**
     * Lấy chi tiết đơn hàng
     * GET /api/orders/{id}/detail
     */
    getById: async (orderId: number): Promise<Order> => {
        const response = await api.get(`/api/orders/${orderId}/detail`);
        return response.data;
    },

    /**
     * Tìm đơn hàng theo mã
     * GET /api/orders/code/{orderCode}
     */
    getByCode: async (orderCode: string): Promise<Order> => {
        const response = await api.get(`/api/orders/code/${orderCode}`);
        return response.data;
    },

    /**
     * Lấy các items trong đơn hàng
     * GET /api/orders/{id}/items
     */
    getOrderItems: async (orderId: number): Promise<OrderItem[]> => {
        const response = await api.get(`/api/orders/${orderId}/items`);
        return response.data;
    },

    /**
     * Hủy đơn hàng
     * POST /api/orders/{id}/cancel
     */
    cancel: async (orderId: number): Promise<void> => {
        await api.post(`/api/orders/${orderId}/cancel`);
    },

    /**
     * Lấy đơn hàng gần đây
     * GET /api/orders/recent
     */
    getRecent: async (limit = 5): Promise<Order[]> => {
        const response = await api.get('/api/orders/recent', {
            params: { limit },
        });
        return response.data;
    },
};

export default orderService;
