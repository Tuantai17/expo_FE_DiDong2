/**
 * User Service - API cho người dùng
 * ==================================
 * Quản lý tất cả API calls liên quan đến user profile và địa chỉ
 */

import { api } from './api';

// =================== TYPES =====================

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'USER' | 'ADMIN';
    emailVerifiedAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface UserAddress {
    id: number;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    isDefault: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
}

export interface AddressRequest {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    isDefault?: boolean;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

// =================== API CALLS =====================

export const userService = {
    /**
     * Lấy thông tin profile người dùng
     * GET /api/users/{id}/profile
     */
    getProfile: async (userId: number): Promise<User> => {
        const response = await api.get(`/api/users/${userId}/profile`);
        return response.data;
    },

    /**
     * Lấy thông tin chi tiết người dùng
     * GET /api/users/{id}
     */
    getById: async (userId: number): Promise<User> => {
        const response = await api.get(`/api/users/${userId}`);
        return response.data;
    },

    /**
     * Cập nhật thông tin profile
     * PUT /api/users/{id}
     */
    updateProfile: async (userId: number, data: UpdateProfileRequest): Promise<User> => {
        const response = await api.put(`/api/users/${userId}`, data);
        return response.data;
    },

    // =================== ADDRESS APIS =====================

    /**
     * Lấy danh sách địa chỉ của người dùng
     * GET /api/users/{userId}/addresses
     */
    getAddresses: async (userId: number): Promise<UserAddress[]> => {
        const response = await api.get(`/api/users/${userId}/addresses`);
        return response.data;
    },

    /**
     * Thêm địa chỉ mới
     * POST /api/users/{userId}/addresses
     */
    addAddress: async (userId: number, data: AddressRequest): Promise<UserAddress> => {
        const response = await api.post(`/api/users/${userId}/addresses`, data);
        return response.data;
    },

    /**
     * Cập nhật địa chỉ
     * PUT /api/users/{userId}/addresses/{addressId}
     */
    updateAddress: async (
        userId: number,
        addressId: number,
        data: AddressRequest
    ): Promise<UserAddress> => {
        const response = await api.put(`/api/users/${userId}/addresses/${addressId}`, data);
        return response.data;
    },

    /**
     * Xóa địa chỉ
     * DELETE /api/users/{userId}/addresses/{addressId}
     */
    deleteAddress: async (userId: number, addressId: number): Promise<void> => {
        await api.delete(`/api/users/${userId}/addresses/${addressId}`);
    },

    /**
     * Đặt địa chỉ làm mặc định
     * PUT /api/users/{userId}/addresses/{addressId}/default
     */
    setDefaultAddress: async (userId: number, addressId: number): Promise<void> => {
        await api.put(`/api/users/${userId}/addresses/${addressId}/default`);
    },

    // =================== PASSWORD APIS =====================

    /**
     * Đổi mật khẩu
     * POST /api/users/{userId}/change-password
     */
    changePassword: async (userId: number, data: ChangePasswordRequest): Promise<void> => {
        await api.post(`/api/users/${userId}/change-password`, data);
    },
};

export default userService;
