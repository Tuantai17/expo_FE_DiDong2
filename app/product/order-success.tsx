/**
 * Order Success Screen
 * =====================
 * Displays order confirmation with real data from checkout
 * Shows animated success icon, order summary, and navigation options
 * Updated for VNPay integration
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SuccessLottie } from "../../components/ui/SuccessLottie";
import { useCart } from "../../context/CartContext";
import { checkVNPayPaymentStatus, confirmVNPayPayment } from "../../services/vnpayService";

// =================== TYPES =====================

type PaymentMethodType = "cod" | "vnpay" | "banking";

// =================== COMPONENT =====================

export default function OrderSuccessScreen() {
    const router = useRouter();
    const { clearCart, refreshCart } = useCart();
    const params = useLocalSearchParams<{
        total?: string;
        name?: string;
        itemCount?: string;
        orderId?: string;
        paymentMethod?: string;
        status?: string; // 'success' when redirected from VNPay
    }>();

    // Parse params with defaults
    const total = Number(params.total) || 0;
    const customerName = params.name || "Khách hàng";
    const itemCount = Number(params.itemCount) || 0;
    const orderId = params.orderId || `ORD${String(Date.now()).slice(-6)}`;
    const paymentMethod = (params.paymentMethod as PaymentMethodType) || "cod";
    const isFromVNPay = params.status === "success" && paymentMethod === "vnpay";

    // State for VNPay confirmation
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [cartCleared, setCartCleared] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState<{
        status: string;
        transactionId?: string;
        paidAt?: string;
    } | null>(null);

    // Animation refs
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // =================== HELPERS =====================

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    const getPaymentMethodLabel = (method: PaymentMethodType) => {
        const methods: Record<PaymentMethodType, string> = {
            cod: "Thanh toán khi nhận hàng",
            vnpay: "VNPay",
            banking: "Chuyển khoản ngân hàng",
        };
        return methods[method] || "Thanh toán khi nhận hàng";
    };

    // =================== EFFECTS =====================

    // Clear and refresh cart when order success page loads
    useEffect(() => {
        const clearCartAfterOrder = async () => {
            // Only run once when orderId is present and cart hasn't been cleared yet
            if (cartCleared || !orderId) {
                return;
            }

            try {
                console.log('🛒 [OrderSuccess] Clearing and refreshing cart after successful order');
                console.log('   Order ID:', orderId);

                // Clear local cart and sync with backend
                await clearCart();
                console.log('✅ [OrderSuccess] clearCart() completed');

                // Small delay before refresh to ensure backend has processed
                await new Promise(resolve => setTimeout(resolve, 300));

                // Refresh to get latest state from backend (which should now be empty)
                await refreshCart();
                console.log('✅ [OrderSuccess] refreshCart() completed');

                setCartCleared(true);
                console.log('✅ [OrderSuccess] Cart cleared and refreshed successfully');
            } catch (error) {
                console.error('❌ [OrderSuccess] Error clearing cart:', error);
                // Mark as cleared anyway to prevent retry loop
                setCartCleared(true);

                // Try refresh to sync with backend
                try {
                    await refreshCart();
                } catch (refreshError) {
                    console.error('❌ [OrderSuccess] Error refreshing cart:', refreshError);
                }
            }
        };

        clearCartAfterOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]); // Only depend on orderId, not on functions to prevent infinite loops

    // Confirm VNPay payment when redirected from VNPay
    useEffect(() => {
        const confirmPayment = async () => {
            if (isFromVNPay && orderId && !isConfirmed) {
                // Parse orderId to number (remove ORD- prefix if present)
                const orderIdNum = parseInt(orderId.replace(/\D/g, ''), 10);

                if (!isNaN(orderIdNum) && orderIdNum > 0) {
                    setIsConfirming(true);
                    setConfirmError(null);

                    try {
                        console.log('🔄 [OrderSuccess] Confirming VNPay payment for order:', orderIdNum);
                        
                        // First try to confirm the payment
                        const confirmResult = await confirmVNPayPayment(orderIdNum);

                        if (confirmResult.success) {
                            console.log('✅ [OrderSuccess] VNPay payment confirmed successfully');
                            setIsConfirmed(true);
                        }

                        // Then check the payment status to get transaction details
                        const statusResult = await checkVNPayPaymentStatus(orderIdNum);
                        if (statusResult.success) {
                            setPaymentInfo({
                                status: statusResult.status,
                                transactionId: statusResult.transactionId,
                                paidAt: statusResult.paidAt,
                            });
                        }

                        if (!confirmResult.success) {
                            console.warn('⚠️ [OrderSuccess] VNPay payment confirmation warning:', confirmResult.message);
                            // Don't set error for non-critical issues
                        }
                    } catch (error) {
                        console.error('❌ [OrderSuccess] Error confirming VNPay payment:', error);
                        setConfirmError('Không thể xác nhận thanh toán. Vui lòng liên hệ hỗ trợ.');
                    } finally {
                        setIsConfirming(false);
                    }
                }
            }
        };

        confirmPayment();
    }, [isFromVNPay, orderId, isConfirmed]);

    // Animation effect
    useEffect(() => {
        // Animate check icon with spring
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();

        // Fade in and slide up content
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // =================== HANDLERS =====================

    const handleContinueShopping = () => {
        router.replace("/(main)/products");
    };

    const handleBackToHome = () => {
        router.replace("/(main)");
    };

    const handleViewOrder = () => {
        router.push({
            pathname: "/product/order-status",
            params: {
                orderId,
                total: total.toString(),
                itemCount: itemCount.toString(),
                paymentMethod,
            },
        });
    };

    // =================== RENDER =====================

    return (
        <View style={styles.screen}>
            {/* Confetti decorations */}
            <View style={[styles.confetti, { top: "8%", left: "8%" }]}>
                <Ionicons name="star" size={24} color="#F59E0B" />
            </View>
            <View style={[styles.confetti, { top: "12%", right: "12%" }]}>
                <Ionicons name="heart" size={20} color="#EF4444" />
            </View>
            <View style={[styles.confetti, { bottom: "18%", left: "15%" }]}>
                <Ionicons name="sparkles" size={26} color="#8B5CF6" />
            </View>
            <View style={[styles.confetti, { bottom: "22%", right: "8%" }]}>
                <Ionicons name="gift" size={22} color="#10B981" />
            </View>

            {/* Success Card */}
            <View style={styles.card}>
                {/* Lottie Success Animation */}
                <Animated.View
                    style={[
                        styles.iconWrapper,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    <SuccessLottie size={150} />
                </Animated.View>

                {/* Content */}
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.title}>
                        {isFromVNPay ? "Thanh toán thành công!" : "Đặt hàng thành công!"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isFromVNPay
                            ? `Cảm ơn bạn, ${customerName}! Đơn hàng của bạn đã được thanh toán qua VNPay.`
                            : `Cảm ơn bạn, ${customerName}! Đơn hàng của bạn đã được xác nhận.`
                        }
                    </Text>

                    {/* Loading indicator while confirming */}
                    {isConfirming && (
                        <View style={styles.confirmingContainer}>
                            <ActivityIndicator size="small" color="#0066CC" />
                            <Text style={styles.confirmingText}>Đang xác nhận thanh toán...</Text>
                        </View>
                    )}

                    {/* Error message */}
                    {confirmError && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{confirmError}</Text>
                        </View>
                    )}

                    {/* Order Info Box */}
                    <View style={styles.orderInfoBox}>
                        <View style={styles.orderInfoRow}>
                            {/* Items count */}
                            <View style={styles.orderInfoItem}>
                                <View style={styles.orderInfoIconWrapper}>
                                    <Ionicons name="bag-check-outline" size={22} color="#5B9EE1" />
                                </View>
                                <Text style={styles.orderInfoLabel}>Sản phẩm</Text>
                                <Text style={styles.orderInfoValue}>{itemCount}</Text>
                            </View>

                            <View style={styles.orderInfoDivider} />

                            {/* Total paid */}
                            <View style={styles.orderInfoItem}>
                                <View style={styles.orderInfoIconWrapper}>
                                    <Ionicons name="card-outline" size={22} color="#5B9EE1" />
                                </View>
                                <Text style={styles.orderInfoLabel}>Tổng tiền</Text>
                                <Text style={styles.orderInfoValue}>{formatPrice(total)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Order ID & Payment Method */}
                    <View style={styles.orderDetailsBox}>
                        <View style={styles.orderDetailRow}>
                            <Text style={styles.orderDetailLabel}>Mã đơn hàng</Text>
                            <Text style={styles.orderDetailValue}>{orderId}</Text>
                        </View>
                        <View style={styles.orderDetailRow}>
                            <Text style={styles.orderDetailLabel}>Thanh toán</Text>
                            <Text style={[
                                styles.orderDetailValue,
                                isFromVNPay && { color: '#10B981' }
                            ]}>
                                {isFromVNPay
                                    ? "Đã thanh toán (VNPay)"
                                    : getPaymentMethodLabel(paymentMethod)
                                }
                            </Text>
                        </View>
                        {paymentInfo?.transactionId && (
                            <View style={styles.orderDetailRow}>
                                <Text style={styles.orderDetailLabel}>Mã giao dịch</Text>
                                <Text style={styles.orderDetailValue}>{paymentInfo.transactionId}</Text>
                            </View>
                        )}
                    </View>

                    {/* Notice */}
                    <View style={styles.noticeBox}>
                        <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                        <Text style={styles.noticeText}>
                            Bạn sẽ nhận được thông báo xác nhận đơn hàng trong giây lát.
                            Theo dõi đơn hàng tại mục{" "}
                            <Text style={styles.noticeBold}>Đơn hàng của tôi</Text>.
                        </Text>
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleContinueShopping}
                    >
                        <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryText}>Tiếp tục mua sắm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleViewOrder}
                    >
                        <Ionicons name="receipt-outline" size={20} color="#5B9EE1" />
                        <Text style={styles.secondaryText}>Xem đơn hàng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={handleBackToHome}
                    >
                        <Text style={styles.linkText}>Về trang chủ</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    card: {
        width: "100%",
        borderRadius: 28,
        backgroundColor: "#FFFFFF",
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.15,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
            },
            android: {
                elevation: 10,
            },
        }),
    },
    iconWrapper: {
        marginBottom: 20,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#10B981",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#10B981",
                shadowOpacity: 0.4,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
            },
            android: {
                elevation: 8,
            },
        }),
    },
    lottieAnimation: {
        width: 150,
        height: 150,
    },
    content: {
        alignItems: "center",
        width: "100%",
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 21,
        marginBottom: 24,
        paddingHorizontal: 10,
    },

    // Confirming state
    confirmingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
    },
    confirmingText: {
        fontSize: 13,
        color: '#0066CC',
    },

    // Error state
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        fontSize: 13,
        color: '#EF4444',
        flex: 1,
    },

    // Order Info Box
    orderInfoBox: {
        width: "100%",
        borderRadius: 16,
        backgroundColor: "#F8FAFC",
        padding: 18,
        marginBottom: 16,
    },
    orderInfoRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    orderInfoItem: {
        alignItems: "center",
        flex: 1,
    },
    orderInfoIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#EBF4FF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    orderInfoDivider: {
        width: 1,
        height: 60,
        backgroundColor: "#E2E8F0",
    },
    orderInfoLabel: {
        fontSize: 12,
        color: "#94A3B8",
        marginBottom: 4,
    },
    orderInfoValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },

    // Order Details
    orderDetailsBox: {
        width: "100%",
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
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
        fontWeight: "600",
        color: "#0F172A",
    },

    // Notice
    noticeBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#FFFBEB",
        borderRadius: 14,
        padding: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#FEF3C7",
        width: "100%",
    },
    noticeText: {
        flex: 1,
        fontSize: 13,
        color: "#92400E",
        lineHeight: 19,
        marginLeft: 10,
    },
    noticeBold: {
        fontWeight: "700",
    },

    // Buttons
    primaryButton: {
        width: "100%",
        flexDirection: "row",
        borderRadius: 16,
        backgroundColor: "#5B9EE1",
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.35,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 5,
            },
        }),
    },
    primaryText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    secondaryButton: {
        width: "100%",
        flexDirection: "row",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#5B9EE1",
        backgroundColor: "#FFFFFF",
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        gap: 8,
    },
    secondaryText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#5B9EE1",
    },
    linkButton: {
        marginTop: 4,
        paddingVertical: 8,
    },
    linkText: {
        fontSize: 14,
        color: "#64748B",
    },

    // Confetti
    confetti: {
        position: "absolute",
        opacity: 0.7,
    },
});
