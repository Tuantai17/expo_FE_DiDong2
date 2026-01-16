/**
 * useVouchers - Custom Hook for Voucher Management
 * =================================================
 * Fetch và quản lý danh sách vouchers từ API
 */

import { useState, useEffect, useCallback } from 'react';
import { voucherService, Voucher, VoucherCheckResult } from '../services/voucherService';

// =================== TYPES =====================

interface UseVouchersResult {
    vouchers: Voucher[];
    applicableVouchers: Voucher[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    fetchApplicable: (orderAmount: number) => Promise<void>;
}

interface UseVoucherCheckResult {
    checking: boolean;
    result: VoucherCheckResult | null;
    checkVoucher: (code: string, total: number) => Promise<VoucherCheckResult>;
    reset: () => void;
}

// =================== HOOKS =====================

/**
 * Hook để lấy danh sách vouchers
 */
export function useVouchers(): UseVouchersResult {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [applicableVouchers, setApplicableVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch public vouchers
    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await voucherService.getPublicVouchers();
            setVouchers(data);
        } catch (err: any) {
            console.error('❌ [useVouchers] Error fetching vouchers:', err);
            setError(err.message || 'Không thể tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch applicable vouchers for order amount
    const fetchApplicable = useCallback(async (orderAmount: number) => {
        try {
            const data = await voucherService.getApplicable(orderAmount);
            setApplicableVouchers(data);
        } catch (err: any) {
            console.error('❌ [useVouchers] Error fetching applicable vouchers:', err);
            setApplicableVouchers([]);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        vouchers,
        applicableVouchers,
        loading,
        error,
        refetch,
        fetchApplicable,
    };
}

/**
 * Hook để kiểm tra mã voucher
 */
export function useVoucherCheck(): UseVoucherCheckResult {
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState<VoucherCheckResult | null>(null);

    const checkVoucher = useCallback(async (code: string, total: number): Promise<VoucherCheckResult> => {
        setChecking(true);
        try {
            const checkResult = await voucherService.check(code, total);
            setResult(checkResult);
            return checkResult;
        } catch (err: any) {
            const errorResult: VoucherCheckResult = {
                valid: false,
                message: err.message || 'Không thể kiểm tra mã giảm giá',
            };
            setResult(errorResult);
            return errorResult;
        } finally {
            setChecking(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
    }, []);

    return {
        checking,
        result,
        checkVoucher,
        reset,
    };
}

export default useVouchers;
