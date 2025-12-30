// app/account/settings.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SettingItem {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    type: "switch" | "link" | "action";
    value?: boolean;
    onPress?: () => void;
}

export default function SettingsScreen() {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [faceId, setFaceId] = useState(false);
    const [locationServices, setLocationServices] = useState(true);

    const handleClearCache = () => {
        Alert.alert(
            "Clear Cache",
            "This will clear all cached data. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear", style: "destructive", onPress: () => {
                        Alert.alert("Success", "Cache cleared successfully");
                    }
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your data will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: () => {
                        // Handle account deletion
                        router.push("/(auth)/login");
                    }
                },
            ]
        );
    };

    const handleOpenPrivacy = () => {
        Linking.openURL("https://your-privacy-policy-url.com");
    };

    const handleOpenTerms = () => {
        Linking.openURL("https://your-terms-of-service-url.com");
    };

    const handleRateApp = () => {
        // Open app store for rating
        Alert.alert("Rate Us", "Thank you for using our app! We appreciate your feedback.");
    };

    const renderSection = (title: string, items: SettingItem[]) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionCard}>
                {items.map((item, index) => (
                    <View key={item.id}>
                        {item.type === "switch" ? (
                            <View style={styles.settingRow}>
                                <View style={styles.settingIcon}>
                                    <Ionicons name={item.icon} size={20} color="#5B9EE1" />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>{item.title}</Text>
                                    {item.subtitle && (
                                        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                                    )}
                                </View>
                                <Switch
                                    value={item.value}
                                    onValueChange={item.onPress as any}
                                    trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                                    thumbColor={item.value ? "#5B9EE1" : "#94A3B8"}
                                />
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.settingRow}
                                onPress={item.onPress}
                            >
                                <View style={[
                                    styles.settingIcon,
                                    item.id === "delete" && styles.dangerIcon
                                ]}>
                                    <Ionicons
                                        name={item.icon}
                                        size={20}
                                        color={item.id === "delete" ? "#EF4444" : "#5B9EE1"}
                                    />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={[
                                        styles.settingTitle,
                                        item.id === "delete" && styles.dangerText
                                    ]}>
                                        {item.title}
                                    </Text>
                                    {item.subtitle && (
                                        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        )}
                        {index < items.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}
            </View>
        </View>
    );

    const preferenceSettings: SettingItem[] = [
        {
            id: "dark",
            icon: "moon-outline",
            title: "Dark Mode",
            subtitle: "Enable dark theme",
            type: "switch",
            value: darkMode,
            onPress: () => setDarkMode(!darkMode),
        },
        {
            id: "notifications",
            icon: "notifications-outline",
            title: "Push Notifications",
            subtitle: "Receive push notifications",
            type: "switch",
            value: notifications,
            onPress: () => setNotifications(!notifications),
        },
        {
            id: "email",
            icon: "mail-outline",
            title: "Email Notifications",
            subtitle: "Receive promotional emails",
            type: "switch",
            value: emailNotifications,
            onPress: () => setEmailNotifications(!emailNotifications),
        },
    ];

    const securitySettings: SettingItem[] = [
        {
            id: "faceid",
            icon: "finger-print-outline",
            title: "Face ID / Touch ID",
            subtitle: "Use biometric authentication",
            type: "switch",
            value: faceId,
            onPress: () => setFaceId(!faceId),
        },
        {
            id: "location",
            icon: "location-outline",
            title: "Location Services",
            subtitle: "Allow app to access location",
            type: "switch",
            value: locationServices,
            onPress: () => setLocationServices(!locationServices),
        },
        {
            id: "password",
            icon: "lock-closed-outline",
            title: "Change Password",
            type: "link",
            onPress: () => Alert.alert("Change Password", "Password change feature coming soon"),
        },
    ];

    const supportSettings: SettingItem[] = [
        {
            id: "rate",
            icon: "star-outline",
            title: "Rate App",
            subtitle: "Help us improve",
            type: "link",
            onPress: handleRateApp,
        },
        {
            id: "privacy",
            icon: "shield-outline",
            title: "Privacy Policy",
            type: "link",
            onPress: handleOpenPrivacy,
        },
        {
            id: "terms",
            icon: "document-text-outline",
            title: "Terms of Service",
            type: "link",
            onPress: handleOpenTerms,
        },
    ];

    const dangerSettings: SettingItem[] = [
        {
            id: "cache",
            icon: "trash-outline",
            title: "Clear Cache",
            subtitle: "Free up storage space",
            type: "action",
            onPress: handleClearCache,
        },
        {
            id: "delete",
            icon: "warning-outline",
            title: "Delete Account",
            subtitle: "Permanently delete your account",
            type: "action",
            onPress: handleDeleteAccount,
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {renderSection("Preferences", preferenceSettings)}
                {renderSection("Security", securitySettings)}
                {renderSection("Support", supportSettings)}
                {renderSection("Danger Zone", dangerSettings)}

                {/* App Version */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                    <Text style={styles.buildText}>Build 2025.12.10</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingTop: 50,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
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
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748B",
        marginBottom: 12,
        marginLeft: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    sectionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#F0F7FF",
        alignItems: "center",
        justifyContent: "center",
    },
    dangerIcon: {
        backgroundColor: "#FEE2E2",
    },
    settingInfo: {
        flex: 1,
        marginLeft: 14,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F172A",
    },
    dangerText: {
        color: "#EF4444",
    },
    settingSubtitle: {
        fontSize: 13,
        color: "#94A3B8",
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginLeft: 70,
    },
    versionContainer: {
        alignItems: "center",
        paddingVertical: 24,
    },
    versionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#94A3B8",
    },
    buildText: {
        fontSize: 12,
        color: "#CBD5E1",
        marginTop: 4,
    },
});
