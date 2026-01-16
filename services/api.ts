/**
 * API Service - Centralized API configuration
 * ============================================
 * Handles all API calls to the backend server
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// =================== CONFIGURATION =====================

export const BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

// Create axios instance
export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// =================== STORAGE KEYS =====================

export const STORAGE_KEYS = {
    TOKEN: "auth_token",
    USER: "auth_user",
};

// =================== STORAGE HELPERS =====================

export const storage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.log("Storage getItem error:", error);
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.log("Storage setItem error:", error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.log("Storage removeItem error:", error);
        }
    },
    clear: async (): Promise<void> => {
        try {
            await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        } catch (error) {
            console.log("Storage clear error:", error);
        }
    },
};

// =================== INTERCEPTORS =====================

// Request interceptor - Attach token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await storage.getItem(STORAGE_KEYS.TOKEN);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.log("Error getting token:", error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await storage.clear();
        }
        return Promise.reject(error);
    }
);

// =================== TYPES =====================

export interface User {
    id: number;
    username: string;
    email: string;
    name?: string;           // Tên từ backend API
    fullName?: string;       // Tên đầy đủ (nếu có)
    phoneNumber?: string;
    address?: string;
    avatar?: string;         // URL ảnh đại diện
    role: "USER" | "ADMIN" | "CUSTOMER";
    isActive?: boolean;
}

export interface AuthResponse {
    token: string;
    tokenType?: string;
    user: User;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    phoneNumber: string;
    fullName?: string;
    address?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

// =================== AUTH APIS =====================

/**
 * Register new user
 * POST /api/auth/register
 */
export const registerApi = async (
    data: RegisterRequest
): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/auth/register", data);
    return response.data;
};

/**
 * Login user
 * POST /api/auth/login
 */
export const loginApi = async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/auth/login", data);
    return response.data;
};

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getMeApi = async (): Promise<User> => {
    const response = await api.get<User>("/api/auth/me");
    return response.data;
};

// =================== TOKEN MANAGEMENT =====================

export const saveAuthData = async (data: AuthResponse): Promise<void> => {
    await storage.setItem(STORAGE_KEYS.TOKEN, data.token);
    await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
};

export const getToken = async (): Promise<string | null> => {
    return await storage.getItem(STORAGE_KEYS.TOKEN);
};

export const getStoredUser = async (): Promise<User | null> => {
    const userStr = await storage.getItem(STORAGE_KEYS.USER);
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }
    return null;
};

export const clearAuthData = async (): Promise<void> => {
    await storage.clear();
};

export const isAuthenticated = async (): Promise<boolean> => {
    const token = await getToken();
    return !!token;
};

// =================== UPDATE PROFILE =====================

export interface UpdateProfileRequest {
    name: string;
    email: string;
    phone?: string;
}

/**
 * Update user profile
 * PUT /api/users/{id}/profile
 */
export const updateUserProfile = async (
    userId: number,
    data: UpdateProfileRequest
): Promise<User> => {
    const response = await api.put<User>(`/api/users/${userId}/profile`, data);
    return response.data;
};

/**
 * Upload user avatar
 * POST /api/users/{id}/avatar
 */
