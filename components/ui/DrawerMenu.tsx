// components/ui/DrawerMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useCart } from "../../context/CartContext";

const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.78;

type DrawerMenuProps = {
    visible: boolean;
    onClose: () => void;
};

type MenuItem = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route?: string;
    badge?: number;
    onPress?: () => void;
};

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
    const router = useRouter();
    const { items } = useCart();
    const cartItemCount = items.reduce((sum, item) => sum + item.qty, 0);

    const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideX, {
                    toValue: 0,
                    tension: 65,
                    friction: 11,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideX, {
                    toValue: -DRAWER_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, slideX, backdropOpacity]);

    const handleNavigate = (path: string, replace = false) => {
        onClose();
        setTimeout(() => {
            if (replace) {
                router.replace(path as any);
            } else {
                router.push(path as any);
            }
        }, 200);
    };

    const mainMenuItems: MenuItem[] = [
        {
            icon: "home-outline",
            label: "Home",
            route: "/(main)",
        },
        {
            icon: "grid-outline",
            label: "All Products",
            route: "/(main)",
        },
        {
            icon: "bag-handle-outline",
            label: "My Cart",
            route: "/(main)/cart",
            badge: cartItemCount,
        },
        {
            icon: "heart-outline",
            label: "Wishlist",
            route: "/(main)/favorite",
        },
    ];

    const accountMenuItems: MenuItem[] = [
        {
            icon: "person-outline",
            label: "My Profile",
            route: "/(main)/profile",
        },
        {
            icon: "receipt-outline",
            label: "My Orders",
            route: "/account/my-orders",
        },
        {
            icon: "location-outline",
            label: "Delivery Address",
            route: "/account/address",
        },
        {
            icon: "card-outline",
            label: "Payment Methods",
            onPress: () => console.log("Payment Methods"),
        },
    ];

    const settingsMenuItems: MenuItem[] = [
        {
            icon: "settings-outline",
            label: "Settings",
            route: "/account/settings",
        },
        {
            icon: "notifications-outline",
            label: "Notifications",
            onPress: () => console.log("Notifications"),
        },
        {
            icon: "help-circle-outline",
            label: "Help & Support",
            onPress: () => console.log("Help & Support"),
        },
    ];

    const handleLogout = () => {
        handleNavigate("/(auth)/login", true);
    };

    const renderMenuItem = (item: MenuItem, index: number) => (
        <TouchableOpacity
            key={`${item.label}-${index}`}
            style={styles.menuItem}
            onPress={() => {
                if (item.route) {
                    handleNavigate(item.route);
                } else if (item.onPress) {
                    onClose();
                    item.onPress();
                }
            }}
            activeOpacity={0.7}
        >
            <View style={styles.menuIconWrapper}>
                <Ionicons name={item.icon} size={20} color="#5B9EE1" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.badge && item.badge > 0 ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {item.badge > 99 ? "99+" : item.badge}
                    </Text>
                </View>
            ) : (
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            )}
        </TouchableOpacity>
    );

    const renderSection = (title: string, items: MenuItem[]) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {items.map(renderMenuItem)}
        </View>
    );

    return (
        <View
            style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }]}
        >
            {/* Backdrop */}
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                <Animated.View
                    style={[
                        styles.backdrop,
                        { opacity: backdropOpacity },
                    ]}
                />
            </Pressable>

            {/* Drawer Panel */}
            <Animated.View
                style={[
                    styles.drawer,
                    { transform: [{ translateX: slideX }] },
                ]}
            >
                {/* Header with User Info */}
                <View style={styles.drawerHeader}>
                    <View style={styles.userSection}>
                        <Image
                            source={require("../../assets/images/home/user.png")}
                            style={styles.avatar}
                        />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>Alison Becker</Text>
                            <Text style={styles.userEmail}>alisonbecker@gmail.com</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={22} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Edit Profile Button */}
                <TouchableOpacity
                    style={styles.editProfileBtn}
                    onPress={() => handleNavigate("/account/edit-profile")}
                    activeOpacity={0.8}
                >
                    <Ionicons name="create-outline" size={16} color="#5B9EE1" />
                    <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>

                {/* Menu Sections */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.menuContent}
                >
                    {renderSection("Menu", mainMenuItems)}
                    {renderSection("Account", accountMenuItems)}
                    {renderSection("Other", settingsMenuItems)}
                </ScrollView>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.versionText}>Version 1.0.0</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
    },
    drawer: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: "#FFFFFF",
        paddingTop: 50,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 8, height: 0 },
        elevation: 10,
    },
    drawerHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    userSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#E8ECEF",
    },
    userInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
    },
    userEmail: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    editProfileBtn: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginLeft: 20,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#EBF4FF",
        gap: 6,
    },
    editProfileText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#5B9EE1",
    },
    menuContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    menuIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#F0F7FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        color: "#0F172A",
        fontWeight: "500",
    },
    badge: {
        backgroundColor: "#EF4444",
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginBottom: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "#EF4444",
        gap: 8,
        shadowColor: "#EF4444",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    versionText: {
        textAlign: "center",
        fontSize: 12,
        color: "#CBD5E1",
        paddingVertical: 12,
        paddingBottom: 30,
    },
});
