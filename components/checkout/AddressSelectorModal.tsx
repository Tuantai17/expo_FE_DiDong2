// components/checkout/AddressSelectorModal.tsx
// Address Selector for Checkout - Shopee Style
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, addressService } from "../../services/addressService";

interface AddressSelectorModalProps {
    visible: boolean;
    onClose: () => void;
    addresses: Address[];
    onSelect: (address: Address) => void;
    selectedAddressId?: number | null;
    userId?: number;
    onAddressCreated?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AddressSelectorModal({
    visible,
    onClose,
    addresses,
    onSelect,
    selectedAddressId,
    userId,
    onAddressCreated,
}: AddressSelectorModalProps) {
    const insets = useSafeAreaInsets();
    const [showAddForm, setShowAddForm] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        isDefault: false,
    });

    // Sort addresses: default first
    const sortedAddresses = [...addresses].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
    });

    // Get current location with enhanced geocoding
    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Lỗi", "Vui lòng cấp quyền truy cập vị trí");
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            console.log('[AddressSelector] Got position:', {
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
                    
                    console.log('[AddressSelector] Nominatim raw:', JSON.stringify(addr, null, 2));

                    // === PARSE VIETNAMESE ADDRESS ===
                    // 1. ĐƯỜNG (Street)
                    const streetNumber = addr.house_number || '';
                    const streetName = addr.road || addr.street || addr.pedestrian || addr.path || '';
                    let fullStreet = [streetNumber, streetName].filter(Boolean).join(' ');
                    
                    // 2. PHƯỜNG/XÃ (Ward)
                    const ward = addr.quarter || addr.neighbourhood || addr.suburb || addr.village || '';
                    
                    // 3. QUẬN/HUYỆN/TP cấp huyện (District)
                    const district = addr.city_district || addr.town || addr.county || addr.city || '';
                    
                    // 4. TỈNH/TP trực thuộc TW (Province)
                    let province = addr.state || '';
                    
                    // Special: Thành phố Thủ Đức thuộc TP.HCM
                    if (!province && district && (district.includes('Thủ Đức') || district.includes('Thu Duc'))) {
                        province = 'TP. Hồ Chí Minh';
                    }
                    
                    // If no street, extract from display_name
                    if (!fullStreet && displayName) {
                        const parts = displayName.split(',').map((p: string) => p.trim());
                        for (const part of parts) {
                            if (part && 
                                !part.includes('Phường') && 
                                !part.includes('Xã') &&
                                !part.includes('Thành phố') &&
                                !part.includes('Quận') &&
                                !part.includes('Huyện') &&
                                !part.includes('Việt Nam') &&
                                !part.match(/^\d{5,}$/)) {
                                fullStreet = part;
                                break;
                            }
                        }
                    }

                    // Build final address - avoid duplicates
                    const addressParts: string[] = [];
                    const usedParts = new Set<string>();
                    
                    const addPart = (p: string) => {
                        if (p && p.trim() && !usedParts.has(p.trim())) {
                            usedParts.add(p.trim());
                            addressParts.push(p.trim());
                        }
                    };
                    
                    addPart(fullStreet);
                    addPart(ward);
                    addPart(district);
                    addPart(province);

                    const finalAddress = addressParts.join(', ');
                    
                    console.log('[AddressSelector] Final address:', finalAddress);

                    setFormData(prev => ({
                        ...prev,
                        address: finalAddress,
                        city: province || district || '',
                    }));

                    return;
                }
            } catch (nominatimError) {
                console.log('[AddressSelector] Nominatim failed, using Expo fallback:', nominatimError);
            }

            // Fallback to Expo Location
            const [geocode] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (geocode) {
                console.log('[AddressSelector] Expo geocode:', geocode);
                
                const parts = [
                    geocode.streetNumber,
                    geocode.street,
                    geocode.subregion || geocode.district,
                    geocode.city,
                    geocode.region,
                ].filter(Boolean);

                setFormData(prev => ({
                    ...prev,
                    address: parts.join(", "),
                    city: geocode.region || geocode.city || "",
                }));
            }
        } catch (error) {
            console.error('[AddressSelector] Location error:', error);
            Alert.alert("Lỗi", "Không thể lấy vị trí");
        } finally {
            setIsLoadingLocation(false);
        }
    };

    // Save new address
    const handleSaveAddress = async () => {
        if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
            return;
        }
        if (!userId) return;

        setIsSaving(true);
        try {
            const newAddress = await addressService.createAddress(userId, {
                fullName: formData.fullName,
                phone: formData.phone,
                address: formData.address,
                city: formData.city || "Việt Nam",
                country: "Vietnam",
                isDefault: formData.isDefault,
            });

            setShowAddForm(false);
            setFormData({ fullName: "", phone: "", address: "", city: "", isDefault: false });
            onAddressCreated?.();
            
            // Auto select the new address
            onSelect(newAddress);
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể tạo địa chỉ");
        } finally {
            setIsSaving(false);
        }
    };

    // Render address item
    const renderAddressItem = ({ item }: { item: Address }) => {
        const isSelected = selectedAddressId === item.id;
        
        return (
            <TouchableOpacity
                style={[styles.addressItem, isSelected && styles.addressItemSelected]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
            >
                {/* Location Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons 
                        name="location" 
                        size={20} 
                        color={isSelected ? "#EE4D2D" : "#94A3B8"} 
                    />
                </View>

                {/* Address Info */}
                <View style={styles.addressInfo}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.addressName, isSelected && styles.addressNameSelected]}>
                            {item.fullName}
                        </Text>
                        <Text style={styles.phoneDivider}>|</Text>
                        <Text style={styles.addressPhone}>(+84) {item.phone?.replace(/^0/, "")}</Text>
                    </View>
                    
                    <Text style={styles.addressDetail} numberOfLines={2}>
                        {item.address}
                    </Text>
                    
                    {item.city && (
                        <Text style={styles.addressCity}>
                            {item.city}, {item.country || "Vietnam"}
                        </Text>
                    )}

                    {/* Badges */}
                    {item.isDefault && (
                        <View style={styles.badgeRow}>
                            <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>Mặc định</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Check Icon */}
                {isSelected && (
                    <Ionicons name="checkmark" size={22} color="#EE4D2D" />
                )}
            </TouchableOpacity>
        );
    };

    // Add Form Content
    const renderAddForm = () => (
        <View style={styles.addFormContainer}>
            {/* Header */}
            <View style={styles.addFormHeader}>
                <TouchableOpacity onPress={() => setShowAddForm(false)}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.addFormTitle}>Thêm địa chỉ mới</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.addFormContent}>
                {/* Quick Location */}
                <TouchableOpacity 
                    style={styles.quickLocationBtn}
                    onPress={getCurrentLocation}
                    disabled={isLoadingLocation}
                >
                    {isLoadingLocation ? (
                        <ActivityIndicator size="small" color="#EE4D2D" />
                    ) : (
                        <Ionicons name="locate" size={18} color="#EE4D2D" />
                    )}
                    <Text style={styles.quickLocationText}>Sử dụng vị trí hiện tại</Text>
                </TouchableOpacity>

                {/* Form Fields */}
                <View style={styles.formFields}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Họ và tên *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập họ và tên người nhận"
                            placeholderTextColor="#94A3B8"
                            value={formData.fullName}
                            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Số điện thoại *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập số điện thoại"
                            placeholderTextColor="#94A3B8"
                            keyboardType="phone-pad"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Địa chỉ chi tiết *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={3}
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Thành phố</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tỉnh/Thành phố"
                            placeholderTextColor="#94A3B8"
                            value={formData.city}
                            onChangeText={(text) => setFormData({ ...formData, city: text })}
                        />
                    </View>

                    {/* Default Toggle */}
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Đặt làm địa chỉ mặc định</Text>
                        <Switch
                            value={formData.isDefault}
                            onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
                            trackColor={{ false: "#E2E8F0", true: "#FED7D7" }}
                            thumbColor={formData.isDefault ? "#EE4D2D" : "#FFFFFF"}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSaveAddress}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Lưu địa chỉ</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { maxHeight: SCREEN_HEIGHT * 0.85 }]}>
                    {showAddForm ? (
                        renderAddForm()
                    ) : (
                        <>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Chọn địa chỉ nhận hàng</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            {/* Address List */}
                            <FlatList
                                data={sortedAddresses}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderAddressItem}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Ionicons name="location-outline" size={48} color="#CBD5E1" />
                                        <Text style={styles.emptyText}>Chưa có địa chỉ nào</Text>
                                    </View>
                                }
                            />

                            {/* Add Address Button */}
                            <View style={[styles.addButtonContainer, { paddingBottom: insets.bottom + 12 }]}>
                                <TouchableOpacity 
                                    style={styles.addButton}
                                    onPress={() => setShowAddForm(true)}
                                >
                                    <Ionicons name="add" size={20} color="#EE4D2D" />
                                    <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    container: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    title: {
        fontSize: 17,
        fontWeight: "600",
        color: "#0F172A",
    },
    closeBtn: {
        padding: 4,
    },
    listContent: {
        paddingBottom: 12,
    },
    // Address Item
    addressItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F8FAFC",
    },
    addressItemSelected: {
        backgroundColor: "#FFF5F0",
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    addressInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    addressName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F172A",
    },
    addressNameSelected: {
        color: "#EE4D2D",
    },
    phoneDivider: {
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
    },
    addressCity: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: "row",
        marginTop: 8,
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
    // Empty State
    emptyState: {
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 12,
    },
    // Add Button
    addButtonContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
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
    // Add Form
    addFormContainer: {
        height: SCREEN_HEIGHT * 0.85,
    },
    addFormHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    addFormTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#0F172A",
    },
    addFormContent: {
        flex: 1,
    },
    quickLocationBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        backgroundColor: "#FFF5F0",
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FECDC5",
        borderStyle: "dashed",
    },
    quickLocationText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#EE4D2D",
    },
    formFields: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748B",
        marginBottom: 8,
    },
    input: {
        fontSize: 15,
        color: "#0F172A",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        marginTop: 8,
    },
    toggleLabel: {
        fontSize: 15,
        color: "#0F172A",
    },
    saveButtonContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    saveButton: {
        backgroundColor: "#EE4D2D",
        borderRadius: 8,
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
    },
});
