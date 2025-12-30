/**
 * Order Status Screen
 * ====================
 * Displays order tracking progress with real data from API
 * Shows order summary, timeline progress, product list modal
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api, BASE_URL } from "../../services/api";

// =================== TYPES =====================

type OrderItemFromAPI = {
    id?: number;
    productId: number;
    productTitle: string;  // Backend uses productTitle
    productImage: string;  // Backend uses productImage
    size?: string;
    color?: string;
    quantity: number;
    price: number;
    discount?: number;
    subtotal?: number;
};

// =================== CONSTANTS =====================

const ORDER_STEPS = [
    {
        key: "pending",
        label: "Đơn hàng đã xác nhận",
        description: "Chúng tôi đã nhận được đơn hàng của bạn.",
        icon: "checkmark-circle",
    },
    {
        key: "processing",
        label: "Đang chuẩn bị hàng",
        description: "Sản phẩm đang được đóng gói cẩn thận.",
        icon: "cube",
    },
    {
        key: "shipped",
        label: "Đang giao hàng",
        description: "Đơn hàng đang trên đường đến bạn.",
        icon: "bicycle",
    },
    {
        key: "delivered",
        label: "Đã giao hàng",
        description: "Đơn hàng đã được giao thành công.",
        icon: "home",
    },
];

type PaymentMethodType = "cod" | "card" | "momo" | "vnpay";

// =================== COMPONENT =====================

export default function OrderStatusScreen() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        total?: string;
        itemCount?: string;
        orderId?: string;
        status?: string;
        paymentMethod?: string;
    }>();

    // State for products modal
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [orderItems, setOrderItems] = useState<OrderItemFromAPI[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Parse params with defaults
    const total = Number(params.total) || 0;
    const itemCount = Number(params.itemCount) || 0;
    const orderId = params.orderId || "";
    const status = params.status || "pending";
    const paymentMethod = (params.paymentMethod as PaymentMethodType) || "cod";

    // Extract numeric order ID from string like "#ORD-5"
    const numericOrderId = orderId.replace(/\D/g, "");

    // =================== HELPERS =====================

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    const getPaymentMethodLabel = (method: PaymentMethodType) => {
        const methods: Record<PaymentMethodType, string> = {
            cod: "Thanh toán khi nhận hàng",
            card: "Thẻ tín dụng / Ghi nợ",
            momo: "Ví MoMo",
            vnpay: "VNPay",
        };
        return methods[method] || "Thanh toán khi nhận hàng";
    };

    const getStepIndex = (orderStatus: string): number => {
        const statusMap: Record<string, string> = {
            pending: "pending",
            confirmed: "pending",
            processing: "processing",
            shipping: "shipped",
            shipped: "shipped",
            delivered: "delivered",
            completed: "delivered",
            paid: "delivered",
            cancelled: "pending",
        };
        const mappedStatus = statusMap[orderStatus.toLowerCase()] || "pending";
        const stepKeys = ORDER_STEPS.map((s) => s.key);
        const index = stepKeys.indexOf(mappedStatus);
        return index >= 0 ? index : 0;
    };

    const currentIndex = getStepIndex(status);

    const formatDate = () => {
        const now = new Date();
        return now.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getImageUrl = (photo: string) => {
        if (!photo) return null;
        if (photo.startsWith("http")) return photo;
        return `${BASE_URL}/images/${photo}`;
    };

    // =================== API CALLS =====================

    const fetchOrderItems = async () => {
        if (!numericOrderId) {
            console.log("No order ID to fetch items");
            return;
        }

        setLoadingItems(true);
        try {
            console.log("📤 Fetching order items for order:", numericOrderId);
            const response = await api.get<OrderItemFromAPI[]>(`/api/orders/${numericOrderId}/items`);
            console.log("📦 Order items:", response.data);
            setOrderItems(response.data || []);
        } catch (error) {
            console.error("❌ Error fetching order items:", error);
            setOrderItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    // =================== HANDLERS =====================

    const handleContinueShopping = () => {
        router.push("/(main)/products");
    };

    const handleBackToHome = () => {
        router.replace("/(main)");
    };

    const handleShowProducts = () => {
        setShowProductsModal(true);
        // Fetch items when modal opens
        if (orderItems.length === 0) {
            fetchOrderItems();
        }
    };

    // =================== EFFECTS =====================

    // Pre-fetch order items on mount
    useEffect(() => {
        if (numericOrderId) {
            fetchOrderItems();
        }
    }, [numericOrderId]);

    // =================== RENDER =====================

    // Calculate total from items
    const calculatedTotal = orderItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );
    const displayTotal = calculatedTotal > 0 ? calculatedTotal : total;
    const displayItemCount = orderItems.length > 0
        ? orderItems.reduce((sum, item) => sum + item.quantity, 0)
        : itemCount;

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trạng thái đơn hàng</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Order Summary Card */}
                <View style={styles.card}>
                    <View style={styles.successIconCircle}>
                        <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                    </View>

                    <Text style={styles.title}>Đặt hàng thành công!</Text>
                    <Text style={styles.subtitle}>
                        Cảm ơn bạn! Đơn hàng của bạn đã được xác nhận.
                    </Text>

                    {/* Summary Stats - Clickable */}
                    <View style={styles.summaryBox}>
                        {/* Products - Clickable */}
                        <TouchableOpacity
                            style={styles.summaryColumn}
                            onPress={handleShowProducts}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.summaryIconWrapper, styles.summaryIconClickable]}>
                                <Ionicons name="bag-outline" size={20} color="#5B9EE1" />
                            </View>
                            <Text style={styles.summaryLabel}>Sản phẩm</Text>
                            <Text style={styles.summaryValue}>{displayItemCount}</Text>
                            <View style={styles.viewMoreBadge}>
                                <Text style={styles.viewMoreText}>Xem chi tiết</Text>
                                <Ionicons name="chevron-forward" size={12} color="#5B9EE1" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.summaryDivider} />

                        {/* Total - Not clickable */}
                        <View style={styles.summaryColumn}>
                            <View style={styles.summaryIconWrapper}>
                                <Ionicons name="card-outline" size={20} color="#5B9EE1" />
                            </View>
                            <Text style={styles.summaryLabel}>Tổng tiền</Text>
                            <Text style={styles.summaryValue}>{formatPrice(displayTotal)}</Text>
                        </View>
                    </View>

                    {/* Order Details */}
                    <View style={styles.orderDetailsBox}>
                        <View style={styles.orderDetailRow}>
                            <Text style={styles.orderDetailLabel}>Mã đơn hàng</Text>
                            <Text style={styles.orderDetailValueHighlight}>{orderId}</Text>
                        </View>
                        <View style={styles.orderDetailRow}>
                            <Text style={styles.orderDetailLabel}>Ngày đặt</Text>
                            <Text style={styles.orderDetailValue}>{formatDate()}</Text>
                        </View>
                        <View style={styles.orderDetailRow}>
                            <Text style={styles.orderDetailLabel}>Thanh toán</Text>
                            <Text style={styles.orderDetailValue}>
                                {getPaymentMethodLabel(paymentMethod)}
                            </Text>
                        </View>
                    </View>

                    {/* Info Notice */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#F97316" />
                        <Text style={styles.infoText}>
                            Bạn sẽ nhận được thông báo xác nhận đơn hàng qua email hoặc tin nhắn.
                            Theo dõi trạng thái đơn hàng tại đây.
                        </Text>
                    </View>
                </View>

                {/* Tracking Progress Card */}
                <View style={[styles.card, styles.cardMargin]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location-outline" size={18} color="#5B9EE1" />
                        <Text style={styles.cardHeaderText}>Tiến độ giao hàng</Text>
                    </View>

                    {ORDER_STEPS.map((step, index) => {
                        const isActive = index === currentIndex;
                        const isCompleted = index < currentIndex;

                        return (
                            <View key={step.key} style={styles.stepRow}>
                                {/* Step Indicator */}
                                <View style={styles.stepIndicatorWrapper}>
                                    <View
                                        style={[
                                            styles.stepCircle,
                                            (isActive || isCompleted) && styles.stepCircleActive,
                                        ]}
                                    >
                                        {isCompleted ? (
                                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                        ) : isActive ? (
                                            <View style={styles.stepCircleDot} />
                                        ) : null}
                                    </View>
                                    {index !== ORDER_STEPS.length - 1 && (
                                        <View
                                            style={[
                                                styles.stepLine,
                                                isCompleted && styles.stepLineActive,
                                            ]}
                                        />
                                    )}
                                </View>

                                {/* Step Content */}
                                <View style={styles.stepTextWrapper}>
                                    <View style={styles.stepLabelRow}>
                                        <Ionicons
                                            name={step.icon as any}
                                            size={16}
                                            color={isActive || isCompleted ? "#5B9EE1" : "#94A3B8"}
                                        />
                                        <Text
                                            style={[
                                                styles.stepLabel,
                                                (isActive || isCompleted) && styles.stepLabelActive,
                                            ]}
                                        >
                                            {step.label}
                                        </Text>
                                    </View>
                                    <Text style={styles.stepDescription}>{step.description}</Text>
                                    {isActive && (
                                        <View style={styles.stepBadgeContainer}>
                                            <Text style={styles.stepBadge}>Trạng thái hiện tại</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleContinueShopping}
                    >
                        <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Tiếp tục mua sắm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleBackToHome}
                    >
                        <Ionicons name="home-outline" size={20} color="#5B9EE1" />
                        <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Products Modal */}
            <Modal
                visible={showProductsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProductsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <Ionicons name="bag-check-outline" size={22} color="#5B9EE1" />
                                <Text style={styles.modalTitle}>Sản phẩm đã đặt</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowProductsModal(false)}
                            >
                                <Ionicons name="close" size={22} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Products List */}
                        <ScrollView
                            style={styles.modalScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {loadingItems ? (
                                <View style={styles.loadingProducts}>
                                    <ActivityIndicator size="large" color="#5B9EE1" />
                                    <Text style={styles.loadingProductsText}>
                                        Đang tải sản phẩm...
                                    </Text>
                                </View>
                            ) : orderItems.length > 0 ? (
                                orderItems.map((item, index) => (
                                    <View
                                        key={`${item.productId}-${index}`}
                                        style={[
                                            styles.productItem,
                                            index === orderItems.length - 1 && styles.productItemLast
                                        ]}
                                    >
                                        {/* Product Image */}
                                        <View style={styles.productImageWrapper}>
                                            {item.productImage ? (
                                                <Image
                                                    source={{ uri: getImageUrl(item.productImage) || "" }}
                                                    style={styles.productImage}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <View style={styles.productImagePlaceholder}>
                                                    <Ionicons name="cube-outline" size={28} color="#CBD5E1" />
                                                </View>
                                            )}
                                            <View style={styles.productQtyBadge}>
                                                <Text style={styles.productQtyText}>x{item.quantity}</Text>
                                            </View>
                                        </View>

                                        {/* Product Info */}
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName} numberOfLines={2}>
                                                {item.productTitle}
                                            </Text>
                                            {item.size && (
                                                <Text style={styles.productSize}>
                                                    Size: {item.size}
                                                </Text>
                                            )}
                                            <View style={styles.productPriceRow}>
                                                <Text style={styles.productPrice}>
                                                    {formatPrice(item.price)}
                                                </Text>
                                                <Text style={styles.productTotal}>
                                                    = {formatPrice(item.price * item.quantity)}
                                                </Text>
                                            </View>
                                            {(item.discount ?? 0) > 0 && (
                                                <Text style={styles.productDiscount}>
                                                    Giảm giá: {formatPrice(item.discount ?? 0)}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyProducts}>
                                    <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
                                    <Text style={styles.emptyProductsText}>
                                        Không có thông tin sản phẩm
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Modal Footer - Summary */}
                        {orderItems.length > 0 && (
                            <View style={styles.modalFooter}>
                                <View style={styles.modalSummaryRow}>
                                    <Text style={styles.modalSummaryLabel}>
                                        Tổng ({orderItems.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm)
                                    </Text>
                                    <Text style={styles.modalSummaryValue}>
                                        {formatPrice(displayTotal)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.modalDoneButton}
                                    onPress={() => setShowProductsModal(false)}
                                >
                                    <Text style={styles.modalDoneText}>Đóng</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },

    // Header
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 50 : 40,
        paddingBottom: 12,
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

    // Card
    card: {
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.08,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardMargin: {
        marginTop: 16,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 8,
    },
    cardHeaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0F172A",
    },

    // Success Icon
    successIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#10B981",
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: "#10B981",
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 6,
            },
        }),
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0F172A",
        textAlign: "center",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        marginBottom: 20,
    },

    // Summary Box
    summaryBox: {
        flexDirection: "row",
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        alignItems: "flex-start",
    },
    summaryColumn: {
        flex: 1,
        alignItems: "center",
    },
    summaryIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#EBF4FF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    summaryIconClickable: {
        borderWidth: 2,
        borderColor: "#5B9EE1",
        borderStyle: "dashed",
    },
    summaryDivider: {
        width: 1,
        height: 80,
        backgroundColor: "#E2E8F0",
        marginHorizontal: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: "#94A3B8",
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    viewMoreBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "#EBF4FF",
        borderRadius: 12,
    },
    viewMoreText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#5B9EE1",
    },

    // Order Details
    orderDetailsBox: {
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    orderDetailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    orderDetailLabel: {
        fontSize: 13,
        color: "#64748B",
    },
    orderDetailValue: {
        fontSize: 13,
        fontWeight: "500",
        color: "#0F172A",
    },
    orderDetailValueHighlight: {
        fontSize: 13,
        fontWeight: "700",
        color: "#5B9EE1",
    },

    // Info Box
    infoBox: {
        flexDirection: "row",
        borderRadius: 14,
        backgroundColor: "#FFFBEB",
        padding: 14,
        borderWidth: 1,
        borderColor: "#FEF3C7",
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: "#92400E",
        lineHeight: 18,
        marginLeft: 10,
    },

    // Step Timeline
    stepRow: {
        flexDirection: "row",
        marginBottom: 20,
    },
    stepIndicatorWrapper: {
        width: 36,
        alignItems: "center",
    },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    stepCircleActive: {
        backgroundColor: "#5B9EE1",
        borderColor: "#5B9EE1",
    },
    stepCircleDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FFFFFF",
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: "#E2E8F0",
        marginTop: 4,
        minHeight: 40,
    },
    stepLineActive: {
        backgroundColor: "#5B9EE1",
    },
    stepTextWrapper: {
        flex: 1,
        paddingLeft: 12,
    },
    stepLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#94A3B8",
    },
    stepLabelActive: {
        color: "#0F172A",
        fontWeight: "600",
    },
    stepDescription: {
        fontSize: 12,
        color: "#94A3B8",
        lineHeight: 17,
    },
    stepBadgeContainer: {
        marginTop: 8,
    },
    stepBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        fontSize: 11,
        fontWeight: "600",
        color: "#0369A1",
        backgroundColor: "#E0F2FE",
        overflow: "hidden",
    },

    // Buttons
    buttonsContainer: {
        marginTop: 20,
    },
    primaryButton: {
        flexDirection: "row",
        borderRadius: 16,
        backgroundColor: "#5B9EE1",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 5,
            },
        }),
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    secondaryButton: {
        flexDirection: "row",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#5B9EE1",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        marginTop: 12,
        backgroundColor: "#FFFFFF",
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#5B9EE1",
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: "75%",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: -4 },
            },
            android: {
                elevation: 10,
            },
        }),
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    modalHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    modalScroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },

    // Loading Products
    loadingProducts: {
        alignItems: "center",
        paddingVertical: 40,
    },
    loadingProductsText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748B",
    },

    // Product Item
    productItem: {
        flexDirection: "row",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    productItemLast: {
        borderBottomWidth: 0,
    },
    productImageWrapper: {
        width: 80,
        height: 80,
        borderRadius: 14,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        position: "relative",
    },
    productImage: {
        width: 60,
        height: 60,
    },
    productImagePlaceholder: {
        width: 60,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    productQtyBadge: {
        position: "absolute",
        bottom: -4,
        right: -4,
        backgroundColor: "#5B9EE1",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        minWidth: 28,
    },
    productQtyText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
    },
    productInfo: {
        flex: 1,
        justifyContent: "center",
    },
    productName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 4,
        lineHeight: 20,
    },
    productSize: {
        fontSize: 12,
        color: "#94A3B8",
        marginBottom: 6,
    },
    productPriceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: "#5B9EE1",
    },
    productTotal: {
        fontSize: 13,
        color: "#64748B",
    },
    productDiscount: {
        fontSize: 11,
        color: "#10B981",
        marginTop: 4,
    },

    // Empty State
    emptyProducts: {
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyProductsText: {
        fontSize: 14,
        color: "#94A3B8",
        marginTop: 12,
    },

    // Modal Footer
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        backgroundColor: "#FFFFFF",
    },
    modalSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalSummaryLabel: {
        fontSize: 14,
        color: "#64748B",
    },
    modalSummaryValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#EF4444",
    },
    modalDoneButton: {
        borderRadius: 14,
        backgroundColor: "#5B9EE1",
        paddingVertical: 14,
        alignItems: "center",
    },
    modalDoneText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
