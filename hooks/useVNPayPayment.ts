/**
 * useVNPayPayment Hook
 * =====================
 * Custom hook for handling VNPay payment flow
 * Replaces useMoMoPayment hook
 */

import * as Linking from 'expo-linking';
import { useCallback, useRef, useState } from 'react';
import {
    checkVNPayPaymentStatus,
    confirmVNPayPayment,
    createVNPayPayment,
    CreateVNPayPaymentRequest,
    simulateVNPayPayment,
    VNPayStatusResponse,
} from '../services/vnpayService';

// =================== TYPES =====================

export interface VNPayPaymentState {
    isLoading: boolean;
    error: string | null;
    paymentUrl: string | null;
    paymentStatus: VNPayStatusResponse | null;
    currentOrderId: number | null;
    vnpTxnRef: string | null;
}

export interface UseVNPayPaymentResult extends VNPayPaymentState {
    initiatePayment: (request: CreateVNPayPaymentRequest) => Promise<{ success: boolean; payUrl?: string }>;
    verifyPayment: (orderId: number) => Promise<VNPayStatusResponse | null>;
    openPaymentUrl: () => Promise<boolean>;
    simulatePayment: (orderId: number, amount: number) => Promise<{ success: boolean; message: string }>;
    confirmPayment: (orderId: number) => Promise<{ success: boolean; message: string }>;
    resetState: () => void;
    pollPaymentStatus: (orderId: number, intervalMs?: number, maxAttempts?: number) => Promise<VNPayStatusResponse | null>;
}

// =================== CONSTANTS =====================

const POLL_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 60;  // 3 minutes max

// =================== HOOK =====================

