/**
 * VNPay Payment Service
 * =====================
 * Handles VNPay payment API calls
 * Based on backend API: /api/payment/vnpay/*
 */

import { API_BASE_URL } from "../config/api.config";

// =================== TYPES =====================

export interface CreateVNPayPaymentRequest {
  orderId: number;
  amount: number;
  orderInfo?: string;
}

export interface CreateVNPayPaymentResponse {
  success: boolean;
  payUrl?: string;
  vnpTxnRef?: string;
  paymentId?: number;
  message?: string;
}

export interface VNPayStatusResponse {
  success: boolean;
  orderId: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  amount: number;
  transactionId?: string;
  paymentGateway: string;
  paidAt?: string;
  message?: string;
}

export interface VNPaySimulateResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

// =================== API ENDPOINTS =====================

const VNPAY_API_BASE = `${API_BASE_URL}/api/payment/vnpay`;

// =================== API FUNCTIONS =====================

/**
 * Tạo link thanh toán VNPay
 * POST /api/payment/vnpay/create
 */
export const createVNPayPayment = async (
  request: CreateVNPayPaymentRequest
): Promise<CreateVNPayPaymentResponse> => {
  try {
    console.log("📤 [VNPay] Creating payment:", request);

    const response = await fetch(`${VNPAY_API_BASE}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        orderId: request.orderId,
        amount: request.amount,
        orderInfo:
          request.orderInfo || `Thanh toan don hang #${request.orderId}`,
      }),
    });

    const data = await response.json();
    console.log("📥 [VNPay] Create payment response:", data);

    return {
      success: data.success || !!data.payUrl,
      payUrl: data.payUrl,
      vnpTxnRef: data.vnpTxnRef,
      paymentId: data.paymentId,
      message: data.message || "Tạo thanh toán thành công",
    };
  } catch (error) {
    console.error("❌ [VNPay] Create Payment Error:", error);
    return {
      success: false,
      message: `Lỗi kết nối: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Kiểm tra trạng thái thanh toán
 * GET /api/payment/vnpay/status/{orderId}
 */
export const checkVNPayPaymentStatus = async (
  orderId: number
): Promise<VNPayStatusResponse> => {
  try {
    console.log("📤 [VNPay] Checking payment status for order:", orderId);

    const response = await fetch(`${VNPAY_API_BASE}/status/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = await response.json();
    console.log("📥 [VNPay] Payment status response:", data);

    return {
      success: data.success ?? true,
      orderId: data.orderId ?? orderId,
      status: data.status ?? "PENDING",
      amount: data.amount ?? 0,
      transactionId: data.transactionId ?? "",
      paymentGateway: data.paymentGateway ?? "VNPAY",
      paidAt: data.paidAt ?? null,
      message: data.message ?? "Lấy trạng thái thành công",
    };
  } catch (error) {
    console.error("❌ [VNPay] Check Status Error:", error);
    return {
      success: false,
      orderId: orderId,
      status: "PENDING",
      amount: 0,
      paymentGateway: "VNPAY",
      message: `Lỗi kết nối: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Simulate successful payment (for development/testing only)
 * POST /api/payment/vnpay/simulate
 */
export const simulateVNPayPayment = async (
  orderId: number,
  amount: number
): Promise<VNPaySimulateResponse> => {
  try {
    console.log("🧪 [VNPay] Simulating payment for order:", orderId);

    const response = await fetch(`${VNPAY_API_BASE}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount,
      }),
    });

    const data = await response.json();
    console.log("📥 [VNPay] Simulate payment response:", data);

    return {
      success: data.success ?? true,
      message: data.message ?? "Simulate payment thành công",
      transactionId: data.transactionId ?? `VNPAY_SIM_${orderId}_${Date.now()}`,
    };
  } catch (error) {
    console.error("❌ [VNPay] Simulate Payment Error:", error);

    // Fallback: return mock success if API fails
    return {
      success: true,
      message: "Simulate payment thành công (fallback)",
      transactionId: `VNPAY_SIM_${orderId}_${Date.now()}`,
    };
  }
};

/**
 * Manual confirm payment
 * POST /api/payment/vnpay/confirm/{orderId}
 */
export const confirmVNPayPayment = async (
  orderId: number
): Promise<VNPaySimulateResponse> => {
  try {
    console.log("✅ [VNPay] Confirming payment for order:", orderId);

    const response = await fetch(`${VNPAY_API_BASE}/confirm/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = await response.json();
    console.log("📥 [VNPay] Confirm payment response:", data);

    return {
      success: data.success ?? false,
      message: data.message ?? "Xác nhận thanh toán thành công",
      transactionId: data.transactionId ?? "",
    };
  } catch (error) {
    console.error("❌ [VNPay] Confirm Payment Error:", error);
    return {
      success: false,
      message: `Lỗi xác nhận thanh toán: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

// =================== EXPORTS =====================

export const vnpayService = {
  createPayment: createVNPayPayment,
  checkStatus: checkVNPayPaymentStatus,
  simulate: simulateVNPayPayment,
  confirm: confirmVNPayPayment,
};

export default vnpayService;
