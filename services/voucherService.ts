/**
 * Voucher Service - API cho mã giảm giá
 * ======================================
 * Quản lý tất cả API calls liên quan đến voucher/mã khuyến mãi
 */

import { api } from './api';

// =================== TYPES =====================

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Voucher {
    id: number;
    code: string;
    discount: number;
    discountType: DiscountType;
    minOrderAmount: number;
    maxDiscountAmount: number;
    expiryDate: string;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface VoucherCheckResult {
    valid: boolean;
    message: string;
    voucher?: Voucher;
    discountAmount?: number;
    finalTotal?: number;
}

export interface DiscountCalculation {
    discountAmount: number;
    finalAmount: number;
}

// =================== HELPERS =====================

/**
 * Format số tiền giảm giá
 */
export const formatVoucherDiscount = (voucher: Voucher): string => {
    if (voucher.discountType === 'PERCENTAGE') {
        return `Giảm ${voucher.discount}%`;
    }
    return `Giảm ${voucher.discount.toLocaleString('vi-VN')}đ`;
};

/**
 * Kiểm tra voucher còn hiệu lực không
 */
export const isVoucherValid = (voucher: Voucher): boolean => {
    const now = new Date();
    const expiry = new Date(voucher.expiryDate);
    return (
        voucher.isActive &&
        expiry > now &&
        (voucher.usageLimit === 0 || voucher.usedCount < voucher.usageLimit)
    );
};

/**
 * Tính số tiền giảm giá
 */
export const calculateDiscountAmount = (voucher: Voucher, orderAmount: number): number => {
    if (orderAmount < voucher.minOrderAmount) {
        return 0;
    }

    let discountAmount = 0;
    if (voucher.discountType === 'PERCENTAGE') {
        discountAmount = (orderAmount * voucher.discount) / 100;
        // Áp dụng giới hạn giảm tối đa nếu có
        if (voucher.maxDiscountAmount > 0 && discountAmount > voucher.maxDiscountAmount) {
            discountAmount = voucher.maxDiscountAmount;
        }
    } else {
        discountAmount = voucher.discount;
    }

    return discountAmount;
};

// =================== API CALLS =====================

export const voucherService = {
    /**
     * Lấy danh sách vouchers còn hiệu lực (public)
     * GET /api/vouchers/public
     */
    getPublicVouchers: async (): Promise<Voucher[]> => {
        const response = await api.get('/api/vouchers/public');
        return response.data;
    },

    /**
     * Lấy vouchers áp dụng được cho đơn hàng có giá trị cụ thể
     * GET /api/vouchers/applicable
     */
    getApplicable: async (orderAmount: number): Promise<Voucher[]> => {
        const response = await api.get('/api/vouchers/applicable', {
            params: { orderAmount },
        });
        return response.data;
    },

    /**
     * Kiểm tra mã voucher có hợp lệ không
     * GET /api/vouchers/check
     */
    check: async (code: string, total: number): Promise<VoucherCheckResult> => {
        try {
            const response = await api.get('/api/vouchers/check', {
                params: { code, total },
            });
            return response.data;
        } catch (error: any) {
            return {
                valid: false,
                message: error.response?.data?.message || 'Mã giảm giá không hợp lệ',
            };
        }
    },

    /**
     * Áp dụng mã voucher
     * POST /api/vouchers/apply
     */
    apply: async (code: string, orderAmount: number): Promise<VoucherCheckResult> => {
        try {
            const response = await api.post('/api/vouchers/apply', {
                code,
                orderAmount,
            });
            return response.data;
        } catch (error: any) {
            return {
                valid: false,
                message: error.response?.data?.message || 'Không thể áp dụng mã giảm giá',
            };
        }
    },

    /**
     * Tính tiền giảm giá
     * GET /api/vouchers/calculate
     */
    calculateDiscount: async (code: string, orderAmount: number): Promise<DiscountCalculation> => {
        const response = await api.get('/api/vouchers/calculate', {
            params: { code, orderAmount },
        });
        return response.data;
    },

    /**
     * Lấy chi tiết voucher theo ID
     * GET /api/vouchers/{id}/detail
     */
    getDetail: async (id: number): Promise<Voucher> => {
        const response = await api.get(`/api/vouchers/${id}/detail`);
        return response.data;
    },
};

export default voucherService;
