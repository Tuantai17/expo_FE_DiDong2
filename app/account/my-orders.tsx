/**
 * My Orders Screen
 * =================
 * Displays user's order history from backend API ONLY
 * Does NOT use local OrderContext - fetches directly from database
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

// =================== TYPES =====================

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "PAID";

type OrderFromAPI = {
    orderId: number;
    email: string;
    orderDate: string;
    orderStatus: OrderStatus;
    totalAmount: number;
    paymentId?: number;
};

// =================== CONSTANTS =====================

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
    PENDING: { label: "Chờ xác nhận", bgColor: "#FEF3C7", textColor: "#D97706" },
    CONFIRMED: { label: "Đã xác nhận", bgColor: "#DBEAFE", textColor: "#2563EB" },
    PROCESSING: { label: "Đang xử lý", bgColor: "#E0E7FF", textColor: "#4F46E5" },
    SHIPPING: { label: "Đang giao hàng", bgColor: "#E0E7FF", textColor: "#4F46E5" },
    SHIPPED: { label: "Đang giao", bgColor: "#E0E7FF", textColor: "#4F46E5" },
    DELIVERED: { label: "Đã giao", bgColor: "#DCFCE7", textColor: "#16A34A" },
    COMPLETED: { label: "Hoàn thành", bgColor: "#DCFCE7", textColor: "#16A34A" },
    CANCELLED: { label: "Đã hủy", bgColor: "#FEE2E2", textColor: "#DC2626" },
    PAID: { label: "Đã thanh toán", bgColor: "#DCFCE7", textColor: "#16A34A" },
};

const FILTER_OPTIONS = [
    { key: "all", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "CONFIRMED", label: "Đã xác nhận" },
    { key: "PROCESSING", label: "Đang xử lý" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "DELIVERED", label: "Đã giao" },
    { key: "COMPLETED", label: "Hoàn thành" },
];

// =================== COMPONENT =====================

export default function MyOrdersScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    // State
    const [orders, setOrders] = useState<OrderFromAPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<string>("all");

    // =================== HELPERS =====================

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    };

    // =================== API CALLS =====================

    const fetchOrders = useCallback(async () => {
        if (!isAuthenticated || !user?.id) {
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            console.log("📤 Fetching orders from API for user:", user.id);
            const response = await api.get<OrderFromAPI[]>(`/api/orders/user/${user.id}`);
            console.log("📦 Orders from API:", response.data);

            // Sort by orderId descending (newest first)
            const sortedOrders = (response.data || []).sort((a, b) => b.orderId - a.orderId);
            setOrders(sortedOrders);
        } catch (error) {
            console.error("❌ Fetch orders error:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, isAuthenticated]);

    // =================== EFFECTS =====================

    // Fetch orders when screen is focused
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchOrders();
        }, [fetchOrders])
    );

    // =================== HANDLERS =====================

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const handleOpenOrder = (order: OrderFromAPI) => {
        router.push({
            pathname: "/product/order-status",
            params: {
                orderId: `#ORD-${order.orderId}`,
                total: order.totalAmount.toString(),
                itemCount: "1", // We don't have item count from list API
                status: order.orderStatus.toLowerCase(),
                paymentMethod: "cod",
            },
        });
    };

    const handleLogin = () => {
        router.push("/(auth)/login");
    };

    // =================== COMPUTED =====================

    const filteredOrders = useMemo(() => {
        if (filter === "all") return orders;
        return orders.filter((o) => o.orderStatus === filter);
    }, [filter, orders]);

    const orderStats = useMemo(() => {
        return {
            total: orders.length,
            pending: orders.filter(o => o.orderStatus === "PENDING" || o.orderStatus === "CONFIRMED").length,
            processing: orders.filter(o => o.orderStatus === "PROCESSING" || o.orderStatus === "SHIPPING" || o.orderStatus === "SHIPPED").length,
            delivered: orders.filter(o => o.orderStatus === "DELIVERED" || o.orderStatus === "COMPLETED" || o.orderStatus === "PAID").length,
        };
    }, [orders]);

    // =================== RENDER: NOT LOGGED IN =====================

    if (!isAuthenticated) {
        return (
            <View style={styles.screen}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={20} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.notLoggedInContainer}>
                    <View style={styles.notLoggedInIcon}>
                        <Ionicons name="person-outline" size={48} color="#CBD5E1" />
                    </View>
                    <Text style={styles.notLoggedInTitle}>Chưa đăng nhập</Text>
                    <Text style={styles.notLoggedInText}>
                        Vui lòng đăng nhập để xem đơn hàng của bạn
                    </Text>
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // =================== RENDER: LOADING =====================

    if (loading) {
        return (
            <View style={styles.screen}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={20} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5B9EE1" />
                    <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
                </View>
            </View>
        );
    }

    // =================== RENDER: MAIN =====================

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Ionicons name="receipt-outline" size={22} color="#5B9EE1" />
                        <Text style={styles.summaryTitle}>Lịch sử đơn hàng</Text>
                    </View>
                    <Text style={styles.summarySubtitle}>
                        Bạn có {orderStats.total} đơn hàng
                    </Text>

                    {/* Quick Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{orderStats.pending}</Text>
                            <Text style={styles.statLabel}>Chờ xử lý</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{orderStats.processing}</Text>
                            <Text style={styles.statLabel}>Đang giao</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{orderStats.delivered}</Text>
                            <Text style={styles.statLabel}>Hoàn thành</Text>
                        </View>
                    </View>
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterRow}
                >
                    {FILTER_OPTIONS.map((option) => {
                        const isActive = filter === option.key;
                        return (
                            <TouchableOpacity
                                key={option.key}
                                style={[styles.filterChip, isActive && styles.filterChipActive]}
                                onPress={() => setFilter(option.key)}
                            >
                                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Orders List */}
                {filteredOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.orderStatus);

                    return (
                        <TouchableOpacity
                            key={order.orderId}
                            style={styles.orderCard}
                            onPress={() => handleOpenOrder(order)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.orderHeaderRow}>
                                <View style={styles.orderIdSection}>
                                    <View style={styles.orderIconCircle}>
                                        <Ionicons name="receipt-outline" size={18} color="#5B9EE1" />
                                    </View>
                                    <View style={styles.orderIdInfo}>
                                        <Text style={styles.orderIdText}>Đơn hàng #{order.orderId}</Text>
                                        <Text style={styles.orderDateText}>{formatDate(order.orderDate)}</Text>
                                    </View>
                                </View>

                                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                                    <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                                        {statusConfig.label}
                                    </Text>
                                </View>
                            </View>

                            {/* Email info */}
                            <View style={styles.orderEmailRow}>
                                <Ionicons name="mail-outline" size={14} color="#94A3B8" />
                                <Text style={styles.orderEmailText} numberOfLines={1}>
                                    {order.email}
                                </Text>
                            </View>

                            <View style={styles.orderBottomRow}>
                                <View>
                                    <Text style={styles.orderLabel}>Tổng tiền</Text>
                                    <Text style={styles.orderTotal}>
                                        {formatPrice(order.totalAmount)}
                                    </Text>
                                </View>

                                <View style={styles.orderCTA}>
                                    <Text style={styles.orderCTAText}>Xem chi tiết</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#5B9EE1" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {/* Empty State */}
                {filteredOrders.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrapper}>
                            <Ionicons name="document-text-outline" size={56} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {filter === "all" ? "Chưa có đơn hàng" : "Không có đơn hàng"}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {filter === "all"
                                ? "Đơn hàng của bạn sẽ xuất hiện ở đây sau khi bạn đặt hàng"
                                : "Không có đơn hàng nào với trạng thái này"}
                        </Text>
                        {filter === "all" && (
                            <TouchableOpacity
                                style={styles.shopButton}
                                onPress={() => router.push("/(main)/products")}
                            >
                                <Ionicons name="storefront-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingTop: Platform.OS === "ios" ? 50 : 40,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748B",
    },

    // Not logged in
    notLoggedInContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    notLoggedInIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    notLoggedInTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
    },
    notLoggedInText: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        marginBottom: 24,
    },
    loginButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#5B9EE1",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    loginButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
    },

    // Header
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
        marginLeft: 12,
    },

    // Summary Card
    summaryCard: {
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        padding: 18,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 3,
            },
        }),
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
    },
    summarySubtitle: {
        fontSize: 13,
        color: "#64748B",
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: "row",
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 14,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statDivider: {
        width: 1,
        backgroundColor: "#E2E8F0",
    },
    statValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
    },
    statLabel: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 2,
    },

    // Filter
    filterScroll: {
        marginBottom: 16,
    },
    filterRow: {
        flexDirection: "row",
        gap: 8,
        paddingRight: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#E2E8F0",
    },
    filterChipActive: {
        backgroundColor: "#5B9EE1",
    },
    filterChipText: {
        fontSize: 13,
        color: "#475569",
        fontWeight: "500",
    },
    filterChipTextActive: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    // Order Card
    orderCard: {
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        padding: 16,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    orderHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    orderIdSection: {
        flexDirection: "row",
        alignItems: "center",
    },
    orderIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#EBF4FF",
        alignItems: "center",
        justifyContent: "center",
    },
    orderIdInfo: {
        marginLeft: 10,
    },
    orderIdText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
    },
    orderDateText: {
        fontSize: 12,
        color: "#94A3B8",
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
    },
    orderEmailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    orderEmailText: {
        flex: 1,
        fontSize: 12,
        color: "#64748B",
    },
    orderBottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orderLabel: {
        fontSize: 12,
        color: "#94A3B8",
        marginBottom: 2,
    },
    orderTotal: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
    },
    orderCTA: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    orderCTAText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#5B9EE1",
    },

    // Empty State
    emptyContainer: {
        alignItems: "center",
        marginTop: 60,
        paddingHorizontal: 24,
    },
    emptyIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    shopButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "#5B9EE1",
        gap: 8,
    },
    shopButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
