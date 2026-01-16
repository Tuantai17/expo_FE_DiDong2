/**
 * Banner Service - API calls for Banner/Promotion
 * ================================================
 * Handles all banner-related API calls
 */

import { api, BASE_URL } from "./api";

// =================== TYPES =====================

export interface Banner {
    id: number;
    title?: string; // Optional - ảnh banner có thể đã có sẵn tiêu đề
    subtitle?: string;
    imageUrl: string;
    position: "HOME" | "PRODUCTS" | "CATEGORY" | "CHECKOUT";
    actionType: "NONE" | "INTERNAL" | "PRODUCTS" | "CATEGORY" | "VOUCHERS" | "PRODUCT_DETAIL" | "EXTERNAL";
    actionValue?: string;
    active: boolean;
    sortOrder: number;
    startAt?: string;
    endAt?: string;
}

// =================== API FUNCTIONS =====================

/**
 * Lấy danh sách banners active theo position
 * GET /api/banners?position=HOME
 */
export const fetchHomeBanners = async (): Promise<Banner[]> => {
    try {
        const response = await api.get<Banner[]>("/api/banners", {
            params: { position: "HOME" },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching home banners:", error);
        return [];
    }
};

/**
 * Lấy banners theo position bất kỳ
 * GET /api/banners?position={position}
 */
export const fetchBannersByPosition = async (position: string): Promise<Banner[]> => {
    try {
        const response = await api.get<Banner[]>("/api/banners", {
            params: { position: position.toUpperCase() },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${position} banners:`, error);
        return [];
    }
};

/**
 * Helper để lấy URL ảnh đầy đủ
 * Nếu imageUrl đã là URL đầy đủ thì giữ nguyên
 * Nếu là path relative thì thêm BASE_URL
 */
export const getBannerImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }
    // Relative path -> add base URL
    return `${BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};
