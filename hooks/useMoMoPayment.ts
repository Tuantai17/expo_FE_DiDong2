/**
 * useMoMoPayment Hook
 * ====================
 * Custom hook for handling MoMo payment flow
 */

import { useState, useCallback, useRef } from 'react';
import * as Linking from 'expo-linking';
import {
    createMoMoPayment,
    checkMoMoPaymentStatus,
    simulateMoMoPayment,
    CreatePaymentRequest,
    PaymentStatusResponse,
    MoMoPaymentType,
} from '../services/momoService';

// =================== TYPES =====================

export interface MoMoPaymentState {
    isLoading: boolean;
    error: string | null;
    paymentUrl: string | null;
    qrCodeUrl: string | null;
    paymentStatus: PaymentStatusResponse | null;
    currentOrderId: number | null;
}

export interface UseMoMoPaymentResult extends MoMoPaymentState {
    initiatePayment: (request: CreatePaymentRequest, paymentType?: MoMoPaymentType) => Promise<boolean>;
    verifyPayment: (orderId: number) => Promise<PaymentStatusResponse | null>;
    openPaymentUrl: () => Promise<boolean>;
    simulatePayment: (orderId: number, amount: number) => Promise<PaymentStatusResponse>;
    resetState: () => void;
    pollPaymentStatus: (orderId: number, intervalMs?: number, maxAttempts?: number) => Promise<PaymentStatusResponse | null>;
}

// =================== CONSTANTS =====================

const POLL_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 60;  // 3 minutes max

// =================== HOOK =====================

export const useMoMoPayment = (): UseMoMoPaymentResult => {
    const [state, setState] = useState<MoMoPaymentState>({
        isLoading: false,
        error: null,
        paymentUrl: null,
        qrCodeUrl: null,
        paymentStatus: null,
        currentOrderId: null,
    });

    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCountRef = useRef<number>(0);

    /**
     * Update state helper
     */
    const updateState = useCallback((updates: Partial<MoMoPaymentState>) => {
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
            qrCodeUrl: null,
            paymentStatus: null,
            currentOrderId: null,
        });
    }, []);

    /**
     * Initiate MoMo payment
     */
    const initiatePayment = useCallback(async (
        request: CreatePaymentRequest,
        paymentType: MoMoPaymentType = 'QR'
    ): Promise<boolean> => {
        updateState({ isLoading: true, error: null });

        try {
            console.log('🚀 [MoMo Hook] Initiating payment:', request);

            const response = await createMoMoPayment(request, paymentType);

            if (!response.success) {
                updateState({
                    isLoading: false,
                    error: response.message || 'Không thể tạo thanh toán MoMo',
                });
                return false;
            }

            updateState({
                isLoading: false,
                paymentUrl: response.payUrl || null,
                qrCodeUrl: response.qrCodeUrl || response.payUrl || null,
                currentOrderId: request.orderId,
            });

            console.log('✅ [MoMo Hook] Payment initiated successfully');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            console.error('❌ [MoMo Hook] Initiate payment error:', errorMessage);
            updateState({
                isLoading: false,
                error: `Lỗi khởi tạo thanh toán: ${errorMessage}`,
            });
            return false;
        }
    }, [updateState]);

    /**
     * Verify payment status
     */
    const verifyPayment = useCallback(async (
        orderId: number
    ): Promise<PaymentStatusResponse | null> => {
        updateState({ isLoading: true });

        try {
            console.log('🔍 [MoMo Hook] Verifying payment for order:', orderId);
            const status = await checkMoMoPaymentStatus(orderId);

            updateState({
                isLoading: false,
                paymentStatus: status,
            });

            console.log('✅ [MoMo Hook] Payment verified:', status.paymentStatus);
            return status;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            console.error('❌ [MoMo Hook] Verify payment error:', errorMessage);
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
            console.warn('⚠️ [MoMo Hook] No payment URL available');
            return false;
        }

        try {
            console.log('🌐 [MoMo Hook] Opening payment URL:', state.paymentUrl);
            const canOpen = await Linking.canOpenURL(state.paymentUrl);

            if (canOpen) {
                await Linking.openURL(state.paymentUrl);
                return true;
            } else {
                updateState({ error: 'Không thể mở link thanh toán' });
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            console.error('❌ [MoMo Hook] Open URL error:', errorMessage);
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
    ): Promise<PaymentStatusResponse | null> => {
        return new Promise((resolve) => {
            pollCountRef.current = 0;

            const checkStatus = async () => {
                pollCountRef.current++;
                console.log(`🔄 [MoMo Hook] Polling attempt ${pollCountRef.current}/${maxAttempts}`);

                const status = await verifyPayment(orderId);

                if (status?.isPaid || status?.paymentStatus === 'SUCCESS') {
                    if (pollTimerRef.current) {
                        clearInterval(pollTimerRef.current);
                        pollTimerRef.current = null;
                    }
                    resolve(status);
                    return;
                }

                if (status?.paymentStatus === 'FAILED' || status?.paymentStatus === 'CANCELLED') {
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
    ): Promise<PaymentStatusResponse> => {
        updateState({ isLoading: true });

        try {
            console.log('🧪 [MoMo Hook] Simulating payment for testing');
            const result = await simulateMoMoPayment(orderId, amount);

            updateState({
                isLoading: false,
                paymentStatus: result,
            });

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            updateState({
                isLoading: false,
                error: errorMessage,
            });
            throw error;
        }
    }, [updateState]);

    return {
        ...state,
        initiatePayment,
        verifyPayment,
        openPaymentUrl,
        simulatePayment,
        resetState,
        pollPaymentStatus,
    };
};

export default useMoMoPayment;
