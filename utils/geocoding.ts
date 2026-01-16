/**
 * Geocoding Utility
 * =================
 * Sử dụng Nominatim API (OpenStreetMap) - MIỄN PHÍ
 * Chuyển đổi tọa độ ↔ địa chỉ
 */

// Nominatim API URL (miễn phí, không cần API key)
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

// User-Agent header (bắt buộc theo policy của Nominatim)
const USER_AGENT = "ShoeShop-App/1.0";

// =================== TYPES =====================

export interface GeocodingResult {
    displayName: string;       // Địa chỉ đầy đủ
    address: {
        houseNumber?: string;    // Số nhà
        road?: string;           // Đường
        suburb?: string;         // Phường
        city?: string;           // Thành phố / Quận
        state?: string;          // Tỉnh / Thành phố
        country?: string;        // Quốc gia
        postcode?: string;       // Mã bưu điện
    };
    lat: number;
    lon: number;
}

export interface SearchResult {
    placeId: number;
    displayName: string;
    lat: number;
    lon: number;
}

// =================== REVERSE GEOCODING =====================

/**
 * Chuyển tọa độ (lat, lng) thành địa chỉ text
 * @param latitude Vĩ độ
 * @param longitude Kinh độ
 * @returns Địa chỉ đầy đủ hoặc null nếu lỗi
 */
export const reverseGeocode = async (
    latitude: number,
    longitude: number
): Promise<GeocodingResult | null> => {
    try {
        // Use zoom=18 for more detail (building level)
        const response = await fetch(
            `${NOMINATIM_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=vi`,
            {
                headers: {
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json",
                },
            }
        );

        if (!response.ok) {
            console.error("Nominatim API error:", response.status);
            return null;
        }

        const data = await response.json();

        if (data.error) {
            console.error("Geocoding error:", data.error);
            return null;
        }

        console.log("[Geocoding] Raw Nominatim response:", data.address);

        // Extract all possible fields from Nominatim
        const addr = data.address || {};
        
        return {
            displayName: data.display_name || "",
            address: {
                // Street number - try multiple fields
                houseNumber: addr.house_number || addr.building || "",
                // Street name - try multiple fields
                road: addr.road || addr.street || addr.pedestrian || addr.path || addr.footway || "",
                // Ward/Neighborhood - Vietnamese: Phường, Xã
                suburb: addr.quarter || addr.neighbourhood || addr.suburb || addr.village || addr.hamlet || "",
                // District - Vietnamese: Quận, Huyện
                city: addr.city_district || addr.town || addr.county || addr.city || "",
                // Province/City - Vietnamese: Tỉnh, Thành phố
                state: addr.state || addr.province || addr.city || "",
                country: addr.country || "Việt Nam",
                postcode: addr.postcode || "",
            },
            lat: parseFloat(data.lat),
            lon: parseFloat(data.lon),
        };
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
};

// =================== FORMAT ADDRESS =====================

/**
 * Format địa chỉ ngắn gọn phù hợp cho Việt Nam
 * Order: Số nhà + Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP
 * Avoids duplicates
 */
export const formatVietnameseAddress = (result: GeocodingResult): string => {
    const addr = result.address;
    const usedParts = new Set<string>();
    const parts: string[] = [];

    const addPart = (part: string | undefined) => {
        if (part && part.trim() && !usedParts.has(part.trim())) {
            usedParts.add(part.trim());
            parts.push(part.trim());
        }
    };

    // 1. Số nhà + Đường (Street address)
    if (addr.houseNumber && addr.road) {
        addPart(`${addr.houseNumber} ${addr.road}`);
    } else if (addr.road) {
        addPart(addr.road);
    } else if (addr.houseNumber) {
        addPart(addr.houseNumber);
    }

    // 2. Phường/Xã (Ward)
    addPart(addr.suburb);

    // 3. Quận/Huyện (District) - skip if same as state
    if (addr.city && addr.city !== addr.state) {
        addPart(addr.city);
    }

    // 4. Tỉnh/Thành phố (Province/City)
    addPart(addr.state);

    // Fallback to display_name if we couldn't parse enough
    const formatted = parts.join(", ");
    if (!formatted || parts.length < 2) {
        // Use first 4 unique parts of display_name
        const displayParts = result.displayName
            .split(",")
            .map(p => p.trim())
            .filter(p => p && !p.includes('Việt Nam') && !usedParts.has(p));
        
        for (const p of displayParts.slice(0, 4)) {
            addPart(p);
        }
        return parts.join(", ");
    }

    return formatted;
};

// =================== FORWARD GEOCODING (Search) =====================

/**
 * Tìm kiếm địa chỉ theo text
 * @param query Chuỗi tìm kiếm
 * @returns Danh sách kết quả
 */
export const searchAddress = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.trim().length < 3) {
        return [];
    }

    try {
        const response = await fetch(
            `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&accept-language=vi`,
            {
                headers: {
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json",
                },
            }
        );

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        return data.map((item: any) => ({
            placeId: item.place_id,
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
        }));
    } catch (error) {
        console.error("Search address error:", error);
        return [];
    }
};

// =================== DEFAULT LOCATION =====================

// Vị trí mặc định: TP. Hồ Chí Minh
export const DEFAULT_LOCATION = {
    latitude: 10.8231,
    longitude: 106.6297,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

// Vị trí mặc định: Hà Nội
export const HANOI_LOCATION = {
    latitude: 21.0285,
    longitude: 105.8542,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};
