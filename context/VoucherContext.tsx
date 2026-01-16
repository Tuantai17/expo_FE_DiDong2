/**
 * VoucherContext - State Management for Vouchers
 * ===============================================
 * Quản lý state voucher đã áp dụng trong checkout flow
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Voucher, VoucherCheckResult, voucherService } from '../services/voucherService';

// =================== TYPES =====================

interface VoucherContextType {
    // State
    appliedVoucher: Voucher | null;
    discountAmount: number;
    voucherCode: string;
    isApplying: boolean;
    error: string | null;

    // Actions
    applyVoucher: (code: string, orderAmount: number) => Promise<boolean>;
    removeVoucher: () => void;
    checkVoucher: (code: string, orderAmount: number) => Promise<VoucherCheckResult>;
    clearError: () => void;
}

// =================== CONTEXT =====================

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

// =================== PROVIDER =====================

interface VoucherProviderProps {
    children: ReactNode;
}

export function VoucherProvider({ children }: VoucherProviderProps) {
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [voucherCode, setVoucherCode] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Kiểm tra mã voucher
    const checkVoucher = useCallback(async (code: string, orderAmount: number): Promise<VoucherCheckResult> => {
        try {
            const result = await voucherService.check(code, orderAmount);
            return result;
        } catch (err: any) {
            return {
                valid: false,
                message: err.message || 'Không thể kiểm tra mã giảm giá',
            };
        }
    }, []);

    // Áp dụng mã voucher
    const applyVoucher = useCallback(async (code: string, orderAmount: number): Promise<boolean> => {
        if (!code.trim()) {
            setError('Vui lòng nhập mã giảm giá');
            return false;
        }

        setIsApplying(true);
        setError(null);

        try {
            console.log('🎟️ [VoucherContext] Checking voucher:', code);
            const result = await voucherService.check(code, orderAmount);
            console.log('📋 [VoucherContext] Check result:', result);

            if (result.valid && result.voucher) {
                setAppliedVoucher(result.voucher);
                setDiscountAmount(result.discountAmount || 0);
                setVoucherCode(code.toUpperCase());
                console.log('✅ [VoucherContext] Voucher applied:', code, 'Discount:', result.discountAmount);
                return true;
            } else {
                setError(result.message || 'Mã giảm giá không hợp lệ');
                return false;
            }
        } catch (err: any) {
            console.error('❌ [VoucherContext] Error applying voucher:', err);
            setError(err.message || 'Không thể áp dụng mã giảm giá');
            return false;
        } finally {
            setIsApplying(false);
        }
    }, []);

    // Xóa/Hủy voucher đã áp dụng
    const removeVoucher = useCallback(() => {
        console.log('🗑️ [VoucherContext] Removing voucher');
        setAppliedVoucher(null);
        setDiscountAmount(0);
        setVoucherCode('');
        setError(null);
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // =================== VALUE =====================

    const value: VoucherContextType = {
        appliedVoucher,
        discountAmount,
        voucherCode,
        isApplying,
        error,
        applyVoucher,
        removeVoucher,
        checkVoucher,
        clearError,
    };

    return (
        <VoucherContext.Provider value={value}>
            {children}
        </VoucherContext.Provider>
    );
}

// =================== HOOK =====================

export function useVoucherContext() {
    const context = useContext(VoucherContext);
    if (!context) {
        throw new Error('useVoucherContext must be used within VoucherProvider');
    }
    return context;
}

export default VoucherContext;
