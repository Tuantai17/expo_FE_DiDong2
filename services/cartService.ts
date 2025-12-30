/**
 * Cart Service - API cho giỏ hàng
 * ================================
 * Quản lý tất cả API calls liên quan đến giỏ hàng
 */

import { api, BASE_URL } from './api';

// =================== TYPES =====================

export interface CartItem {
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    size: string;
    quantity: number;
    price: number;
}

export interface Cart {
    id: number;
    userId: number;
    items: CartItem[];
    totalPrice: number;
    itemCount: number;
    status: string;
}

export interface AddToCartRequest {
    userId: number;
    productId: number;
    size: string;
    quantity: number;
    price: number;
}

export interface UpdateQuantityRequest {
    quantity: number;
}

// =================== HELPER =====================

/**
 * Lấy URL đầy đủ của ảnh sản phẩm trong giỏ hàng
 */
export const getCartItemImageUrl = (image: string): string => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `${BASE_URL}/images/${image}`;
};

// =================== API CALLS =====================

export const cartService = {
    /**
     * Lấy giỏ hàng của user
     * GET /api/carts/user/{userId}
     */
    getCart: async (userId: number): Promise<Cart> => {
        const response = await api.get(`/api/carts/user/${userId}`);
        return response.data;
    },

    /**
     * Lấy giỏ hàng chi tiết (DTO format)
     * GET /api/carts/user/{userId}/detail
     */
    getCartDetail: async (userId: number): Promise<Cart> => {
        const response = await api.get(`/api/carts/user/${userId}/detail`);
        return response.data;
    },

    /**
     * Thêm sản phẩm vào giỏ hàng
     * POST /api/carts/add
     */
    addToCart: async (data: AddToCartRequest): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/api/carts/add', data);
        return response.data;
    },

    /**
     * Thêm sản phẩm vào giỏ (trả về DTO)
     * POST /api/carts/user/{userId}/add
     */
    addToCartWithDetail: async (userId: number, data: AddToCartRequest): Promise<Cart> => {
        const response = await api.post(`/api/carts/user/${userId}/add`, data);
        return response.data;
    },

    /**
     * Cập nhật số lượng item
     * PUT /api/carts/items/{itemId}
     */
    updateQuantity: async (itemId: number, quantity: number): Promise<void> => {
        await api.put(`/api/carts/items/${itemId}`, { quantity });
    },

    /**
     * Xóa item khỏi giỏ hàng
     * DELETE /api/carts/items/{itemId}
     */
    removeItem: async (itemId: number): Promise<void> => {
        await api.delete(`/api/carts/items/${itemId}`);
    },

    /**
     * Xóa item theo productId
     * DELETE /api/carts/{userId}/remove/{productId}
     */
    removeByProductId: async (userId: number, productId: number): Promise<void> => {
        await api.delete(`/api/carts/${userId}/remove/${productId}`);
    },

    /**
     * Xóa toàn bộ giỏ hàng
     * DELETE /api/carts/user/{userId}/clear
     */
    clearCart: async (userId: number): Promise<void> => {
        await api.delete(`/api/carts/user/${userId}/clear`);
    },

    /**
     * Lấy số lượng items trong giỏ
     * GET /api/carts/user/{userId}/count
     */
    getItemCount: async (userId: number): Promise<number> => {
        const response = await api.get(`/api/carts/user/${userId}/count`);
        return response.data.count || response.data;
    },

    /**
     * Lấy tổng giá trị giỏ hàng
     * GET /api/carts/user/{userId}/total
     */
    getTotal: async (userId: number): Promise<number> => {
        const response = await api.get(`/api/carts/user/${userId}/total`);
        return response.data.total || response.data;
    },
};

export default cartService;
