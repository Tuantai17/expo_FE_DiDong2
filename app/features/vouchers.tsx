/**
 * Vouchers Screen - Trang hiển thị mã giảm giá
 * ============================================
 * Placeholder cho tính năng vouchers
 */

import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function VouchersScreen() {
    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Mã giảm giá",
                    headerStyle: { backgroundColor: "#10b981" },
                    headerTintColor: "#fff",
                    headerTitleStyle: { fontWeight: "600" },
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Empty State Placeholder */}
                <View style={styles.emptyContainer}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="local-offer" size={64} color="#10b981" />
                    </View>
                    <Text style={styles.emptyTitle}>Mã giảm giá</Text>
                    <Text style={styles.emptyDescription}>
                        Các mã giảm giá và ưu đãi đặc biệt sẽ được hiển thị tại đây.
                        Hãy quay lại sau để xem các chương trình khuyến mãi mới nhất!
                    </Text>

                    {/* Coming Soon Badge */}
                    <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>🚀 Coming Soon</Text>
                    </View>
                </View>

                {/* Sample Voucher Cards Placeholder */}
                <View style={styles.voucherSection}>
                    <Text style={styles.sectionTitle}>Ưu đãi dành cho bạn</Text>
                    
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.voucherCard}>
                            <View style={styles.voucherLeft}>
                                <Text style={styles.voucherDiscount}>-20%</Text>
                                <Text style={styles.voucherLabel}>Giảm giá</Text>
                            </View>
                            <View style={styles.voucherDivider} />
                            <View style={styles.voucherRight}>
                                <Text style={styles.voucherTitle}>Giảm 20% cho đơn từ 500K</Text>
                                <Text style={styles.voucherExpiry}>HSD: 31/12/2026</Text>
                                <View style={styles.voucherButton}>
                                    <Text style={styles.voucherButtonText}>Sử dụng</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    scrollContent: {
        padding: 16,
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#ecfdf5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        paddingHorizontal: 32,
        lineHeight: 22,
    },
    comingSoonBadge: {
        marginTop: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#fef3c7",
        borderRadius: 20,
    },
    comingSoonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#d97706",
    },
    voucherSection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 16,
    },
    voucherCard: {
        flexDirection: "row",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        opacity: 0.6, // Placeholder opacity
    },
    voucherLeft: {
        width: 80,
        backgroundColor: "#ecfdf5",
        padding: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    voucherDiscount: {
        fontSize: 20,
        fontWeight: "700",
        color: "#10b981",
    },
    voucherLabel: {
        fontSize: 10,
        color: "#059669",
        marginTop: 2,
    },
    voucherDivider: {
        width: 1,
        backgroundColor: "#e5e7eb",
    },
    voucherRight: {
        flex: 1,
        padding: 12,
    },
    voucherTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1f2937",
    },
    voucherExpiry: {
        fontSize: 12,
        color: "#9ca3af",
        marginTop: 4,
    },
    voucherButton: {
        alignSelf: "flex-start",
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#10b981",
        borderRadius: 6,
    },
    voucherButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#ffffff",
    },
});
