/**
 * MoMo Payment Service
 * ====================
 * Handles MoMo payment API calls
 */

import { API_BASE_URL } from '../config/api.config';

// =================== TYPES =====================

export interface CreatePaymentRequest {
    orderId: number;
    amount: number;
    orderInfo?: string;
}

export interface CreatePaymentResponse {
    success: boolean;
    payUrl?: string;
    qrCodeUrl?: string;
    deeplink?: string;
    orderId?: string;
    requestId?: string;
    message: string;
    errorCode?: number;
}

export interface PaymentStatusResponse {
    success: boolean;
    orderId: number;
    orderStatus: string;
    paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';
    paymentMethod: string;
    transactionId: string;
    amount: number;
    paidAt: string | null;
    isPaid: boolean;
    totalAmount: number;
    message: string;
}

export type MoMoPaymentType = 'QR' | 'CARD' | 'WALLET';

// =================== API ENDPOINTS =====================

const MOMO_API_BASE = `${API_BASE_URL}/api/payment/momo`;

// =================== API FUNCTIONS =====================

/**
 * Tạo link thanh toán MoMo
 */
export const createMoMoPayment = async (
    request: CreatePaymentRequest,
    paymentType: MoMoPaymentType = 'QR'
): Promise<CreatePaymentResponse> => {
    try {
        console.log('📤 [MoMo] Creating payment:', { ...request, paymentType });

        const response = await fetch(`${MOMO_API_BASE}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                orderId: request.orderId,
                amount: request.amount,
                orderInfo: request.orderInfo || `Thanh toan don hang #${request.orderId}`,
                requestType: paymentType === 'QR' ? 'captureWallet' : 'payWithATM',
            }),
        });

        const data = await response.json();
        console.log('📥 [MoMo] Create payment response:', data);

        return {
            success: data.success || !!data.payUrl,
            payUrl: data.payUrl,
            qrCodeUrl: data.qrCodeUrl,
            deeplink: data.deeplink,
            orderId: data.orderId,
            requestId: data.requestId,
            message: data.message || 'Tạo thanh toán thành công',
            errorCode: data.errorCode,
        };
    } catch (error) {
        console.error('❌ [MoMo] Create Payment Error:', error);
        return {
            success: false,
            message: `Lỗi kết nối: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

/**
 * Kiểm tra trạng thái thanh toán
 */
export const checkMoMoPaymentStatus = async (
    orderId: number
): Promise<PaymentStatusResponse> => {
    try {
        console.log('📤 [MoMo] Checking payment status for order:', orderId);

        const response = await fetch(`${MOMO_API_BASE}/status/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        console.log('📥 [MoMo] Payment status response:', data);

        return {
            success: data.success ?? true,
            orderId: data.orderId ?? orderId,
            orderStatus: data.orderStatus ?? 'UNKNOWN',
            paymentStatus: data.paymentStatus ?? 'UNKNOWN',
            paymentMethod: data.paymentMethod ?? 'MOMO',
            transactionId: data.transactionId ?? '',
            amount: data.amount ?? 0,
            paidAt: data.paidAt ?? null,
            isPaid: data.isPaid ?? false,
            totalAmount: data.totalAmount ?? 0,
            message: data.message ?? 'Lấy trạng thái thành công',
        };
    } catch (error) {
        console.error('❌ [MoMo] Check Status Error:', error);
        return {
            success: false,
            orderId: orderId,
            orderStatus: 'UNKNOWN',
            paymentStatus: 'UNKNOWN',
            paymentMethod: 'MOMO',
            transactionId: '',
            amount: 0,
            paidAt: null,
            isPaid: false,
            totalAmount: 0,
            message: `Lỗi kết nối: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

/**
 * Simulate successful payment (for development/testing only)
 */
export const simulateMoMoPayment = async (
    orderId: number,
    amount: number
): Promise<PaymentStatusResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        success: true,
        orderId: orderId,
        orderStatus: 'PAID',
        paymentStatus: 'SUCCESS',
        paymentMethod: 'MOMO',
        transactionId: `MOMO_${orderId}_${Date.now()}`,
        amount: amount,
        paidAt: new Date().toISOString(),
        isPaid: true,
        totalAmount: amount,
        message: 'Thanh toán thành công',
    };
};

export default {
    createMoMoPayment,
    checkMoMoPaymentStatus,
    simulateMoMoPayment,
};
