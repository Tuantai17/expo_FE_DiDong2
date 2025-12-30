/**
 * Category Service - API cho danh mục
 * ====================================
 * Quản lý tất cả API calls liên quan đến danh mục sản phẩm
 */

import { api, BASE_URL } from './api';

// =================== TYPES =====================

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// =================== HELPER =====================

/**
 * Lấy URL đầy đủ của ảnh danh mục
 */
export const getCategoryImageUrl = (image: string): string => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `${BASE_URL}/images/${image}`;
};

// =================== API CALLS =====================

export const categoryService = {
    /**
     * Lấy tất cả danh mục
     * GET /api/categories
     */
    getAll: async (): Promise<Category[]> => {
        const response = await api.get('/api/categories');
        return response.data;
    },

    /**
     * Lấy danh mục đang hoạt động
     * GET /api/categories/active
     */
    getActive: async (): Promise<Category[]> => {
        const response = await api.get('/api/categories/active');
        return response.data;
    },

    /**
     * Lấy chi tiết danh mục
     * GET /api/categories/{id}
     */
    getById: async (id: number): Promise<Category> => {
        const response = await api.get(`/api/categories/${id}`);
        return response.data;
    },

    /**
     * Tìm kiếm danh mục
     * GET /api/categories/search
     */
    search: async (keyword: string): Promise<Category[]> => {
        const response = await api.get('/api/categories/search', {
            params: { keyword },
        });
        return response.data;
    },
};

export default categoryService;
