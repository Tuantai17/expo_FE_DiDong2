/**
 * Mini Game Service
 * =================
 * Handles all API calls for the voucher spin wheel mini game
 */

import { api } from "./api";

// =================== TYPES =====================

export type SegmentType = "VOUCHER" | "LOSE";
export type SpinType = "FREE" | "EXTRA";

export interface Segment {
    id: number;
    segmentIndex: number;
    segmentType: SegmentType;
    label: string;
    color: string;
    icon?: string;
    weight: number;
    quantityTotal?: number;
    quantityUsed?: number;
    quantityRemaining?: number;
    isAvailable: boolean;
    voucherId?: number;
    voucherCode?: string;
    voucherDiscount?: number;
    voucherDiscountType?: string;
}

export interface Wheel {
    id: number;
    name: string;
    description?: string;
    dailyFreeSpins: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    backgroundImage?: string;
    themeColor?: string;
    segments: Segment[];
}

export interface SpinStatus {
    wheelId: number;
    wheelName: string;
    dailyFreeSpins: number;
    freeSpinsUsed: number;
    freeSpinsRemaining: number;
    extraSpins: number;
    extraSpinsUsed: number;
    extraSpinsRemaining: number;
    totalSpinsRemaining: number;
    canSpin: boolean;
    canCheckin: boolean;
    hasCheckedInToday: boolean;
}

export interface SpinResult {
    success: boolean;
    message: string;
    segmentIndex: number;
    segmentType: SegmentType;
    segmentLabel: string;
    segmentColor: string;
    segmentIcon?: string;
    spinTypeUsed: SpinType;
    isWin: boolean;
    voucherId?: number;
    voucherCode?: string;
    voucherDiscount?: number;
    voucherDiscountType?: string;
    voucherDescription?: string;
    totalSpinsRemaining: number;
    freeSpinsRemaining: number;
    extraSpinsRemaining: number;
}

export interface CheckinResult {
    success: boolean;
    message: string;
    bonusSpins: number;
    totalSpinsRemaining: number;
    canCheckinTomorrow?: boolean;
}

// =================== API CALLS =====================

/**
 * Get all active wheels
 * GET /api/minigame/wheels/active
 */
export const getActiveWheels = async (): Promise<Wheel[]> => {
    const response = await api.get<Wheel[]>("/api/minigame/wheels/active");
    return response.data;
};

/**
 * Get first active wheel (convenience method)
 */
export const getFirstActiveWheel = async (): Promise<Wheel | null> => {
    const wheels = await getActiveWheels();
    return wheels.length > 0 ? wheels[0] : null;
};

/**
 * Get wheel by ID
 * GET /api/minigame/wheels/{wheelId}
 */
export const getWheelById = async (wheelId: number): Promise<Wheel> => {
    const response = await api.get<Wheel>(`/api/minigame/wheels/${wheelId}`);
    return response.data;
};

/**
 * Get spin status for current user
 * GET /api/minigame/wheels/{wheelId}/status
 */
export const getSpinStatus = async (wheelId: number): Promise<SpinStatus> => {
    const response = await api.get<SpinStatus>(
        `/api/minigame/wheels/${wheelId}/status`
    );
    return response.data;
};

/**
 * Daily check-in to get bonus spins
 * POST /api/minigame/wheels/{wheelId}/checkin
 */
export const checkin = async (wheelId: number): Promise<CheckinResult> => {
    const response = await api.post<CheckinResult>(
        `/api/minigame/wheels/${wheelId}/checkin`
    );
    return response.data;
};

/**
 * Spin the wheel
 * POST /api/minigame/wheels/{wheelId}/spin
 */
export const spin = async (wheelId: number): Promise<SpinResult> => {
    const response = await api.post<SpinResult>(
        `/api/minigame/wheels/${wheelId}/spin`
    );
    return response.data;
};

// =================== HELPER FUNCTIONS =====================

/**
 * Calculate angle for segment index (6 segments)
 * Each segment = 360/6 = 60 degrees
 */
export const calculateSegmentAngle = (segmentIndex: number): number => {
    const degreesPerSegment = 360 / 6;
    // Start from top (12 o'clock position)
    return segmentIndex * degreesPerSegment;
};

/**
 * Format voucher discount for display
 */
export const formatVoucherDiscount = (
    discount: number,
    discountType?: string
): string => {
    if (discountType === "PERCENTAGE") {
        return `${discount}%`;
    } else {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(discount);
    }
};
