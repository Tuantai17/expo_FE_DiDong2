/**
 * API Configuration
 * ==================
 * Centralized API endpoint configuration
 */

// Base URL - Update this to match your backend server
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

// API Endpoints
export const ENDPOINTS = {
    // Auth endpoints
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    me: `${API_BASE_URL}/api/auth/me`,

    // Forgot Password endpoints
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`,
    resetPassword: `${API_BASE_URL}/api/auth/reset-password`,

    // User endpoints
    users: `${API_BASE_URL}/api/users`,
    userById: (id: number) => `${API_BASE_URL}/api/users/${id}`,

    // Product endpoints
    products: `${API_BASE_URL}/api/products`,
    productById: (id: number) => `${API_BASE_URL}/api/products/${id}`,
    productSearch: `${API_BASE_URL}/api/products/search`,

    // Category endpoints
    categories: `${API_BASE_URL}/api/categories`,
    categoryById: (id: number) => `${API_BASE_URL}/api/categories/${id}`,

    // Cart endpoints
    cart: `${API_BASE_URL}/api/cart`,
    cartItems: `${API_BASE_URL}/api/cart/items`,

    // Order endpoints
    orders: `${API_BASE_URL}/api/orders`,
    orderById: (id: number) => `${API_BASE_URL}/api/orders/${id}`,
    checkout: `${API_BASE_URL}/api/orders/checkout`,

    // Image URL helper
    imageUrl: (filename: string) => {
        if (!filename) return "";
        if (filename.startsWith("http")) return filename;
        return `${API_BASE_URL}/images/${filename}`;
    },
};

export default ENDPOINTS;

