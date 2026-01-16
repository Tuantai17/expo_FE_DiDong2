/**
 * Review Service - APIs đánh giá sản phẩm
 * =======================================
 */

import { api } from './api';

// =================== TYPES ===================

export interface Review {
    id: number;
    productId: number;
    productTitle?: string;
    productImage?: string;
    userId: number;
    userName: string;
    userAvatar?: string;
    orderId: number;
    orderItemId: number;
    rating: number;
    comment: string;
    images?: string[];
    // Admin reply (NO STATUS FIELD - reviews appear immediately)
    adminReply?: string;
    adminReplyAt?: string;
    adminId?: number;
    adminName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewSummary {
    productId: number;
    avgRating: number;
    reviewCount: number;
    starCounts: {
        [key: number]: number; // Support index signature for 1-5
    };
}

export interface CreateReviewRequest {
    productId: number;
    orderItemId: number;
    orderId: number;
    rating: number;
    comment?: string;
    images?: string[];
}

export interface UpdateReviewRequest {
    rating?: number;
    comment?: string;
}

export interface ReviewsResponse {
    success: boolean;
    data: Review[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface ReviewResponse {
    success: boolean;
    message?: string;
    data: Review;
}

export interface ReviewSummaryResponse {
    success: boolean;
    data: ReviewSummary;
}

export interface CheckReviewedResponse {
    success: boolean;
    reviewed: boolean;
}

// =================== SERVICE ===================

export const reviewService = {
    /**
     * Lấy danh sách reviews của sản phẩm (all reviews - no approval)
     */
    getProductReviews: async (
        productId: number,
        page: number = 0,
        size: number = 10
    ): Promise<ReviewsResponse> => {
        const response = await api.get(
            `/api/products/${productId}/reviews?page=${page}&size=${size}`
        );
        return response.data;
    },

    /**
     * Lấy tổng hợp đánh giá sản phẩm
     */
    getProductReviewSummary: async (productId: number): Promise<ReviewSummary> => {
        const response = await api.get(`/api/products/${productId}/reviews/summary`);
        return response.data.data;
    },

    /**
     * Alias for getProductReviewSummary (for compatibility)
     */
    getReviewSummary: async (productId: number): Promise<ReviewSummary> => {
        const response = await api.get(`/api/products/${productId}/reviews/summary`);
        return response.data.data;
    },

    /**
     * Tạo đánh giá mới (appears immediately - no approval)
     */
    createReview: async (request: CreateReviewRequest): Promise<ReviewResponse> => {
        const response = await api.post('/api/reviews', request);
        return response.data;
    },

    /**
     * Cập nhật đánh giá
     */
    updateReview: async (
        reviewId: number,
        request: UpdateReviewRequest
    ): Promise<ReviewResponse> => {
        const response = await api.put(`/api/reviews/${reviewId}`, request);
        return response.data;
    },

    /**
     * Xóa đánh giá
     */
    deleteReview: async (reviewId: number): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/api/reviews/${reviewId}`);
        return response.data;
    },

    /**
     * Kiểm tra đã đánh giá chưa
     */
    checkReviewed: async (orderItemId: number): Promise<boolean> => {
        try {
            const response = await api.get(`/api/reviews/check?orderItemId=${orderItemId}`);
            return response.data.reviewed;
        } catch (error) {
            return false;
        }
    },

    /**
     * Lấy danh sách đánh giá của tôi
     */
    getMyReviews: async (): Promise<Review[]> => {
        const response = await api.get('/api/reviews/my');
        return response.data.data;
    },

    /**
     * Lấy chi tiết 1 review
     */
    getReviewById: async (reviewId: number): Promise<Review> => {
        const response = await api.get(`/api/reviews/${reviewId}`);
        return response.data.data;
    },
};
