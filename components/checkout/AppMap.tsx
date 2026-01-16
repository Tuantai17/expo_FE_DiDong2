/**
 * AppMap Component (Platform Selector)
 * =====================================
 * File này tự động chọn platform-specific implementation
 * 
 * - Web: Sử dụng Leaflet + OpenStreetMap
 * - Native: Sử dụng react-native-maps
 */

import { Platform } from "react-native";

export interface AppMapProps {
    center: { lat: number; lng: number };
    onLocationChange: (coords: { lat: number; lng: number }) => void;
    onMapReady?: () => void;
    style?: any;
}

// Platform-specific imports
let AppMapComponent: React.ComponentType<AppMapProps>;

if (Platform.OS === "web") {
    // Web: dynamic import không hoạt động tốt, import trực tiếp
    AppMapComponent = require("./AppMap.web").default;
} else {
    // Native: iOS/Android
    AppMapComponent = require("./AppMap.native").default;
}

export default AppMapComponent;
