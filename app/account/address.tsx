// app/account/address.tsx
// Address Management Screen - Shopee Style
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LocationPickerModal from "../../components/checkout/LocationPickerModal";
import { useAuth } from "../../context/AuthContext";
import { Address, addressService } from "../../services/addressService";

// Address Types
type AddressType = "HOME" | "OFFICE";

interface AddressFormData {
    fullName: string;
    phone: string;
    province: string; // Tỉnh/Thành phố
    district: string; // Quận/Huyện
    ward: string; // Phường/Xã
    streetAddress: string; // Tên đường, Toà nhà, Số nhà
    isDefault: boolean;
    addressType: AddressType;
}

const initialFormData: AddressFormData = {
    fullName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    streetAddress: "",
    isDefault: false,
    addressType: "HOME",
};

export default function AddressScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    
    // States
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState<AddressFormData>(initialFormData);

    // Load addresses
    useEffect(() => {
        if (user?.id) {
            loadAddresses();
        }
    }, [user]);

    const loadAddresses = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const data = await addressService.getUserAddresses(user.id);
            // Sort: default first
            const sorted = data.sort((a, b) => {
                if (a.isDefault && !b.isDefault) return -1;
                if (!a.isDefault && b.isDefault) return 1;
                return 0;
            });
            setAddresses(sorted);
        } catch (error) {
            console.error("Error loading addresses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get current location with enhanced geocoding
    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Lỗi", "Vui lòng cấp quyền truy cập vị trí");
                return;
            }

            // Get current position with high accuracy
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            console.log('[Address] Got position:', {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            });

            // Try Nominatim (OpenStreetMap) for more accurate Vietnamese addresses
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}&zoom=18&addressdetails=1&accept-language=vi`,
                    {
                        headers: {
                            'User-Agent': 'DiDong2_Shoeshop/1.0',
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const addr = data.address;
                    const displayName = data.display_name || '';
                    
                    console.log('[Address] Nominatim raw response:', JSON.stringify(addr, null, 2));

                    // === PARSE VIETNAMESE ADDRESS ===
                    // Vietnamese structure: Số nhà + Đường, Phường/Xã, Quận/Huyện/TP cấp huyện, Tỉnh/TP trực thuộc TW
                    
                    // 1. ĐƯỜNG (Street)
                    const streetNumber = addr.house_number || '';
                    const streetName = addr.road || addr.street || addr.pedestrian || addr.path || '';
                    let fullStreet = [streetNumber, streetName].filter(Boolean).join(' ');
                    
                    // 2. PHƯỜNG/XÃ (Ward)
                    const wardValue = addr.quarter || addr.neighbourhood || addr.suburb || addr.village || '';
                    
                    // 3. QUẬN/HUYỆN hoặc THÀNH PHỐ cấp huyện (District)
                    // - "Thành phố Thủ Đức" là TP cấp huyện thuộc TP.HCM
                    // - "Thuận An" là TP cấp huyện thuộc Bình Dương
                    const districtValue = addr.city_district || addr.town || addr.county || addr.city || '';
                    
                    // 4. TỈNH/THÀNH PHỐ trực thuộc TW (Province)
                    // - Nếu có state -> đó là tỉnh/TP trực thuộc TW
                    // - Nếu không có state nhưng có city là TP lớn -> city là tỉnh
                    let provinceValue = addr.state || '';
                    
                    // Special handling for Vietnamese cities
                    // Thành phố Thủ Đức thuộc TP.HCM nhưng Nominatim có thể không trả về state
                    if (!provinceValue && districtValue) {
                        // Check if district looks like a major city
                        if (districtValue.includes('Thành phố Thủ Đức') || 
                            districtValue.includes('Thủ Đức')) {
                            provinceValue = 'TP. Hồ Chí Minh';
                        }
                    }
                    
                    // If still no street, try first part of display_name
                    if (!fullStreet && displayName) {
                        const parts = displayName.split(',').map((p: string) => p.trim());
                        for (const part of parts) {
                            // Skip ward/district/city/country names
                            if (part && 
                                !part.includes('Phường') && 
                                !part.includes('Xã') &&
                                !part.includes('Thành phố') &&
                                !part.includes('Quận') &&
                                !part.includes('Huyện') &&
                                !part.includes('Tỉnh') &&
                                !part.includes('Việt Nam') &&
                                !part.match(/^\d{5,}$/)) { // Skip postcode
                                fullStreet = part;
                                break;
                            }
                        }
                    }

                    // If still no street but we have display_name, use first useful part
                    if (!fullStreet && displayName) {
                        // Split display_name which is like "Place, Ward, District, City, Country"
                        // First part before ward is usually the most specific
                        const displayParts = displayName.split(',').map((p: string) => p.trim());
                        for (const part of displayParts) {
                            // If we hit ward/district/city, stop
                            if (part === wardValue || part === districtValue || part === provinceValue) {
                                break;
                            }
                            // Skip generic location names
                            if (part && 
                                !part.includes('Phường') && 
                                !part.includes('Xã') &&
                                !part.includes('Thành phố') &&
                                !part.includes('Quận') &&
                                !part.includes('Huyện') &&
                                !part.includes('Tỉnh') &&
                                !part.includes('Việt Nam') &&
                                !part.match(/^\d{5,}$/)) {
                                fullStreet = part;
                                break;
                            }
                        }
                    }

                    console.log('[Address] Parsed values:', {
                        streetAddress: fullStreet,
                        ward: wardValue,
                        district: districtValue,
                        province: provinceValue,
                    });

                    setFormData(prev => ({
                        ...prev,
                        streetAddress: fullStreet,
                        ward: wardValue,
                        district: districtValue,
                        province: provinceValue,
                    }));

                    // If no street found from Nominatim, also try Expo as backup
                    if (!fullStreet) {
                        console.log('[Address] No street from Nominatim, trying Expo...');
                        try {
                            const [expoGeocode] = await Location.reverseGeocodeAsync({
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            });
                            if (expoGeocode && (expoGeocode.street || expoGeocode.streetNumber)) {
                                const expoStreet = [expoGeocode.streetNumber, expoGeocode.street].filter(Boolean).join(' ');
                                console.log('[Address] Expo found street:', expoStreet);
                                if (expoStreet) {
                                    setFormData(prev => ({
                                        ...prev,
                                        streetAddress: expoStreet,
                                    }));
                                }
                            }
                        } catch (expoError) {
                            console.log('[Address] Expo backup failed:', expoError);
                        }
                    }

                    return;
                }
            } catch (nominatimError) {
                console.log('[Address] Nominatim failed, using Expo fallback:', nominatimError);
            }

            // Fallback to Expo Location
            const [geocode] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (geocode) {
                console.log('[Address] Expo geocode:', geocode);
                
                const street = [geocode.streetNumber, geocode.street].filter(Boolean).join(" ");
                const ward = geocode.subregion || geocode.district || "";
                const district = geocode.city || "";
                const province = geocode.region || "";

                setFormData(prev => ({
                    ...prev,
                    streetAddress: street,
                    ward: ward,
                    district: district,
                    province: province,
                }));
            }
        } catch (error) {
            console.error('[Address] Location error:', error);
            Alert.alert("Lỗi", "Không thể lấy vị trí. Vui lòng thử lại.");
        } finally {
            setIsLoadingLocation(false);
        }
    };

    // Handle map selection
    const handleMapSelect = (address: string) => {
        // Parse address from map
        const parts = address.split(",").map(p => p.trim());
        setFormData(prev => ({
            ...prev,
            streetAddress: parts[0] || "",
            ward: parts[1] || "",
            district: parts[2] || "",
            province: parts[3] || "",
        }));
        setShowMapPicker(false);
    };

    // Open add modal
    const openAddModal = () => {
        setEditingAddress(null);
        setFormData({
            ...initialFormData,
            fullName: user?.fullName || user?.name || "",
            phone: user?.phoneNumber || "",
        });
        setShowAddModal(true);
    };

    // Open edit modal
    const openEditModal = (address: Address) => {
        setEditingAddress(address);
        // Parse address into parts
        const addressParts = address.address?.split(",").map(p => p.trim()) || [];
        setFormData({
            fullName: address.fullName,
            phone: address.phone,
            province: address.city || addressParts[3] || "",
            district: addressParts[2] || "",
            ward: addressParts[1] || "",
            streetAddress: addressParts[0] || address.address || "",
            isDefault: address.isDefault,
            addressType: "HOME",
        });
        setShowAddModal(true);
    };

    // Save address
    const handleSaveAddress = async () => {
        // Validation
        if (!formData.fullName.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
            return;
        }
        if (!formData.phone.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
            return;
        }
        if (!formData.streetAddress.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập địa chỉ chi tiết");
            return;
        }

        if (!user?.id) return;

        setIsSaving(true);
        try {
            // Combine address parts
            const fullAddress = [
                formData.streetAddress,
                formData.ward,
                formData.district,
                formData.province,
            ].filter(Boolean).join(", ");

            const requestData = {
                fullName: formData.fullName,
                phone: formData.phone,
                address: fullAddress,
                city: formData.province || formData.district,
                country: "Vietnam",
                isDefault: formData.isDefault,
            };

            if (editingAddress) {
                await addressService.updateAddress(user.id, editingAddress.id, requestData);
            } else {
                await addressService.createAddress(user.id, requestData);
            }

            setShowAddModal(false);
            loadAddresses();
            Alert.alert("Thành công", editingAddress ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ mới");
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể lưu địa chỉ");
        } finally {
            setIsSaving(false);
        }
    };

    // Delete address
    const handleDeleteAddress = (address: Address) => {
        Alert.alert(
            "Xác nhận xóa",
            `Bạn có chắc muốn xóa địa chỉ của ${address.fullName}?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        if (!user?.id) return;
                        try {
                            await addressService.deleteAddress(user.id, address.id);
                            loadAddresses();
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể xóa địa chỉ");
                        }
                    },
                },
            ]
        );
    };

    // Set default address
    const handleSetDefault = async (address: Address) => {
        if (!user?.id || address.isDefault) return;
        try {
            await addressService.setDefaultAddress(user.id, address.id);
            loadAddresses();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể đặt địa chỉ mặc định");
        }
    };

    // Render address item (Shopee style)
    const renderAddressItem = ({ item }: { item: Address }) => (
        <TouchableOpacity 
            style={styles.addressCard}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
        >
            <View style={styles.addressContent}>
                {/* Name & Phone */}
                <View style={styles.addressHeader}>
                    <Text style={styles.addressName}>{item.fullName || 'Chưa có tên'}</Text>
                    <Text style={styles.addressDivider}>|</Text>
                    <Text style={styles.addressPhone}>(+84) {(item.phone || '').replace(/^0/, '')}</Text>
                </View>

                {/* Full Address */}
                <Text style={styles.addressDetail} numberOfLines={2}>
                    {item.address || 'Chưa có địa chỉ'}
                </Text>
                {item.city ? (
                    <Text style={styles.addressCity}>
                        {item.city}{item.country ? `, ${item.country}` : ''}
                    </Text>
                ) : null}

                {/* Badges */}
                <View style={styles.badgeContainer}>
                    {item.isDefault ? (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Mặc định</Text>
                        </View>
                    ) : null}
                </View>
            </View>

            {/* Actions */}
            <View style={styles.addressActions}>
                <TouchableOpacity 
                    style={styles.editBtn}
                    onPress={() => openEditModal(item)}
                >
                    <Text style={styles.editBtnText}>Sửa</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    // Empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={styles.emptySubtitle}>
                Thêm địa chỉ giao hàng để thanh toán nhanh hơn
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Địa chỉ của Tôi</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Section Label */}
            <View style={styles.sectionLabel}>
                <Text style={styles.sectionLabelText}>Địa chỉ</Text>
            </View>

            {/* Address List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#EE4D2D" />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderAddressItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Add Button */}
            <View style={[styles.addButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Ionicons name="add" size={22} color="#EE4D2D" />
                    <Text style={styles.addButtonText}>Thêm Địa Chỉ Mới</Text>
                </TouchableOpacity>
            </View>

            {/* Add/Edit Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Ionicons name="arrow-back" size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {editingAddress ? "Sửa địa chỉ" : "Địa chỉ mới"}
                        </Text>
                        {editingAddress && (
                            <TouchableOpacity onPress={() => handleDeleteAddress(editingAddress)}>
                                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                        {!editingAddress && <View style={{ width: 24 }} />}
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Quick Fill Section */}
                        <View style={styles.quickFillSection}>
                            <View style={styles.quickFillHeader}>
                                <MaterialIcons name="content-paste" size={20} color="#EE4D2D" />
                                <Text style={styles.quickFillTitle}>Dán và nhập nhanh</Text>
                            </View>
                            <Text style={styles.quickFillDesc}>
                                Dán hoặc nhập thông tin, nhấn chọn Tự động điền để nhập tên, số điện thoại và địa chỉ.
                            </Text>
                            <View style={styles.quickFillActions}>
                                <TouchableOpacity 
                                    style={styles.locationBtn}
                                    onPress={getCurrentLocation}
                                    disabled={isLoadingLocation}
                                >
                                    {isLoadingLocation ? (
                                        <ActivityIndicator size="small" color="#EE4D2D" />
                                    ) : (
                                        <Ionicons name="locate" size={18} color="#EE4D2D" />
                                    )}
                                    <Text style={styles.locationBtnText}>Vị trí hiện tại</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.locationBtn}
                                    onPress={() => setShowMapPicker(true)}
                                >
                                    <Ionicons name="map-outline" size={18} color="#EE4D2D" />
                                    <Text style={styles.locationBtnText}>Chọn trên bản đồ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formSection}>
                            <Text style={styles.formSectionTitle}>
                                Địa chỉ (dùng thông tin trước sắp nhập)
                            </Text>

                            {/* Full Name */}
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Họ và tên"
                                    placeholderTextColor="#94A3B8"
                                    value={formData.fullName}
                                    onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                />
                            </View>

                            {/* Phone */}
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Số điện thoại"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="phone-pad"
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                />
                            </View>

                            {/* Province/City */}
                            <TouchableOpacity style={styles.inputGroup}>
                                <View style={styles.selectInput}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Tỉnh/Thành phố, Quận/Huyện, Phường/Xã"
                                        placeholderTextColor="#94A3B8"
                                        value={[formData.province, formData.district, formData.ward].filter(Boolean).join(", ")}
                                        onChangeText={(text) => {
                                            const parts = text.split(",").map(p => p.trim());
                                            setFormData({
                                                ...formData,
                                                province: parts[0] || "",
                                                district: parts[1] || "",
                                                ward: parts[2] || "",
                                            });
                                        }}
                                    />
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </View>
                            </TouchableOpacity>

                            {/* Street Address */}
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tên đường, Toà nhà, Số nhà"
                                    placeholderTextColor="#94A3B8"
                                    value={formData.streetAddress}
                                    onChangeText={(text) => setFormData({ ...formData, streetAddress: text })}
                                />
                            </View>
                        </View>

                        {/* Settings Section */}
                        <View style={styles.settingsSection}>
                            {/* Default Toggle */}
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Đặt làm địa chỉ mặc định</Text>
                                <Switch
                                    value={formData.isDefault}
                                    onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
                                    trackColor={{ false: "#E2E8F0", true: "#FED7D7" }}
                                    thumbColor={formData.isDefault ? "#EE4D2D" : "#FFFFFF"}
                                />
                            </View>

                            {/* Address Type */}
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Loại địa chỉ:</Text>
                                <View style={styles.typeButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeBtn,
                                            formData.addressType === "OFFICE" && styles.typeBtnActive,
                                        ]}
                                        onPress={() => setFormData({ ...formData, addressType: "OFFICE" })}
                                    >
                                        <Text style={[
                                            styles.typeBtnText,
                                            formData.addressType === "OFFICE" && styles.typeBtnTextActive,
                                        ]}>Văn Phòng</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeBtn,
                                            formData.addressType === "HOME" && styles.typeBtnActive,
                                        ]}
                                        onPress={() => setFormData({ ...formData, addressType: "HOME" })}
                                    >
                                        <Text style={[
                                            styles.typeBtnText,
                                            formData.addressType === "HOME" && styles.typeBtnTextActive,
                                        ]}>Nhà Riêng</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Save Button */}
                    <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
                        <TouchableOpacity
                            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                            onPress={handleSaveAddress}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>HOÀN THÀNH</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Map Picker Modal */}
            <LocationPickerModal
                visible={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onSelectAddress={handleMapSelect}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "600",
        color: "#0F172A",
        textAlign: "center",
        marginRight: 28,
    },
    headerSpacer: {
        width: 28,
    },
    sectionLabel: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#F5F5F5",
    },
    sectionLabelText: {
        fontSize: 13,
        color: "#64748B",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        paddingBottom: 100,
    },
    // Address Card - Shopee Style
    addressCard: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    addressContent: {
        flex: 1,
        paddingRight: 12,
    },
    addressHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    addressName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F172A",
    },
    addressDivider: {
        marginHorizontal: 8,
        color: "#CBD5E1",
    },
    addressPhone: {
        fontSize: 14,
        color: "#64748B",
    },
    addressDetail: {
        fontSize: 13,
        color: "#475569",
        lineHeight: 18,
        marginBottom: 2,
    },
    addressCity: {
        fontSize: 13,
        color: "#475569",
        marginBottom: 8,
    },
    badgeContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    defaultBadge: {
        borderWidth: 1,
        borderColor: "#EE4D2D",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    defaultBadgeText: {
        fontSize: 11,
        color: "#EE4D2D",
    },
    addressActions: {
        justifyContent: "flex-start",
    },
    editBtn: {
        paddingVertical: 4,
    },
    editBtnText: {
        fontSize: 14,
        color: "#5B9EE1",
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0F172A",
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 8,
        textAlign: "center",
        paddingHorizontal: 40,
    },
    // Add Button
    addButtonContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#EE4D2D",
        borderRadius: 4,
        paddingVertical: 12,
        gap: 6,
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#EE4D2D",
    },
    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0F172A",
    },
    modalContent: {
        flex: 1,
    },
    // Quick Fill Section
    quickFillSection: {
        backgroundColor: "#FFF5F0",
        padding: 16,
        marginBottom: 8,
    },
    quickFillHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    quickFillTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
    },
    quickFillDesc: {
        fontSize: 13,
        color: "#64748B",
        lineHeight: 18,
        marginBottom: 12,
    },
    quickFillActions: {
        flexDirection: "row",
        gap: 12,
    },
    locationBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    locationBtnText: {
        fontSize: 13,
        color: "#EE4D2D",
        fontWeight: "500",
    },
    // Form Section
    formSection: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        marginBottom: 8,
    },
    formSectionTitle: {
        fontSize: 13,
        color: "#64748B",
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    input: {
        fontSize: 15,
        color: "#0F172A",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    selectInput: {
        flexDirection: "row",
        alignItems: "center",
    },
    // Settings
    settingsSection: {
        backgroundColor: "#FFFFFF",
        padding: 16,
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    settingLabel: {
        fontSize: 15,
        color: "#0F172A",
    },
    typeButtons: {
        flexDirection: "row",
        gap: 8,
    },
    typeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        backgroundColor: "#FFFFFF",
    },
    typeBtnActive: {
        borderColor: "#EE4D2D",
        backgroundColor: "#FFF5F0",
    },
    typeBtnText: {
        fontSize: 13,
        color: "#64748B",
    },
    typeBtnTextActive: {
        color: "#EE4D2D",
    },
    // Save Button
    saveButtonContainer: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },
    saveButton: {
        backgroundColor: "#EE4D2D",
        borderRadius: 4,
        paddingVertical: 14,
        alignItems: "center",
    },
    saveButtonDisabled: {
        backgroundColor: "#CBD5E1",
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
});
