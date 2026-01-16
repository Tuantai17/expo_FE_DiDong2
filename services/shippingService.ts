/**
 * Shipping Service
 * ================
 * Calls backend API to calculate shipping fees based on province
 * Supports dual voucher system (ORDER + SHIPPING)
 */

import { api } from './api';

// Types
export interface ProvinceDTO {
    code: string;
    name: string;
    zoneCode: string;
    zoneName: string;
}

export interface ShippingCalculateRequest {
    provinceCode: string;
    orderAmount: number;
}

export interface ShippingCalculateResponse {
    shippingFee: number;
    zoneCode: string;
    zoneName: string;
    provinceName: string;
    freeShipping: boolean;
    message?: string;
}

export interface CheckoutPreviewRequest {
    provinceCode: string;
    subtotal: number;
    orderVoucherCode?: string;
    shippingVoucherCode?: string;
}

export interface AppliedVoucherInfo {
    code: string;
    discount: number;
    description?: string;
    type: 'ORDER' | 'SHIPPING';
}

export interface CheckoutPreviewResponse {
    subtotal: number;
    shippingFee: number;
    orderDiscount: number;
    shippingDiscount: number;
    finalShippingFee: number;
    totalPay: number;
    applied?: {
        orderVoucher?: AppliedVoucherInfo;
        shippingVoucher?: AppliedVoucherInfo;
    };
    success: boolean;
    message?: string;
}

// Default values when API is unavailable
const DEFAULT_SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 1000000;

// Province code mapping for Vietnamese provinces
// Can be used for offline fallback
const ZONE_FEES: Record<string, number> = {
    'HCM': 15000,
    'HN': 25000,
    'MIEN_NAM': 20000,
    'MIEN_TRUNG': 30000,
    'MIEN_BAC': 28000,
    'OTHER': 35000,
};

/**
 * Extract province code from address string
 * Tries to identify major cities/provinces from VN address format
 */
export const extractProvinceFromAddress = (address: string): string | null => {
    if (!address) return null;
    
    const addressLower = address.toLowerCase();
    
    // Try to match major cities first
    if (addressLower.includes('hồ chí minh') || 
        addressLower.includes('ho chi minh') ||
        addressLower.includes('thủ đức') ||
        addressLower.includes('thu duc') ||
        addressLower.includes('sài gòn') ||
        addressLower.includes('saigon')) {
        return '79'; // HCM province code
    }
    
    if (addressLower.includes('hà nội') || 
        addressLower.includes('ha noi') ||
        addressLower.includes('hanoi')) {
        return '01'; // HN province code
    }
    
    if (addressLower.includes('đà nẵng') || addressLower.includes('da nang')) {
        return '48';
    }
    
    if (addressLower.includes('bình dương') || addressLower.includes('binh duong')) {
        return '74';
    }
    
    if (addressLower.includes('đồng nai') || addressLower.includes('dong nai')) {
        return '75';
    }
    
    if (addressLower.includes('hải phòng') || addressLower.includes('hai phong')) {
        return '22';
    }
    
    if (addressLower.includes('cần thơ') || addressLower.includes('can tho')) {
        return '87';
    }
    
    // No match found - return null for default handling
    return null;
};

/**
 * Get all provinces from backend
 */
export const getProvinces = async (): Promise<ProvinceDTO[]> => {
    try {
        const response = await api.get('/api/shipping/provinces');
        return response.data;
    } catch (error) {
        console.error('[Shipping] Failed to fetch provinces:', error);
        return [];
    }
};

/**
 * Calculate shipping fee based on province and order amount
 */
export const calculateShippingFee = async (
    provinceCode: string,
    orderAmount: number
): Promise<ShippingCalculateResponse> => {
    try {
        const response = await api.post('/api/shipping/calculate', {
            provinceCode,
            orderAmount,
        });
        return response.data;
    } catch (error) {
        console.error('[Shipping] API error, using fallback:', error);
        
        // Fallback calculation
        const isFree = orderAmount >= FREE_SHIPPING_THRESHOLD;
        return {
            shippingFee: isFree ? 0 : DEFAULT_SHIPPING_FEE,
            zoneCode: 'FALLBACK',
            zoneName: 'Mặc định',
            provinceName: '',
            freeShipping: isFree,
            message: isFree ? 'Miễn phí vận chuyển' : undefined,
        };
    }
};

/**
 * Calculate shipping from address string (convenience method)
 */
export const calculateShippingFromAddress = async (
    address: string,
    orderAmount: number
): Promise<ShippingCalculateResponse> => {
    const provinceCode = extractProvinceFromAddress(address) || 'OTHER';
    return calculateShippingFee(provinceCode, orderAmount);
};

/**
 * Preview checkout with dual voucher support
 */
export const previewCheckout = async (
    request: CheckoutPreviewRequest
): Promise<CheckoutPreviewResponse> => {
    try {
        const response = await api.post('/api/orders/preview', request);
        return response.data;
    } catch (error: any) {
        console.error('[Shipping] Checkout preview error:', error);
        
        // Return error response
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra';
        
        // Fallback calculation if API unavailable
        const shippingFee = request.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
        
        return {
            subtotal: request.subtotal,
            shippingFee,
            orderDiscount: 0,
            shippingDiscount: 0,
            finalShippingFee: shippingFee,
            totalPay: request.subtotal + shippingFee,
            success: false,
            message: errorMessage,
        };
    }
};

/**
 * Offline calculation fallback
 */
export const calculateShippingOffline = (
    address: string,
    orderAmount: number
): { shippingFee: number; isFree: boolean } => {
    // Free shipping for orders >= 500k
    if (orderAmount >= FREE_SHIPPING_THRESHOLD) {
        return { shippingFee: 0, isFree: true };
    }
    
    // Try to determine zone from address
    const addressLower = address.toLowerCase();
    
    if (addressLower.includes('hồ chí minh') || 
        addressLower.includes('thủ đức') ||
        addressLower.includes('sài gòn')) {
        return { shippingFee: ZONE_FEES['HCM'], isFree: false };
    }
    
    if (addressLower.includes('hà nội')) {
        return { shippingFee: ZONE_FEES['HN'], isFree: false };
    }
    
    if (addressLower.includes('bình dương') || 
        addressLower.includes('đồng nai') ||
        addressLower.includes('long an') ||
        addressLower.includes('bà rịa')) {
        return { shippingFee: ZONE_FEES['MIEN_NAM'], isFree: false };
    }
    
    if (addressLower.includes('đà nẵng') ||
        addressLower.includes('huế') ||
        addressLower.includes('quảng nam') ||
        addressLower.includes('khánh hòa')) {
        return { shippingFee: ZONE_FEES['MIEN_TRUNG'], isFree: false };
    }
    
    if (addressLower.includes('hải phòng') ||
        addressLower.includes('bắc ninh') ||
        addressLower.includes('hải dương')) {
        return { shippingFee: ZONE_FEES['MIEN_BAC'], isFree: false };
    }
    
    // Default for unknown locations
    return { shippingFee: DEFAULT_SHIPPING_FEE, isFree: false };
};

// Export service object
export const shippingService = {
    getProvinces,
    calculateShippingFee,
    calculateShippingFromAddress,
    previewCheckout,
    calculateShippingOffline,
    extractProvinceFromAddress,
    DEFAULT_SHIPPING_FEE,
    FREE_SHIPPING_THRESHOLD,
};

export default shippingService;
