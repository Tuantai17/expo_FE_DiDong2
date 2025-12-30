// app/account/address.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Address {
    id: string;
    name: string;
    detail: string;
    isDefault: boolean;
    latitude?: number;
    longitude?: number;
}

const INITIAL_ADDRESSES: Address[] = [
    {
        id: "1",
        name: "Home",
        detail: "123 Main Street, Dhaka",
        isDefault: true,
        latitude: 23.8103,
        longitude: 90.4125,
    },
    {
        id: "2",
        name: "Office",
        detail: "456 Business Rd, Dhaka",
        isDefault: false,
        latitude: 23.7925,
        longitude: 90.4078,
    },
];

export default function AddressScreen() {
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: "",
        detail: "",
        latitude: 0,
        longitude: 0,
    });

    // Request location permission on mount
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.log("Location permission not granted");
            }
        })();
    }, []);

    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission Denied",
                    "Please enable location permission in settings to use this feature.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Open Settings", onPress: () => Linking.openSettings() },
                    ]
                );
                setIsLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;

            // Reverse geocode to get address
            const [geocode] = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (geocode) {
                const addressParts = [
                    geocode.streetNumber,
                    geocode.street,
                    geocode.district,
                    geocode.city,
                    geocode.region,
                    geocode.country,
                ].filter(Boolean);

                setNewAddress({
                    ...newAddress,
                    detail: addressParts.join(", "),
                    latitude,
                    longitude,
                });
            }
        } catch (error) {
            Alert.alert("Error", "Failed to get your current location. Please try again.");
        }
        setIsLoadingLocation(false);
    };

    const handleAddAddress = () => {
        if (!newAddress.name.trim() || !newAddress.detail.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        const newId = String(Date.now());
        const address: Address = {
            id: newId,
            name: newAddress.name,
            detail: newAddress.detail,
            isDefault: addresses.length === 0,
            latitude: newAddress.latitude || undefined,
            longitude: newAddress.longitude || undefined,
        };

        setAddresses([...addresses, address]);
        setNewAddress({ name: "", detail: "", latitude: 0, longitude: 0 });
        setShowAddModal(false);
    };

    const handleSetDefault = (id: string) => {
        setAddresses(
            addresses.map((addr) => ({
                ...addr,
                isDefault: addr.id === id,
            }))
        );
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Address",
            "Are you sure you want to delete this address?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const filtered = addresses.filter((addr) => addr.id !== id);
                        // If deleted address was default, make first one default
                        if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
                            filtered[0].isDefault = true;
                        }
                        setAddresses(filtered);
                    },
                },
            ]
        );
    };

    const openInMaps = (address: Address) => {
        if (address.latitude && address.longitude) {
            const url = `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
            Linking.openURL(url);
        } else {
            const encodedAddress = encodeURIComponent(address.detail);
            const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            Linking.openURL(url);
        }
    };

    const renderAddressCard = ({ item }: { item: Address }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.nameContainer}>
                    <Ionicons
                        name={item.name.toLowerCase() === "home" ? "home" : "business"}
                        size={20}
                        color="#5B9EE1"
                    />
                    <Text style={styles.name}>{item.name}</Text>
                    {item.isDefault && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <Text style={styles.detail}>{item.detail}</Text>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => openInMaps(item)}
                >
                    <Ionicons name="map-outline" size={16} color="#5B9EE1" />
                    <Text style={styles.mapBtnText}>View on Map</Text>
                </TouchableOpacity>

                {!item.isDefault && (
                    <TouchableOpacity
                        style={styles.setDefaultBtn}
                        onPress={() => handleSetDefault(item.id)}
                    >
                        <Text style={styles.setDefaultText}>Set as Default</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delivery Address</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
                <Ionicons name="location" size={24} color="#5B9EE1" />
                <View style={styles.summaryInfo}>
                    <Text style={styles.summaryTitle}>Saved Addresses</Text>
                    <Text style={styles.summarySubtitle}>
                        {addresses.length} address{addresses.length !== 1 ? "es" : ""} saved
                    </Text>
                </View>
            </View>

            {/* Address List */}
            <FlatList
                data={addresses}
                keyExtractor={(item) => item.id}
                renderItem={renderAddressCard}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="location-outline" size={64} color="#E2E8F0" />
                        <Text style={styles.emptyTitle}>No addresses saved</Text>
                        <Text style={styles.emptySubtitle}>
                            Add your delivery addresses for faster checkout
                        </Text>
                    </View>
                }
            />

            {/* Add Button */}
            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddModal(true)}
            >
                <Ionicons name="add" size={22} color="#FFF" />
                <Text style={styles.addText}>Add New Address</Text>
            </TouchableOpacity>

            {/* Add Address Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Address</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Home, Office, etc."
                                placeholderTextColor="#94A3B8"
                                value={newAddress.name}
                                onChangeText={(text) =>
                                    setNewAddress({ ...newAddress, name: text })
                                }
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter your full address"
                                placeholderTextColor="#94A3B8"
                                value={newAddress.detail}
                                onChangeText={(text) =>
                                    setNewAddress({ ...newAddress, detail: text })
                                }
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Get Current Location Button */}
                        <TouchableOpacity
                            style={styles.locationBtn}
                            onPress={getCurrentLocation}
                            disabled={isLoadingLocation}
                        >
                            {isLoadingLocation ? (
                                <ActivityIndicator size="small" color="#5B9EE1" />
                            ) : (
                                <Ionicons name="locate" size={20} color="#5B9EE1" />
                            )}
                            <Text style={styles.locationBtnText}>
                                {isLoadingLocation
                                    ? "Getting location..."
                                    : "Use Current Location"}
                            </Text>
                        </TouchableOpacity>

                        {newAddress.latitude !== 0 && (
                            <View style={styles.coordsInfo}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.coordsText}>
                                    Location captured successfully
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleAddAddress}
                            >
                                <Text style={styles.saveBtnText}>Save Address</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingTop: 50,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
    },
    summaryCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    summaryInfo: {
        marginLeft: 12,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    summarySubtitle: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 2,
    },
    listContainer: {
        paddingBottom: 100,
    },
    card: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    nameContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    defaultBadge: {
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    defaultText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#16A34A",
    },
    deleteBtn: {
        padding: 8,
    },
    detail: {
        fontSize: 14,
        color: "#64748B",
        lineHeight: 20,
    },
    cardActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    mapBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    mapBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#5B9EE1",
    },
    setDefaultBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#F0F7FF",
    },
    setDefaultText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#5B9EE1",
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 8,
        textAlign: "center",
    },
    addBtn: {
        position: "absolute",
        bottom: 30,
        left: 16,
        right: 16,
        flexDirection: "row",
        backgroundColor: "#5B9EE1",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    addText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#64748B",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#0F172A",
        backgroundColor: "#F8FAFC",
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    locationBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#5B9EE1",
        borderStyle: "dashed",
        marginBottom: 16,
    },
    locationBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#5B9EE1",
    },
    coordsInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
    },
    coordsText: {
        fontSize: 13,
        color: "#10B981",
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        alignItems: "center",
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#64748B",
    },
    saveBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: "#5B9EE1",
        alignItems: "center",
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
