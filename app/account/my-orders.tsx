/**
 * My Orders Screen
 * =================
 * Displays user's order history from backend API ONLY
 * Does NOT use local OrderContext - fetches directly from database
 * Supports quick order cancellation for pending orders
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
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

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "PAID";

// Type matching backend OrderDTO response
type OrderFromAPI = {
  id: number;
  userId?: number;
  userEmail?: string;
  userName?: string;
  orderCode?: string;
  status?: string; // Status from API (can be any string)
  paymentMethod?: string;
  shippingFee?: number;
  totalAmount: number;
  discountAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  note?: string;
  items?: any[];
  // Legacy fields for backward compatibility
  orderId?: number;
  email?: string;
  orderDate?: string;
  orderStatus?: OrderStatus;
  paymentId?: number;
};

type CancelOrderResponse = {
  success: boolean;
  message: string;
};

// =================== CONSTANTS =====================

// Các trạng thái có thể hủy đơn
const CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING"];

const STATUS_CONFIG: Record<
  string,
  { label: string; bgColor: string; textColor: string }
> = {
  PENDING: { label: "Chờ xác nhận", bgColor: "#FEF3C7", textColor: "#D97706" },
  CONFIRMED: { label: "Đã xác nhận", bgColor: "#DBEAFE", textColor: "#2563EB" },
  PROCESSING: { label: "Đang xử lý", bgColor: "#E0E7FF", textColor: "#4F46E5" },
  SHIPPING: {
    label: "Đang giao hàng",
    bgColor: "#E0E7FF",
    textColor: "#4F46E5",
  },
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
  { key: "CANCELLED", label: "Đã hủy" },
];

// =================== HELPER FUNCTIONS =====================

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const getStatusConfig = (status?: string) => {
  const upperStatus = (status || "PENDING").toUpperCase();
  return STATUS_CONFIG[upperStatus] || STATUS_CONFIG.PENDING;
};

const canCancelOrder = (status?: string): boolean => {
  const upperStatus = (status || "").toUpperCase() as OrderStatus;
  return CANCELLABLE_STATUSES.includes(upperStatus);
};

// Helper to get order ID (supports both new and legacy field names)
const getOrderId = (order: OrderFromAPI): number => {
  return order.id || order.orderId || 0;
};

// Helper to get order status (supports both new and legacy field names)
const getOrderStatus = (order: OrderFromAPI): string => {
  return order.status || order.orderStatus || "PENDING";
};

// Helper to get order date (supports both new and legacy field names)
const getOrderDate = (order: OrderFromAPI): string => {
  return order.createdAt || order.orderDate || "";
};

// Helper to get order email (supports both new and legacy field names)
const getOrderEmail = (order: OrderFromAPI): string => {
  return order.userEmail || order.email || "";
};

// =================== COMPONENT =====================

export default function MyOrdersScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // =================== STATE =====================

  const [orders, setOrders] = useState<OrderFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Cancel order state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderFromAPI | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // =================== API CALLS =====================

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      console.log("📤 Fetching orders from API for user:", user.id);
      const response = await api.get<OrderFromAPI[]>(
        `/api/orders/user/${user.id}`
      );
      console.log("📦 Orders from API:", response.data);

      // Sort by ID descending (newest first) - using helper to support both new and legacy fields
      const sortedOrders = (response.data || []).sort(
        (a, b) => getOrderId(b) - getOrderId(a)
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error("❌ Fetch orders error:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  const cancelOrder = async (orderId: number): Promise<boolean> => {
    setCancelling(true);
    try {
      console.log("🚫 Cancelling order:", orderId);
      const response = await api.post<CancelOrderResponse>(
        `/api/orders/${orderId}/cancel`
      );

      if (response.data.success) {
        console.log("✅ Order cancelled successfully");
        // Update local state - support both new and legacy field names
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            getOrderId(order) === orderId
              ? {
                  ...order,
                  status: "CANCELLED",
                  orderStatus: "CANCELLED" as OrderStatus,
                }
              : order
          )
        );
        return true;
      } else {
        throw new Error(response.data.message || "Hủy đơn hàng thất bại");
      }
    } catch (error: any) {
      console.error("❌ Error cancelling order:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi hủy đơn hàng";
      Alert.alert("Lỗi", errorMessage);
      return false;
    } finally {
      setCancelling(false);
    }
  };

  // =================== EFFECTS =====================

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
    // Use helper functions to safely get values
    const orderId = getOrderId(order);
    const status = getOrderStatus(order);

    router.push({
      pathname: "/product/order-status",
      params: {
        orderId: orderId.toString(),
        total: (order.totalAmount || 0).toString(),
        itemCount: (order.items?.length || 1).toString(),
        status: status.toLowerCase(),
        paymentMethod: order.paymentMethod || "cod",
      },
    });
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleCancelPress = (order: OrderFromAPI) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;

    setShowCancelModal(false);
    const orderId = getOrderId(selectedOrder);
    const success = await cancelOrder(orderId);

    if (success) {
      Alert.alert(
        "Thành công",
        `Đơn hàng #${selectedOrder.orderId} đã được hủy thành công.`,
        [{ text: "OK" }]
      );
    }
    setSelectedOrder(null);
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setSelectedOrder(null);
  };

  // =================== COMPUTED =====================

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    // Use getOrderStatus helper to support both new and legacy fields
    return orders.filter(
      (o) => getOrderStatus(o).toUpperCase() === filter.toUpperCase()
    );
  }, [filter, orders]);

  const orderStats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => {
        const status = getOrderStatus(o).toUpperCase();
        return status === "PENDING" || status === "CONFIRMED";
      }).length,
      processing: orders.filter((o) => {
        const status = getOrderStatus(o).toUpperCase();
        return (
          status === "PROCESSING" ||
          status === "SHIPPING" ||
          status === "SHIPPED"
        );
      }).length,
      delivered: orders.filter((o) => {
        const status = getOrderStatus(o).toUpperCase();
        return (
          status === "DELIVERED" || status === "COMPLETED" || status === "PAID"
        );
      }).length,
      cancelled: orders.filter(
        (o) => getOrderStatus(o).toUpperCase() === "CANCELLED"
      ).length,
    };
  }, [orders]);

  // =================== RENDER COMPONENTS =====================

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/(main)/profile")}
      >
        <Ionicons name="chevron-back" size={20} color="#0F172A" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
      <View style={{ width: 44 }} />
    </View>
  );

  const renderNotLoggedIn = () => (
    <View style={styles.screen}>
      {renderHeader()}
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

  const renderLoading = () => (
    <View style={styles.screen}>
      {renderHeader()}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B9EE1" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    </View>
  );

  const renderSummaryCard = () => (
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
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#DC2626" }]}>
            {orderStats.cancelled}
          </Text>
          <Text style={styles.statLabel}>Đã hủy</Text>
        </View>
      </View>
    </View>
  );

  const renderFilterChips = () => (
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
            <Text
              style={[
                styles.filterChipText,
                isActive && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderOrderCard = (order: OrderFromAPI) => {
    // Use helper functions to safely get values
    const orderId = getOrderId(order);
    const status = getOrderStatus(order);
    const orderDate = getOrderDate(order);
    const orderEmail = getOrderEmail(order);
    const statusConfig = getStatusConfig(status);
    const showCancelBtn = canCancelOrder(status);

    return (
      <TouchableOpacity
        key={orderId}
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
              <Text style={styles.orderIdText}>Đơn hàng #{orderId}</Text>
              <Text style={styles.orderDateText}>{formatDate(orderDate)}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Text
              style={[styles.statusText, { color: statusConfig.textColor }]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Email info */}
        <View style={styles.orderEmailRow}>
          <Ionicons name="mail-outline" size={14} color="#94A3B8" />
          <Text style={styles.orderEmailText} numberOfLines={1}>
            {orderEmail || "N/A"}
          </Text>
        </View>

        <View style={styles.orderBottomRow}>
          <View>
            <Text style={styles.orderLabel}>Tổng tiền</Text>
            <Text style={styles.orderTotal}>
              {formatPrice(order.totalAmount || 0)}
            </Text>
          </View>

          <View style={styles.orderActions}>
            {/* Cancel Button */}
            {showCancelBtn && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCancelPress(order);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={16}
                  color="#EF4444"
                />
                <Text style={styles.cancelBtnText}>Hủy đơn</Text>
              </TouchableOpacity>
            )}

            {/* View Detail CTA */}
            <View style={styles.orderCTA}>
              <Text style={styles.orderCTAText}>Chi tiết</Text>
              <Ionicons name="chevron-forward" size={16} color="#5B9EE1" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
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
  );

  const renderCancelConfirmModal = () => (
    <Modal
      visible={showCancelModal}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancelModalClose}
    >
      <View style={styles.cancelModalOverlay}>
        <View style={styles.cancelModalContent}>
          {/* Icon */}
          <View style={styles.cancelModalIconWrapper}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>

          {/* Title & Message */}
          <Text style={styles.cancelModalTitle}>Xác nhận hủy đơn hàng</Text>
          <Text style={styles.cancelModalMessage}>
            Bạn có chắc chắn muốn hủy đơn hàng{" "}
            <Text style={styles.cancelModalOrderId}>
              #{selectedOrder?.orderId}
            </Text>
            ?{"\n\n"}
            Hành động này không thể hoàn tác.
          </Text>

          {/* Buttons */}
          <View style={styles.cancelModalButtons}>
            <TouchableOpacity
              style={styles.cancelModalButtonSecondary}
              onPress={handleCancelModalClose}
              disabled={cancelling}
            >
              <Text style={styles.cancelModalButtonSecondaryText}>
                Không, giữ đơn
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalButtonPrimary}
              onPress={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.cancelModalButtonPrimaryText}>
                  Xác nhận hủy
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // =================== RENDER: CONDITIONALS =====================

  if (!isAuthenticated) {
    return renderNotLoggedIn();
  }

  if (loading) {
    return renderLoading();
  }

  // =================== RENDER: MAIN =====================

  return (
    <View style={styles.screen}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSummaryCard()}
        {renderFilterChips()}

        {/* Orders List */}
        {filteredOrders.map(renderOrderCard)}

        {/* Empty State */}
        {filteredOrders.length === 0 && renderEmptyState()}
      </ScrollView>

      {renderCancelConfirmModal()}
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
    fontSize: 18,
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
  orderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    gap: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
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

  // Cancel Confirmation Modal
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cancelModalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cancelModalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center",
  },
  cancelModalMessage: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  cancelModalOrderId: {
    fontWeight: "700",
    color: "#5B9EE1",
  },
  cancelModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelModalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  cancelModalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  cancelModalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelModalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