export const uploadAvatar = async (
    userId: number,
    file: FormData
): Promise<{ message: string; avatar: string }> => {
    const response = await api.post<{ message: string; avatar: string }>(
        `/api/users/${userId}/avatar`,
        file,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return response.data;
};

// =================== PRODUCTS =====================

export interface Product {
    id: number;
    title: string;
    price: number;
    photo: string;
    description?: string;
    brand?: string;
    qty?: number;           // Stock quantity
    priceRoot?: number;     // Original price (for discount calculation)
    price_root?: number;    // Alias for priceRoot
    sku?: string;
    gender?: "MEN" | "WOMEN" | "KIDS" | "UNISEX";
    status?: "ACTIVE" | "INACTIVE";
    category?: {
        id: number;
        name: string;
    };
    categoryId?: number;
}

export interface Category {
    id: number;
    name: string;
}

export const getProducts = async (categoryId?: number): Promise<Product[]> => {
    const response = await api.get<Product[]>("/api/products", {
        params: { categoryId: categoryId || undefined },
    });
    return response.data;
};

export const searchProducts = async (
    q: string,
    categoryId?: number
): Promise<Product[]> => {
    const response = await api.get<Product[]>("/api/products/search", {
        params: { q, categoryId: categoryId || undefined },
    });
    return response.data;
};

export const getProductDetail = async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/api/products/${id}`);
    return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get<Category[]>("/api/categories");
    return response.data;
};

export const getImageUrl = (filename: string): string => {
    if (!filename) return "";
    if (filename.startsWith("http")) return filename;
    return `${BASE_URL}/images/${filename}`;
};

// =================== CART API =====================

export interface AddToCartRequest {
    userId: number;
    productId: number;
    quantity: number;
    productPrice: number;
    discount?: number;
}

export interface CartItemResponse {
    id: number;              // Cart item ID (for deletion)
    productId: number;
    productTitle?: string;   // From backend DTO
    productName?: string;    // Legacy field
    productImage?: string;   // From backend DTO
    productPhoto?: string;   // Legacy field
    size?: string;
    color?: string;
    quantity: number;
    price?: number;          // From backend DTO
    productPrice?: number;   // Legacy field
    discount?: number;
    subtotal?: number;       // From backend DTO
    totalPrice?: number;     // Legacy field
}

export interface CartResponse {
    cartId: number;
    userId: number;
    status: string;
    totalValue: number;
    items: CartItemResponse[];
}

/**
 * Add product to cart
 * POST /api/carts/add
 */
export const addToCartApi = async (data: AddToCartRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/api/carts/add", data);
    return response.data;
};

/**
 * Get user's cart
 * GET /api/carts/user/{userId}
 */
export const getCartByUserApi = async (userId: number): Promise<CartResponse> => {
    const response = await api.get<CartResponse>(`/api/carts/user/${userId}`);
    return response.data;
};

/**
 * Remove item from cart by productId (legacy)
 * DELETE /api/carts/{userId}/remove/{productId}
 */
export const removeFromCartApi = async (userId: number, productId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/carts/${userId}/remove/${productId}`);
    return response.data;
};

/**
 * Remove cart item by cartItemId (preferred method)
 * DELETE /api/carts/items/{itemId}
 */
export const removeCartItemByIdApi = async (itemId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/carts/items/${itemId}`);
    return response.data;
};

/**
 * Clear all items from user's cart
 * DELETE /api/carts/user/{userId}/clear
 */
export const clearCartApi = async (userId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/api/carts/user/${userId}/clear`);
    return response.data;
};

/**
 * Retry payment for an order
 * POST /api/orders/{orderId}/retry-payment
 */
export const retryPaymentApi = async (orderId: number): Promise<{ success: boolean; payUrl?: string; message?: string }> => {
    const response = await api.post<{ success: boolean; payUrl?: string; message?: string }>(`/api/orders/${orderId}/retry-payment`);
    return response.data;
};

// =================== RELATED PRODUCTS API =====================

/**
 * Get products by category
 * GET /api/products/category/{categoryId}
 */
export const getProductsByCategory = async (categoryId: number, limit = 10): Promise<Product[]> => {
    const response = await api.get<{ content?: Product[] } | Product[]>(`/api/products/category/${categoryId}`, {
        params: { page: 0, size: limit },
    });
    // API có thể trả về paginated response hoặc array trực tiếp
    return Array.isArray(response.data) ? response.data : (response.data.content || []);
};

// =================== CHAT IMAGE UPLOAD API =====================

import type { ImageSearchResult } from '../types/chatImage';

/**
 * Upload image to chat and get product suggestions
 * POST /api/chat-images/upload
 * @param sessionId Chat session ID
 * @param imageUri Local image URI
 * @returns ImageSearchResult with analysis and suggested products
 */
export const uploadChatImage = async (
    sessionId: number,
    imageUri: string
): Promise<ImageSearchResult> => {
    try {
        console.log('[API] Uploading chat image...');
        console.log('[API] Session ID:', sessionId);
        console.log('[API] Image URI:', imageUri);

        // Create FormData
        const formData = new FormData();
        formData.append('sessionId', sessionId.toString());
        formData.append('senderType', 'USER');

        // Get filename and extension from URI
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // Append image file
        formData.append('image', {
            uri: imageUri,
            type: type,
            name: filename,
        } as any);

        console.log('[API] FormData created, uploading...');

        // Upload with multipart/form-data
        const response = await api.post<ImageSearchResult>(
            '/api/chat-images/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 45000, // 45s timeout for image analysis
            }
        );

        console.log('[API] ✅ Upload successful');
        console.log('[API] Found', response.data.suggestedProducts?.length || 0, 'products');

        return response.data;
    } catch (error: any) {
        console.error('[API] ❌ Upload failed:', error.message);
        if (error.response) {
            console.error('[API] Status:', error.response.status);
            console.error('[API] Data:', error.response.data);
        }
        throw error;
    }
};

