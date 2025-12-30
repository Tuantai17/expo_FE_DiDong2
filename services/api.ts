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
    productId: number;
    productName: string;
    productPhoto: string;
    quantity: number;
    productPrice: number;
    discount: number;
    totalPrice: number;
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
 * Remove item from cart
 * DELETE /api/carts/{userId}/remove/{productId}
 */
export const removeFromCartApi = async (userId: number, productId: number): Promise<string> => {
    const response = await api.delete<string>(`/api/carts/${userId}/remove/${productId}`);
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