export const useVNPayPayment = (): UseVNPayPaymentResult => {
    const [state, setState] = useState<VNPayPaymentState>({
        isLoading: false,
        error: null,
        paymentUrl: null,
        paymentStatus: null,
        currentOrderId: null,
        vnpTxnRef: null,
    });

    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCountRef = useRef<number>(0);

    /**
     * Update state helper
     */
    const updateState = useCallback((updates: Partial<VNPayPaymentState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    /**
     * Reset state
     */
    const resetState = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        pollCountRef.current = 0;
        setState({
            isLoading: false,
            error: null,
            paymentUrl: null,
            paymentStatus: null,
            currentOrderId: null,
            vnpTxnRef: null,
        });
    }, []);

    /**
     * Initiate VNPay payment
     */
    const initiatePayment = useCallback(async (
        request: CreateVNPayPaymentRequest
    ): Promise<{ success: boolean; payUrl?: string }> => {
        updateState({ isLoading: true, error: null });

        try {
            console.log('🚀 [VNPay Hook] Initiating payment:', request);

            const response = await createVNPayPayment(request);

            if (!response.success) {
                updateState({
                    isLoading: false,
                    error: response.message || 'Không thể tạo thanh toán VNPay',
                });
                return { success: false };
            }

            const payUrl = response.payUrl || null;

            updateState({
                isLoading: false,
                paymentUrl: payUrl,
                currentOrderId: request.orderId,
                vnpTxnRef: response.vnpTxnRef || null,
            });

            console.log('✅ [VNPay Hook] Payment initiated successfully');
            console.log('   - payUrl:', payUrl);
            console.log('   - vnpTxnRef:', response.vnpTxnRef);

            return {
                success: true,
                payUrl: payUrl || undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            console.error('❌ [VNPay Hook] Initiate payment error:', errorMessage);
            updateState({
                isLoading: false,
                error: `Lỗi khởi tạo thanh toán: ${errorMessage}`,
            });
            return { success: false };
        }
    }, [updateState]);

    /**
     * Verify payment status
     */
    const verifyPayment = useCallback(async (
        orderId: number
    ): Promise<VNPayStatusResponse | null> => {
        updateState({ isLoading: true });

        try {
            console.log('🔍 [VNPay Hook] Verifying payment for order:', orderId);
            const status = await checkVNPayPaymentStatus(orderId);

            updateState({
                isLoading: false,
                paymentStatus: status,
            });

            console.log('✅ [VNPay Hook] Payment verified:', status.status);
            return status;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            console.error('❌ [VNPay Hook] Verify payment error:', errorMessage);
            updateState({
                isLoading: false,
                error: `Lỗi kiểm tra trạng thái: ${errorMessage}`,
            });
            return null;
        }
    }, [updateState]);

    /**
     * Open payment URL in browser
     */
    const openPaymentUrl = useCallback(async (): Promise<boolean> => {
        if (!state.paymentUrl) {
            console.warn('⚠️ [VNPay Hook] No payment URL available');
            return false;
        }

        try {
            console.log('🌐 [VNPay Hook] Opening payment URL:', state.paymentUrl);
            const canOpen = await Linking.canOpenURL(state.paymentUrl);

            if (canOpen) {
                await Linking.openURL(state.paymentUrl);
                return true;
            } else {
                // Try to open anyway
                await Linking.openURL(state.paymentUrl);
                return true;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            console.error('❌ [VNPay Hook] Open URL error:', errorMessage);
            updateState({ error: `Lỗi mở trình duyệt: ${errorMessage}` });
            return false;
        }
    }, [state.paymentUrl, updateState]);

    /**
     * Poll payment status until success or max attempts
     */
    const pollPaymentStatus = useCallback(async (
        orderId: number,
        intervalMs: number = POLL_INTERVAL_MS,
        maxAttempts: number = MAX_POLL_ATTEMPTS
    ): Promise<VNPayStatusResponse | null> => {
        return new Promise((resolve) => {
            pollCountRef.current = 0;

            const checkStatus = async () => {
                pollCountRef.current++;
                console.log(`🔄 [VNPay Hook] Polling attempt ${pollCountRef.current}/${maxAttempts}`);

                const status = await verifyPayment(orderId);

                if (status?.status === 'SUCCESS') {
                    if (pollTimerRef.current) {
                        clearInterval(pollTimerRef.current);
                        pollTimerRef.current = null;
                    }
                    resolve(status);
                    return;
                }

                if (status?.status === 'FAILED') {
                    if (pollTimerRef.current) {
                        clearInterval(pollTimerRef.current);
                        pollTimerRef.current = null;
                    }
                    resolve(status);
                    return;
                }

                if (pollCountRef.current >= maxAttempts) {
                    if (pollTimerRef.current) {
                        clearInterval(pollTimerRef.current);
                        pollTimerRef.current = null;
                    }
                    resolve(status);
                    return;
                }
            };

            // First check immediately
            checkStatus();

            // Then poll at interval
            pollTimerRef.current = setInterval(checkStatus, intervalMs);
        });
    }, [verifyPayment]);

    /**
     * Simulate successful payment (for testing)
     */
    const simulatePayment = useCallback(async (
        orderId: number,
        amount: number
    ): Promise<{ success: boolean; message: string }> => {
        updateState({ isLoading: true });

        try {
            console.log('🧪 [VNPay Hook] Simulating payment for testing');
            const result = await simulateVNPayPayment(orderId, amount);

            // Refresh status after simulate
            const status = await checkVNPayPaymentStatus(orderId);
            
            updateState({
                isLoading: false,
                paymentStatus: status,
            });

            return {
                success: result.success,
                message: result.message,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            updateState({
                isLoading: false,
                error: errorMessage,
            });
            return { success: false, message: errorMessage };
        }
    }, [updateState]);

    /**
     * Confirm payment manually
     */
    const confirmPayment = useCallback(async (
        orderId: number
    ): Promise<{ success: boolean; message: string }> => {
        updateState({ isLoading: true });

        try {
            console.log('✅ [VNPay Hook] Confirming payment for order:', orderId);
            const result = await confirmVNPayPayment(orderId);

            // Refresh status after confirm
            const status = await checkVNPayPaymentStatus(orderId);
            
            updateState({
                isLoading: false,
                paymentStatus: status,
            });

            return {
                success: result.success,
                message: result.message,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            updateState({
                isLoading: false,
                error: errorMessage,
            });
            return { success: false, message: errorMessage };
        }
    }, [updateState]);

    return {
        ...state,
        initiatePayment,
        verifyPayment,
        openPaymentUrl,
        simulatePayment,
        confirmPayment,
        resetState,
        pollPaymentStatus,
    };
};

export default useVNPayPayment;
