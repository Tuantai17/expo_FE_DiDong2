/**
 * LocationPickerModal Component
 * ==============================
 * Modal chọn địa chỉ giao hàng trên bản đồ
 * 
 * - Mobile: react-native-maps với OpenStreetMap tiles
 * - Web: Leaflet với OpenStreetMap tiles
 * 
 * Tính năng:
 * - Hiển thị bản đồ với pin cố định ở giữa
 * - Lấy vị trí GPS hiện tại
 * - Reverse Geocoding (tọa độ → địa chỉ)
 * - Thanh tìm kiếm địa chỉ
 */

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    DEFAULT_LOCATION,
    formatVietnameseAddress,
    reverseGeocode,
    searchAddress,
    SearchResult,
} from "../../utils/geocoding";
import AppMap from "./AppMap";

// =================== TYPES =====================

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectAddress: (address: string, coords?: { lat: number; lng: number }) => void;
    initialAddress?: string;
}

interface SelectedLocation {
    latitude: number;
    longitude: number;
    address: string;
}

// =================== CONSTANTS =====================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = Platform.OS === "web" ? 300 : SCREEN_HEIGHT * 0.45;

// =================== COMPONENT =====================

export default function LocationPickerModal({
    visible,
    onClose,
    onSelectAddress,
    initialAddress,
}: LocationPickerModalProps) {
    // =================== STATE =====================

    const [mapCenter, setMapCenter] = useState({
        lat: DEFAULT_LOCATION.latitude,
        lng: DEFAULT_LOCATION.longitude,
    });
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // =================== EFFECTS =====================

    // Lấy vị trí hiện tại khi mở modal
    useEffect(() => {
        if (visible) {
            setLocationError(null);
            setSelectedLocation(null);

            // TỰ ĐỘNG yêu cầu vị trí trên cả web và mobile
            // Web sẽ sử dụng navigator.geolocation
            // Mobile sẽ sử dụng expo-location
            getCurrentLocation();
        }
    }, [visible]);

    // Debounce search
    useEffect(() => {
        if (searchQuery.length >= 3) {
            const timer = setTimeout(async () => {
                const results = await searchAddress(searchQuery);
                setSearchResults(results);
                setShowSearchResults(results.length > 0);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [searchQuery]);

    // =================== HANDLERS =====================

    /**
     * Lấy vị trí GPS hiện tại
     * - Web: Sử dụng navigator.geolocation (Browser API)
     * - Native: Sử dụng expo-location
     */
    const getCurrentLocation = async () => {
        console.log("📍 Getting current location...");
        setIsLoadingLocation(true);
        setLocationError(null);

        // Web: Sử dụng Browser Geolocation API trực tiếp
        if (Platform.OS === "web") {
            if (!navigator.geolocation) {
                console.log("❌ Geolocation not supported");
                setLocationError("Trình duyệt không hỗ trợ định vị.");
                await fallbackToDefaultLocation();
                setIsLoadingLocation(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                // Success callback
                async (position) => {
                    console.log("📍 [Web] Got position:", position.coords);
                    const newCenter = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    setMapCenter(newCenter);
                    await getAddressFromCoords(newCenter.lat, newCenter.lng);
                    setLocationError(null);
                    setIsLoadingLocation(false);
                    console.log("✅ [Web] Location and address updated");
                },
                // Error callback
                async (error) => {
                    console.error("❌ [Web] Geolocation error:", error.message);

                    let errorMessage = "Không thể lấy vị trí.";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Vui lòng cho phép truy cập vị trí trong trình duyệt để sử dụng tính năng này.";
                            // Hiển thị hướng dẫn cho user
                            alert("📍 Để lấy vị trí của bạn:\n\n1. Nhấn vào biểu tượng ổ khóa (🔒) bên cạnh địa chỉ URL\n2. Chọn 'Cài đặt trang web' hoặc 'Permission'\n3. Cho phép 'Vị trí' (Location)\n4. Tải lại trang và thử lại");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Không thể xác định vị trí. Vui lòng thử lại.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Hết thời gian chờ lấy vị trí.";
                            break;
                    }

                    setLocationError(errorMessage);
                    await fallbackToDefaultLocation();
                    setIsLoadingLocation(false);
                },
                // Options
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                }
            );
            return;
        }

        // Native (iOS/Android): Sử dụng expo-location
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            console.log("📍 [Native] Permission status:", status);

            if (status !== "granted") {
                Alert.alert(
                    "Quyền truy cập vị trí",
                    "Vui lòng cấp quyền truy cập vị trí trong cài đặt để sử dụng tính năng này.",
                    [{ text: "OK" }]
                );
                await fallbackToDefaultLocation();
                setIsLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            console.log("📍 [Native] Got location:", location.coords);

            const newCenter = {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            };

            setMapCenter(newCenter);
            await getAddressFromCoords(newCenter.lat, newCenter.lng);
            setLocationError(null);
            console.log("✅ [Native] Location and address updated");
        } catch (error: any) {
            console.error("❌ [Native] Error getting location:", error);
            await fallbackToDefaultLocation();
            Alert.alert(
                "Lỗi vị trí",
                "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS và thử lại.\n\nBạn có thể kéo bản đồ hoặc tìm kiếm địa chỉ thủ công.",
                [{ text: "OK" }]
            );
        } finally {
            setIsLoadingLocation(false);
        }
    };

    /**
     * Fallback về vị trí mặc định
     */
    const fallbackToDefaultLocation = async () => {
        console.log("📍 Falling back to default location");
        setMapCenter({
            lat: DEFAULT_LOCATION.latitude,
            lng: DEFAULT_LOCATION.longitude,
        });
        await getAddressFromCoords(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        setLocationError(null); // Xóa error để hiển thị địa chỉ
    };

    /**
     * Lấy địa chỉ từ tọa độ (Reverse Geocoding)
     */
    const getAddressFromCoords = async (latitude: number, longitude: number) => {
        console.log("🔍 Reverse geocoding:", latitude, longitude);
        setIsLoadingAddress(true);

        try {
            const result = await reverseGeocode(latitude, longitude);

            if (result) {
                const formattedAddress = formatVietnameseAddress(result);
                console.log("📍 Address:", formattedAddress);

                setSelectedLocation({
                    latitude,
                    longitude,
                    address: formattedAddress,
                });
            } else {
                setSelectedLocation({
                    latitude,
                    longitude,
                    address: `Vị trí: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                });
            }
        } catch (error) {
            console.error("❌ Geocoding error:", error);
            setSelectedLocation({
                latitude,
                longitude,
                address: `Vị trí: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            });
        } finally {
            setIsLoadingAddress(false);
        }
    };

    /**
     * Xử lý khi map di chuyển
     */
    const handleMapLocationChange = useCallback((coords: { lat: number; lng: number }) => {
        getAddressFromCoords(coords.lat, coords.lng);
    }, []);

    /**
     * Chọn kết quả tìm kiếm
     */
    const handleSelectSearchResult = (result: SearchResult) => {
        const newCenter = {
            lat: result.lat,
            lng: result.lon,
        };

        setMapCenter(newCenter);
        setSearchQuery("");
        setShowSearchResults(false);
        setSearchResults([]);

        // Set address immediately
        setSelectedLocation({
            latitude: result.lat,
            longitude: result.lon,
            address: result.displayName.split(",").slice(0, 4).join(",").trim(),
        });
    };

    /**
     * Xác nhận địa chỉ
     */
    const handleConfirm = () => {
        if (selectedLocation) {
            onSelectAddress(selectedLocation.address, {
                lat: selectedLocation.latitude,
                lng: selectedLocation.longitude,
            });
        }
        onClose();
    };

    // =================== RENDER =====================

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chọn địa chỉ giao hàng</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <Ionicons name="search-outline" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Tìm kiếm địa chỉ..."
                            placeholderTextColor="#94A3B8"
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery("");
                                    setSearchResults([]);
                                    setShowSearchResults(false);
                                }}
                            >
                                <Ionicons name="close-circle" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                        <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="handled">
                            {searchResults.map((result) => (
                                <TouchableOpacity
                                    key={result.placeId}
                                    style={styles.searchResultItem}
                                    onPress={() => handleSelectSearchResult(result)}
                                >
                                    <Ionicons name="location-outline" size={18} color="#5B9EE1" />
                                    <Text style={styles.searchResultText} numberOfLines={2}>
                                        {result.displayName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Map Container */}
                <View style={styles.mapContainer}>
                    <AppMap
                        center={mapCenter}
                        onLocationChange={handleMapLocationChange}
                        onMapReady={() => setIsMapReady(true)}
                    />

                    {/* Current Location Button */}
                    <TouchableOpacity
                        style={styles.currentLocationButton}
                        onPress={getCurrentLocation}
                        disabled={isLoadingLocation}
                    >
                        {isLoadingLocation ? (
                            <ActivityIndicator size="small" color="#5B9EE1" />
                        ) : (
                            <Ionicons name="locate" size={24} color="#5B9EE1" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Address Card */}
                <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                        <Ionicons name="location" size={20} color="#EF4444" />
                        <Text style={styles.addressLabel}>Địa chỉ đã chọn</Text>
                        {isLoadingAddress && (
                            <ActivityIndicator size="small" color="#5B9EE1" style={{ marginLeft: 8 }} />
                        )}
                    </View>

                    <View style={styles.addressContent}>
                        {isLoadingLocation ? (
                            <View style={styles.loadingAddress}>
                                <ActivityIndicator size="small" color="#5B9EE1" />
                                <Text style={styles.loadingText}>Đang lấy vị trí hiện tại...</Text>
                            </View>
                        ) : isLoadingAddress ? (
                            <View style={styles.loadingAddress}>
                                <ActivityIndicator size="small" color="#5B9EE1" />
                                <Text style={styles.loadingText}>Đang xác định địa chỉ...</Text>
                            </View>
                        ) : locationError ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{locationError}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
                                    <Ionicons name="refresh" size={16} color="#5B9EE1" />
                                    <Text style={styles.retryText}>Thử lại</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.addressText}>
                                {selectedLocation?.address || "Kéo bản đồ hoặc tìm kiếm để chọn vị trí"}
                            </Text>
                        )}
                    </View>

                    {selectedLocation && !isLoadingLocation && !isLoadingAddress && (
                        <Text style={styles.coordsText}>
                            📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                        </Text>
                    )}

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            (!selectedLocation || isLoadingAddress || isLoadingLocation) && styles.confirmButtonDisabled,
                        ]}
                        onPress={handleConfirm}
                        disabled={!selectedLocation || isLoadingAddress || isLoadingLocation}
                    >
                        <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                        <Text style={styles.confirmButtonText}>Xác nhận địa chỉ này</Text>
                    </TouchableOpacity>
                </View>

                {/* Attribution */}
                <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
            </View>
        </Modal>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: Platform.OS === "ios" ? 50 : 40,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        textAlign: "center",
    },
    headerSpacer: { width: 40 },

    // Search
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        zIndex: 10,
    },
    searchInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#0F172A",
        ...Platform.select({
            web: {
                outlineWidth: 0,
            } as any,
        }),
    },
    searchResults: {
        position: "absolute",
        top: 68,
        left: 16,
        right: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        maxHeight: 200,
        zIndex: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            } as any,
        }),
    },
    searchResultItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        gap: 10,
    },
    searchResultText: {
        flex: 1,
        fontSize: 14,
        color: "#0F172A",
        lineHeight: 20,
    },

    // Map
    mapContainer: {
        height: MAP_HEIGHT,
        position: "relative",
        backgroundColor: "#E2E8F0",
    },
    currentLocationButton: {
        position: "absolute",
        right: 16,
        bottom: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            } as any,
        }),
    },

    // Address Card
    addressCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        marginTop: -20,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: -4 },
            },
            android: {
                elevation: 8,
            },
        }),
    },
    addressHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    addressLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F172A",
    },
    addressContent: {
        minHeight: 60,
        justifyContent: "center",
    },
    loadingAddress: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
        color: "#64748B",
    },
    errorContainer: {
        gap: 8,
    },
    errorText: {
        fontSize: 14,
        color: "#EF4444",
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    retryText: {
        fontSize: 14,
        color: "#5B9EE1",
        fontWeight: "600",
    },
    addressText: {
        fontSize: 15,
        color: "#0F172A",
        lineHeight: 22,
    },
    coordsText: {
        fontSize: 11,
        color: "#94A3B8",
        marginTop: 6,
    },

    // Confirm Button
    confirmButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#5B9EE1",
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 16,
        gap: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: "#CBD5E1",
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    // Attribution
    attribution: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 40 : 20,
        alignSelf: "center",
        fontSize: 10,
        color: "#94A3B8",
    },
});
