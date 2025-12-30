/**
 * Product Service - API cho sản phẩm
 * ===================================
 * Quản lý tất cả API calls liên quan đến sản phẩm
 */

import { api, BASE_URL } from './api';

// =================== TYPES =====================

export interface ProductImage {
    id: number;
    imageUrl: string;
    isPrimary: boolean;
}

export interface ProductSize {
    id: number;
    size: string;
    stock: number;
    price?: number;
}

export interface ProductVariant {
    id: number;
    color: string;
    colorCode: string;
    sizes: ProductSize[];
}

export interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    priceRoot?: number;
    brand: string;
    gender: 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';
    sku: string;
    status: 'ACTIVE' | 'INACTIVE';
    categoryId: number;
    photo: string;
    qty: number;
    slug: string;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    variants?: ProductVariant[];
    images?: ProductImage[];
    category?: {
        id: number;
        name: string;
    };
}

export interface ProductListParams {
    categoryId?: number;
    page?: number;
    size?: number;
    sort?: string;
    filter?: string;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

// =================== HELPER =====================

/**
 * Lấy URL đầy đủ của ảnh sản phẩm
 */
export const getProductImageUrl = (photo: string): string => {
    if (!photo) return '';
    if (photo.startsWith('http')) return photo;
    return `${BASE_URL}/images/${photo}`;
};

// =================== API CALLS =====================

export const productService = {
    /**
     * Lấy danh sách sản phẩm
     * GET /api/products
     */
    getAll: async (params?: ProductListParams): Promise<Product[]> => {
        const response = await api.get('/api/products', { params });
        // API có thể trả về paginated response hoặc array trực tiếp
        return response.data.content || response.data;
    },

    /**
     * Lấy danh sách sản phẩm với pagination info
     * GET /api/products
     */
    getAllPaginated: async (params?: ProductListParams): Promise<PaginatedResponse<Product>> => {
        const response = await api.get('/api/products', { params });
        return response.data;
    },

    /**
     * Lấy chi tiết sản phẩm
     * GET /api/products/{id}
     */
    getById: async (id: number): Promise<Product> => {
        const response = await api.get(`/api/products/${id}`);
        return response.data;
    },

    /**
     * Lấy chi tiết sản phẩm kèm variants
     * GET /api/products/{id}/detail
     */
    getDetail: async (id: number): Promise<Product> => {
        const response = await api.get(`/api/products/${id}/detail`);
        return response.data;
    },

    /**
     * Tìm kiếm sản phẩm
     * GET /api/products/search
     */
    search: async (query: string, categoryId?: number): Promise<Product[]> => {
        const response = await api.get('/api/products/search', {
            params: { q: query, categoryId },
        });
        return response.data;
    },

    /**
     * Lọc sản phẩm theo danh mục
     * GET /api/products/category/{categoryId}
     */
    getByCategory: async (categoryId: number, page = 0, size = 10): Promise<Product[]> => {
        const response = await api.get(`/api/products/category/${categoryId}`, {
            params: { page, size },
        });
        return response.data.content || response.data;
    },

    /**
     * Lọc sản phẩm theo thương hiệu
     * GET /api/products/brand/{brand}
     */
    getByBrand: async (brand: string, page = 0, size = 10): Promise<Product[]> => {
        const response = await api.get(`/api/products/brand/${brand}`, {
            params: { page, size },
        });
        return response.data.content || response.data;
    },

    /**
     * Lọc sản phẩm theo giới tính
     * GET /api/products/gender/{gender}
     */
    getByGender: async (gender: string, page = 0, size = 10): Promise<Product[]> => {
        const response = await api.get(`/api/products/gender/${gender}`, {
            params: { page, size },
        });
        return response.data.content || response.data;
    },

    /**
     * Lọc sản phẩm theo khoảng giá
     * GET /api/products/price-range
     */
    getByPriceRange: async (minPrice: number, maxPrice: number): Promise<Product[]> => {
        const response = await api.get('/api/products/price-range', {
            params: { minPrice, maxPrice },
        });
        return response.data;
    },

    /**
     * Lấy danh sách thương hiệu
     * GET /api/products/brands
     */
    getBrands: async (): Promise<string[]> => {
        const response = await api.get('/api/products/brands');
        return response.data;
    },

    /**
     * Sản phẩm mới nhất
     * GET /api/products/newest
     */
    getNewest: async (limit = 10): Promise<Product[]> => {
        const response = await api.get('/api/products/newest', {
            params: { limit },
        });
        return response.data;
    },

    /**
     * Sản phẩm bán chạy
     * GET /api/products/best-sellers
     */
    getBestSellers: async (limit = 10): Promise<Product[]> => {
        const response = await api.get('/api/products/best-sellers', {
            params: { limit },
        });
        return response.data;
    },
};

export default productService;
