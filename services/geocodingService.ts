// services/geocodingService.ts
// Enhanced Geocoding Service using Nominatim (OpenStreetMap) API
// More accurate than Expo Location for Vietnamese addresses

import * as Location from 'expo-location';

export interface GeocodedAddress {
    streetNumber: string;
    streetName: string;
    ward: string;        // Phường/Xã
    district: string;    // Quận/Huyện
    city: string;        // Thành phố
    province: string;    // Tỉnh
    country: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
}

interface NominatimResponse {
    address: {
        house_number?: string;
        road?: string;
        street?: string;
        neighbourhood?: string;
        suburb?: string;
        quarter?: string;
        village?: string;
        town?: string;
        city?: string;
        county?: string;
        state?: string;
        country?: string;
        postcode?: string;
    };
    display_name: string;
    lat: string;
    lon: string;
}

/**
 * Reverse geocode using Nominatim (OpenStreetMap)
 * More accurate for Vietnamese addresses
 */
export async function reverseGeocodeNominatim(
    latitude: number,
    longitude: number
): Promise<GeocodedAddress | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=vi`,
            {
                headers: {
                    'User-Agent': 'DiDong2_Shoeshop/1.0',
                },
            }
        );

        if (!response.ok) {
            console.error('Nominatim API error:', response.status);
            return null;
        }

        const data: NominatimResponse = await response.json();
        const addr = data.address;

        // Parse Vietnamese address components
        const streetNumber = addr.house_number || '';
        const streetName = addr.road || addr.street || '';
        
        // Ward: có thể là quarter, neighbourhood, suburb, village
        const ward = addr.quarter || addr.neighbourhood || addr.suburb || addr.village || '';
        
        // District: có thể là town, city (trong context quận), county
        const district = addr.town || addr.county || '';
        
        // City: thành phố trực thuộc hoặc thành phố cấp tỉnh
        const city = addr.city || addr.state || '';
        
        // Province/State
        const province = addr.state || addr.city || '';

        return {
            streetNumber,
            streetName,
            ward,
            district,
            city,
            province,
            country: addr.country || 'Việt Nam',
            fullAddress: data.display_name,
            latitude,
            longitude,
        };
    } catch (error) {
        console.error('Nominatim reverse geocoding error:', error);
        return null;
    }
}

/**
 * Get current location with enhanced geocoding
 * Tries Nominatim first, falls back to Expo Location
 */
export async function getCurrentLocationWithAddress(): Promise<GeocodedAddress | null> {
    try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Location permission denied');
        }

        // Get current position with high accuracy
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        console.log('[Geocoding] Got position:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
        });

        // Try Nominatim first (more accurate for VN)
        const nominatimResult = await reverseGeocodeNominatim(
            location.coords.latitude,
            location.coords.longitude
        );

        if (nominatimResult) {
            console.log('[Geocoding] Nominatim result:', nominatimResult);
            return nominatimResult;
        }

        // Fallback to Expo Location
        console.log('[Geocoding] Falling back to Expo Location');
        const [expoGeocode] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });

        if (expoGeocode) {
            return {
                streetNumber: expoGeocode.streetNumber || '',
                streetName: expoGeocode.street || '',
                ward: expoGeocode.subregion || expoGeocode.district || '',
                district: expoGeocode.city || '',
                city: expoGeocode.city || expoGeocode.region || '',
                province: expoGeocode.region || '',
                country: expoGeocode.country || 'Việt Nam',
                fullAddress: [
                    expoGeocode.streetNumber,
                    expoGeocode.street,
                    expoGeocode.subregion,
                    expoGeocode.city,
                    expoGeocode.region,
                ].filter(Boolean).join(', '),
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
        }

        return null;
    } catch (error) {
        console.error('[Geocoding] Error:', error);
        throw error;
    }
}

/**
 * Parse a full address string into components
 * Useful for Vietnamese addresses
 */
export function parseVietnameseAddress(fullAddress: string): Partial<GeocodedAddress> {
    // Split by comma and clean up
    const parts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);
    
    if (parts.length === 0) return {};

    // Vietnamese address typically goes from specific to general:
    // Số nhà + Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố
    
    const result: Partial<GeocodedAddress> = {};

    if (parts.length >= 1) {
        // First part usually contains street number and name
        const firstPart = parts[0];
        const streetMatch = firstPart.match(/^(\d+[A-Za-z]?\/?\d*)\s*(.*)$/);
        if (streetMatch) {
            result.streetNumber = streetMatch[1];
            result.streetName = streetMatch[2];
        } else {
            result.streetName = firstPart;
        }
    }

    if (parts.length >= 2) {
        result.ward = parts[1];
    }

    if (parts.length >= 3) {
        result.district = parts[2];
    }

    if (parts.length >= 4) {
        // Last part is usually province/city
        result.province = parts[parts.length - 1];
        // City might be the same or one before
        result.city = parts.length >= 5 ? parts[parts.length - 2] : parts[parts.length - 1];
    }

    return result;
}

/**
 * Format address components into a full address string
 */
export function formatFullAddress(components: Partial<GeocodedAddress>): string {
    const parts = [
        components.streetNumber && components.streetName 
            ? `${components.streetNumber} ${components.streetName}` 
            : components.streetName || components.streetNumber,
        components.ward,
        components.district,
        components.city !== components.province ? components.city : null,
        components.province,
    ].filter(Boolean);

    return parts.join(', ');
}
