import { api } from './api';

export interface Address {
    id: number;
    userId: number;
    fullName: string;
    phone: string;
    address: string;
    city?: string;
    country?: string;
    isDefault: boolean;
}

export interface CreateAddressRequest {
    fullName: string;
    phone: string;
    address: string;
    city?: string;
    country?: string; // Default 'Vietnam'
    isDefault?: boolean;
}

export const addressService = {
    /**
     * Lấy danh sách địa chỉ của user
     */
    getUserAddresses: async (userId: number): Promise<Address[]> => {
        const response = await api.get(`/api/users/${userId}/addresses`);
        return response.data;
    },

    /**
     * Tạo địa chỉ mới
     */
    createAddress: async (userId: number, request: CreateAddressRequest): Promise<Address> => {
        const response = await api.post(`/api/users/${userId}/addresses`, request);
        return response.data;
    },

    /**
     * Cập nhật địa chỉ
     */
    updateAddress: async (userId: number, addressId: number, request: CreateAddressRequest): Promise<Address> => {
        const response = await api.put(`/api/users/${userId}/addresses/${addressId}`, request);
        return response.data;
    },

    /**
     * Xóa địa chỉ
     */
    deleteAddress: async (userId: number, addressId: number): Promise<void> => {
        await api.delete(`/api/users/${userId}/addresses/${addressId}`);
    },

    /**
     * Đặt làm địa chỉ mặc định
     */
    setDefaultAddress: async (userId: number, addressId: number): Promise<Address> => {
        const response = await api.put(`/api/users/${userId}/addresses/${addressId}/default`);
        return response.data;
    }
};
