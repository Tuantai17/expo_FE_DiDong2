/**
 * VNPay Platform Utils
 * ====================
 * Cross-platform utility functions for VNPay payment
 * Handles Web vs Native (iOS/Android) payment flows
 */

import { Linking, Platform } from 'react-native';

// =================== TYPES =====================

export interface VNPayOpenOptions {
    paymentUrl: string;
    orderId: number;
    amount: number;
    onWebRedirect?: () => void;
}

export interface VNPayResult {
    success: boolean;
    platform: 'web' | 'native';
    method: 'redirect' | 'webview' | 'linking';
}

// =================== CONSTANTS =====================

// Success/Fail URL patterns that VNPay will redirect to
export const VNPAY_SUCCESS_PATTERNS = [
    '/product/order-success',
    '/order-success',
    'vnp_ResponseCode=00',
];

export const VNPAY_FAIL_PATTERNS = [
    '/product/checkout?error',
    'vnp_ResponseCode=',
];

// =================== PLATFORM DETECTION =====================

/**
 * Check if running on Web platform
 */
export const isWeb = (): boolean => {
    return Platform.OS === 'web';
};

/**
 * Check if running on Native platform (iOS/Android)
 */
export const isNative = (): boolean => {
    return Platform.OS === 'ios' || Platform.OS === 'android';
};

// =================== WEB PAYMENT FUNCTIONS =====================

/**
 * Open VNPay payment page on Web using browser redirect
 * @param paymentUrl - VNPay payment URL from backend
 * @param useNewTab - Open in new tab (popup) instead of redirect
 */
export const openVNPayWeb = (
    paymentUrl: string,
    useNewTab: boolean = false
): boolean => {
    if (!isWeb()) {
        console.warn('[VNPay] openVNPayWeb called on non-web platform');
        return false;
    }

    try {
        if (typeof window === 'undefined') {
            console.error('[VNPay] Window is undefined');
            return false;
        }

        if (useNewTab) {
            // Open in new tab - may be blocked by popup blockers
            const newWindow = window.open(paymentUrl, '_blank');
            if (!newWindow) {
                console.warn('[VNPay] Popup blocked, falling back to redirect');
                window.location.href = paymentUrl;
            }
        } else {
            // Direct redirect - most reliable method
            window.location.href = paymentUrl;
        }

        console.log('[VNPay] Web redirect initiated:', paymentUrl);
        return true;
    } catch (error) {
        console.error('[VNPay] Web redirect error:', error);
        return false;
    }
};

// =================== NATIVE PAYMENT FUNCTIONS =====================

/**
 * Open VNPay using device browser (fallback for native)
 * @param paymentUrl - VNPay payment URL
 */
export const openVNPayBrowser = async (paymentUrl: string): Promise<boolean> => {
    try {
        const canOpen = await Linking.canOpenURL(paymentUrl);
        if (canOpen) {
            await Linking.openURL(paymentUrl);
            console.log('[VNPay] Opened in browser:', paymentUrl);
            return true;
        }
        console.warn('[VNPay] Cannot open URL:', paymentUrl);
        return false;
    } catch (error) {
        console.error('[VNPay] Browser open error:', error);
        return false;
    }
};

// =================== MAIN OPEN FUNCTION =====================

/**
 * Open VNPay payment - Platform-aware
 * 
 * Usage:
 * - On Web: Redirects browser to VNPay
 * - On Native: Navigate to WebView screen (caller must handle)
 * 
 * @param options - Payment options
 * @returns Result object with platform and method used
 */
export const openVNPay = (options: VNPayOpenOptions): VNPayResult => {
    const { paymentUrl, onWebRedirect } = options;

    if (isWeb()) {
        // WEB: Use browser redirect
        console.log('[VNPay] Platform: Web - Using browser redirect');
        
        if (onWebRedirect) {
            onWebRedirect();
        }
        
        const success = openVNPayWeb(paymentUrl, false);
        return {
            success,
            platform: 'web',
            method: 'redirect',
        };
    } else {
        // NATIVE: Return signal to use WebView
        // The caller (checkout screen) should navigate to WebView screen
        console.log('[VNPay] Platform: Native - Should use WebView');
        return {
            success: true,
            platform: 'native',
            method: 'webview',
        };
    }
};

// =================== URL DETECTION =====================

/**
 * Check if URL indicates payment success
 */
export const isSuccessUrl = (url: string): boolean => {
    return VNPAY_SUCCESS_PATTERNS.some(pattern => url.includes(pattern));
};

/**
 * Check if URL indicates payment failure
 */
export const isFailureUrl = (url: string): boolean => {
    // Check for fail patterns but exclude success code
    if (isSuccessUrl(url)) return false;
    return VNPAY_FAIL_PATTERNS.some(pattern => url.includes(pattern));
};

/**
 * Parse VNPay return URL parameters
 */
export const parseVNPayReturnUrl = (url: string): {
    responseCode?: string;
    orderId?: string;
    transactionNo?: string;
    amount?: number;
    isSuccess: boolean;
} => {
    try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        
        const responseCode = params.get('vnp_ResponseCode') || undefined;
        const orderId = params.get('orderId') || params.get('vnp_TxnRef') || undefined;
        const transactionNo = params.get('vnp_TransactionNo') || undefined;
        const amountStr = params.get('vnp_Amount');
        const amount = amountStr ? parseInt(amountStr, 10) / 100 : undefined;
        
        return {
            responseCode,
            orderId,
            transactionNo,
            amount,
            isSuccess: responseCode === '00',
        };
    } catch {
        return {
            isSuccess: isSuccessUrl(url),
        };
    }
};

// =================== EXPORTS =====================

export default {
    isWeb,
    isNative,
    openVNPay,
    openVNPayWeb,
    openVNPayBrowser,
    isSuccessUrl,
    isFailureUrl,
    parseVNPayReturnUrl,
};
