/**
 * Voucher Service - API cho mã giảm giá
 * ======================================
 * Quản lý tất cả API calls liên quan đến voucher/mã khuyến mãi
 */

import { api } from './api';

// =================== TYPES =====================

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type VoucherType = 'ORDER' | 'SHIPPING';

export interface Voucher {
    id: number;
    code: string;
    discount: number;
    discountType: DiscountType;
    voucherType?: VoucherType; // ORDER = giảm đơn hàng, SHIPPING = giảm phí ship
    minOrderAmount: number;
    maxDiscountAmount: number;
    maxShippingDiscount?: number; // Giảm ship tối đa (cho SHIPPING voucher)
    minShippingFee?: number; // Phí ship tối thiểu để áp dụng
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
     * Kiểm tra mã voucher ship có hợp lệ không
     * GET /api/vouchers/check-shipping
     */
    checkShippingVoucher: async (code: string, shippingFee: number, orderAmount: number): Promise<VoucherCheckResult> => {
        try {
            console.log('🚚 [VoucherService] checkShippingVoucher called:', { code, shippingFee, orderAmount });
            
            // First try the normal check endpoint
            const response = await api.get('/api/vouchers/check', {
                params: { code, total: orderAmount },
            });
            
            const result = response.data;
            console.log('📋 [VoucherService] API response:', result);
            
            // If valid, calculate shipping discount
            if (result.valid && result.voucher) {
                const voucher = result.voucher;
                
                // Calculate shipping discount
                let discountAmount = 0;
                if (voucher.discountType === 'PERCENTAGE') {
                    discountAmount = (shippingFee * voucher.discount) / 100;
                } else {
                    discountAmount = Math.min(voucher.discount, shippingFee);
                }
                
                // Apply max shipping discount cap
                if (voucher.maxShippingDiscount && discountAmount > voucher.maxShippingDiscount) {
                    discountAmount = voucher.maxShippingDiscount;
                }
                
                // Can't exceed shipping fee
                discountAmount = Math.min(discountAmount, shippingFee);
                
                console.log('✅ [VoucherService] Shipping discount calculated:', discountAmount);
                
                return {
                    valid: true,
                    message: 'Áp dụng giảm phí ship thành công!',
                    voucher: voucher,
                    discountAmount: discountAmount,
                };
            }
            
            console.log('❌ [VoucherService] Shipping voucher not valid:', result.message);
            return result;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || '';
            console.log('⚠️ [VoucherService] API error:', errorMsg);
            
            // If error is about minOrderAmount, try to get voucher details directly
            // and calculate discount locally (for shipping vouchers, minOrderAmount may not apply)
            if (errorMsg.includes('tối thiểu') || errorMsg.includes('minimum')) {
                try {
                    // Try to get voucher by code  from public endpoint
                    const publicRes = await api.get('/api/vouchers/public');
                    const vouchers = publicRes.data || [];
                    const voucher = vouchers.find((v: any) => v.code?.toUpperCase() === code.toUpperCase());
                    
                    if (voucher && (voucher.voucherType === 'SHIPPING' || code.toUpperCase().includes('SHIP'))) {
                        // Calculate shipping discount locally
                        let discountAmount = 0;
                        if (voucher.discountType === 'PERCENTAGE') {
                            discountAmount = (shippingFee * voucher.discount) / 100;
                        } else {
                            discountAmount = Math.min(voucher.discount, shippingFee);
                        }
                        
                        if (voucher.maxShippingDiscount && discountAmount > voucher.maxShippingDiscount) {
                            discountAmount = voucher.maxShippingDiscount;
                        }
                        discountAmount = Math.min(discountAmount, shippingFee);
                        
                        console.log('✅ [VoucherService] SHIPPING calculated locally:', discountAmount);
                        return {
                            valid: true,
                            message: 'Áp dụng giảm phí ship thành công!',
                            voucher: voucher,
                            discountAmount: discountAmount,
                        };
                    }
                } catch (innerError) {
                    console.error('❌ [VoucherService] Fallback failed:', innerError);
                }
            }
            
            console.error('❌ [VoucherService] Error:', error.response?.data || error.message);
            return {
                valid: false,
                message: error.response?.data?.message || 'Mã giảm phí ship không hợp lệ',
            };
        }
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

// =================== USER VOUCHER TYPES =====================

export interface UserVoucher {
    id: number;
    userId: number;
    voucherId: number;
    voucherCode: string;
    discount: number;
    discountType: DiscountType;
    voucherType?: VoucherType; // ORDER or SHIPPING
    minOrderAmount: number;
    maxDiscountAmount: number;
    maxShippingDiscount?: number;
    expiryDate: string;
    description?: string;
    isUsed: boolean;
    usedAt?: string;
    savedAt: string;
    isValid: boolean;
    usageLimit: number;    // Số lần có thể sử dụng (từ spin wins)
    usedCount: number;     // Số lần đã sử dụng
}

export interface SaveVoucherResult {
    success: boolean;
    message: string;
    data?: UserVoucher;
}

// =================== USER VOUCHER API CALLS =====================

export const userVoucherService = {
    /**
     * Lưu voucher cho người dùng
     * POST /api/user-vouchers/save
     */
    saveVoucher: async (userId: number, voucherId: number): Promise<SaveVoucherResult> => {
        try {
            const response = await api.post('/api/user-vouchers/save', {
                userId,
                voucherId,
            });
            return {
                success: true,
                message: response.data?.message || 'Lưu voucher thành công!',
                data: response.data?.data,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lưu voucher',
            };
        }
    },

    /**
     * Lấy tất cả voucher đã lưu của user
     * GET /api/user-vouchers/user/{userId}
     */
    getUserVouchers: async (userId: number): Promise<UserVoucher[]> => {
        const response = await api.get(`/api/user-vouchers/user/${userId}`);
        return response.data?.data || [];
    },

    /**
     * Lấy voucher còn hiệu lực của user
     * GET /api/user-vouchers/user/{userId}/valid
     */
    getValidUserVouchers: async (userId: number): Promise<UserVoucher[]> => {
        const response = await api.get(`/api/user-vouchers/user/${userId}/valid`);
        return response.data?.data || [];
    },

    /**
     * Kiểm tra user đã lưu voucher chưa
     * GET /api/user-vouchers/check
     */
    checkVoucherSaved: async (userId: number, voucherId: number): Promise<boolean> => {
        try {
            const response = await api.get('/api/user-vouchers/check', {
                params: { userId, voucherId },
            });
            return response.data?.data || false;
        } catch {
            return false;
        }
    },

    /**
     * Xóa voucher đã lưu
     * DELETE /api/user-vouchers/remove
     */
    removeVoucher: async (userId: number, voucherId: number): Promise<boolean> => {
        try {
            await api.delete('/api/user-vouchers/remove', {
                params: { userId, voucherId },
            });
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Đếm số voucher chưa sử dụng
     * GET /api/user-vouchers/user/{userId}/count
     */
    countUnusedVouchers: async (userId: number): Promise<number> => {
        try {
            const response = await api.get(`/api/user-vouchers/user/${userId}/count`);
            return response.data?.data || 0;
        } catch {
            return 0;
        }
    },
};

export default voucherService;
