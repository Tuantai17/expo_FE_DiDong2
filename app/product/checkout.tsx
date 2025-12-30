/**
 * Checkout Screen with MoMo Payment Integration
 * ==============================================
 * Order checkout with real product data from CartContext
 * Includes: order summary, shipping info, payment method selection (COD, MoMo QR, MoMo Card)
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    Animated,
    Dimensions,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useOrders } from "../../context/OrderContext";
import { showErrorAlert } from "../../utils/alert";
import { useMoMoPayment } from "../../hooks/useMoMoPayment";
import QRCode from "react-native-qrcode-svg";
import * as Linking from "expo-linking";

// =================== CONSTANTS =====================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MOMO_PINK = '#AE2070';
const MOMO_LIGHT_PINK = '#FFF0F5';

// =================== TYPES =====================

type PaymentMethod = "cod" | "card" | "momo" | "vnpay";
type MoMoPaymentType = "QR" | "CARD";

// =================== COMPONENT =====================

export default function CheckoutScreen() {
    const router = useRouter();
    const { items, clearCart } = useCart();
    const { user } = useAuth();
    const { createOrder } = useOrders();

    // MoMo Payment Hook
    const {
        isLoading: momoLoading,
        error: momoError,
        paymentUrl,
        qrCodeUrl,
        paymentStatus,
        initiatePayment,
        verifyPayment,
        simulatePayment,
        resetState: resetMoMoState,
    } = useMoMoPayment();

    // =================== STATE =====================

    const [fullName, setFullName] = useState(user?.fullName || user?.username || "");
    const [phone, setPhone] = useState(user?.phoneNumber || "");
    const [address, setAddress] = useState(user?.address || "");
    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
    const [isLoading, setIsLoading] = useState(false);

    // MoMo Modal State
    const [showMoMoModal, setShowMoMoModal] = useState(false);
    const [momoType, setMoMoType] = useState<MoMoPaymentType>("QR");
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(300); // 5 minutes
    const [fadeAnim] = useState(new Animated.Value(0));

    // =================== EFFECTS =====================

    // Countdown timer for QR
    useEffect(() => {
        if (showMoMoModal && momoType === 'QR') {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setCountdown(300);
        }
    }, [showMoMoModal, momoType]);

    // Handle MoMo error
    useEffect(() => {
        if (momoError) {
            Alert.alert("Lỗi thanh toán", momoError);
        }
    }, [momoError]);

    // Handle payment status change
    useEffect(() => {
        if (paymentStatus?.isPaid || paymentStatus?.paymentStatus === 'SUCCESS') {
            handlePaymentSuccess();
        }
    }, [paymentStatus]);

    // =================== CALCULATIONS =====================

    const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const FREE_SHIPPING_THRESHOLD = 500000;
    const SHIPPING_FEE = 30000;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (items.length > 0 ? SHIPPING_FEE : 0);
    const total = subtotal + shipping;

    // =================== HELPERS =====================

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // =================== HANDLERS =====================

    const validateForm = (): boolean => {
        if (!fullName.trim()) {
            showErrorAlert("Thiếu thông tin", "Vui lòng nhập họ tên người nhận.");
            return false;
        }
        if (!phone.trim()) {
            showErrorAlert("Thiếu thông tin", "Vui lòng nhập số điện thoại.");
            return false;
        }
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
            showErrorAlert("Số điện thoại không hợp lệ", "Vui lòng nhập số điện thoại đúng định dạng (10-11 số).");
            return false;
        }
        if (!address.trim()) {
            showErrorAlert("Thiếu thông tin", "Vui lòng nhập địa chỉ giao hàng.");
            return false;
        }
        return true;
    };

    const getImageUrl = (image: any): string => {
        if (!image) return '';
        if (typeof image === 'string') return image;
        if (typeof image === 'object' && image.uri) return image.uri;
        return '';
    };

    const createOrderOnBackend = async (): Promise<number | null> => {
        const paymentMethodMap: Record<PaymentMethod, "COD" | "MOMO" | "BANKING"> = {
            cod: "COD",
            momo: "MOMO",
            card: "BANKING",
            vnpay: "BANKING",
        };

        const orderInput = {
            items: items.map(item => ({
                productId: parseInt(item.id, 10) || 0,
                productName: item.name,
                productImage: getImageUrl(item.image),
                size: item.size,
                quantity: item.qty,
                price: item.price,
            })),
            shippingInfo: {
                fullName,
                phone,
                address,
                note,
            },
            paymentMethod: paymentMethodMap[paymentMethod],
            subtotal,
            shippingFee: shipping,
            total,
        };

        try {
            console.log("📤 Creating order:", orderInput);
            const newOrder = await createOrder(orderInput);
            console.log("✅ Order created:", newOrder);
            return newOrder.orderId || null;
        } catch (error) {
            console.error("❌ Create order error:", error);
            return null;
        }
    };

    const handlePaymentSuccess = () => {
        setShowMoMoModal(false);
        clearCart();
        resetMoMoState();

        Alert.alert(
            "🎉 Thanh toán thành công!",
            `Đơn hàng của bạn đã được thanh toán thành công.\nMã đơn: #${currentOrderId}`,
            [
                {
                    text: "Xem đơn hàng",
                    onPress: () => router.replace({
                        pathname: "/product/order-success",
                        params: {
                            total: total.toString(),
                            name: fullName,
                            itemCount: totalItems.toString(),
                            paymentMethod: "momo",
                            orderId: currentOrderId?.toString() || "",
                            status: "success", // Đánh dấu thanh toán MoMo thành công
                        },
                    }),
                },
            ]
        );
    };

    const handleMoMoPayment = async () => {
        if (!validateForm()) return;
        if (items.length === 0) {
            showErrorAlert("Giỏ hàng trống", "Vui lòng thêm sản phẩm vào giỏ hàng.");
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Create order first
            const orderId = await createOrderOnBackend();
            if (!orderId) {
                showErrorAlert("Lỗi", "Không thể tạo đơn hàng. Vui lòng thử lại.");
                setIsLoading(false);
                return;
            }

            setCurrentOrderId(orderId);

            // Step 2: Initiate MoMo payment
            const success = await initiatePayment({
                orderId,
                amount: total,
                orderInfo: `Thanh toan don hang #${orderId} - ${fullName}`,
            }, momoType);

            if (success) {
                // Show MoMo modal
                setShowMoMoModal(true);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else {
                // If payment initiation failed but we still want to show the modal for Card payment
                // This allows users to retry or see error message in modal
                if (momoType === 'CARD') {
                    Alert.alert(
                        "Lỗi MoMo API",
                        "Không thể tạo link thanh toán MoMo. Backend có thể chưa được cấu hình đúng.\n\nBạn có thể:\n1. Thử lại sau\n2. Chọn phương thức QR code\n3. Chọn phương thức COD",
                        [
                            { text: "Thử lại", onPress: () => handleMoMoPayment() },
                            { text: "Chọn QR", onPress: () => { setMoMoType('QR'); } },
                            { text: "Đóng", style: "cancel" }
                        ]
                    );
                } else {
                    showErrorAlert("Lỗi", "Không thể kết nối đến MoMo. Vui lòng thử lại.");
                }
            }
        } catch (error: any) {
            console.error("❌ MoMo payment error:", error);
            showErrorAlert("Lỗi thanh toán", error.message || "Có lỗi xảy ra khi thanh toán.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCODPayment = async () => {
        if (!validateForm()) return;
        if (items.length === 0) {
            showErrorAlert("Giỏ hàng trống", "Vui lòng thêm sản phẩm vào giỏ hàng.");
            return;
        }

        setIsLoading(true);

        try {
            const orderId = await createOrderOnBackend();
            if (orderId) {
                clearCart();
                router.replace({
                    pathname: "/product/order-success",
                    params: {
                        total: total.toString(),
                        name: fullName,
                        itemCount: totalItems.toString(),
                        paymentMethod: "cod",
                        orderId: orderId.toString(),
                    },
                });
            } else {
                showErrorAlert("Lỗi", "Không thể tạo đơn hàng.");
            }
        } catch (error: any) {
            console.error("❌ Order error:", error);
            showErrorAlert("Đặt hàng thất bại", error.message || "Có lỗi xảy ra khi đặt hàng.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlaceOrder = () => {
        if (paymentMethod === 'momo') {
            handleMoMoPayment();
        } else {
            handleCODPayment();
        }
    };

    const handleCheckPaymentStatus = async () => {
        if (currentOrderId) {
            await verifyPayment(currentOrderId);
        }
    };

    const handleSimulatePayment = async () => {
        if (currentOrderId) {
            Alert.alert(
                "Mô phỏng thanh toán",
                "Bạn muốn mô phỏng thanh toán thành công? (Chỉ dùng cho testing)",
                [
                    { text: "Hủy", style: "cancel" },
                    {
                        text: "Thanh toán thành công",
                        onPress: async () => {
                            await simulatePayment(currentOrderId, total);
                        },
                    },
                ]
            );
        }
    };

    const handleOpenPaymentPage = async () => {
        if (paymentUrl) {
            try {
                const canOpen = await Linking.canOpenURL(paymentUrl);
                if (canOpen) {
                    await Linking.openURL(paymentUrl);
                } else {
                    // Fallback: Try to open anyway
                    await Linking.openURL(paymentUrl);
                }
            } catch (error) {
                console.error('Error opening payment URL:', error);
                Alert.alert(
                    'Lỗi',
                    'Không thể mở trang thanh toán. Vui lòng thử lại.',
                    [{ text: 'OK' }]
                );
            }
        } else {
            Alert.alert(
                'Thông báo',
                'Chưa có link thanh toán. Vui lòng thử lại.',
                [{ text: 'OK' }]
            );
        }
    };

    const closeMoMoModal = () => {
        setShowMoMoModal(false);
        resetMoMoState();
        setCountdown(300);
    };

    // =================== PAYMENT METHODS CONFIG =====================

    const paymentMethods = [
        {
            id: "cod" as PaymentMethod,
            icon: "cash-outline",
            title: "Thanh toán khi nhận hàng",
            desc: "Thanh toán bằng tiền mặt khi nhận hàng",
        },
        {
            id: "card" as PaymentMethod,
            icon: "card-outline",
            title: "Thẻ tín dụng / Ghi nợ",
            desc: "Visa, Mastercard, JCB",
        },
        {
            id: "momo" as PaymentMethod,
            icon: "wallet-outline",
            title: "Ví MoMo",
            desc: "Thanh toán qua ví điện tử MoMo",
            isMoMo: true,
        },
        {
            id: "vnpay" as PaymentMethod,
            icon: "globe-outline",
            title: "VNPay",
            desc: "Thanh toán qua cổng VNPay",
        },
    ];

    // =================== RENDER MOMO MODAL =====================

    const renderMoMoModal = () => (
        <Modal
            visible={showMoMoModal}
            animationType="slide"
            transparent={true}
            onRequestClose={closeMoMoModal}
        >
            <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <View style={styles.momoIconContainer}>
                                <MaterialCommunityIcons name="wallet" size={24} color={MOMO_PINK} />
                            </View>
                            <View>
                                <Text style={styles.modalHeaderTitle}>Thanh toán MoMo</Text>
                                <Text style={styles.modalHeaderAmount}>{formatPrice(total)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={closeMoMoModal}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Payment Type Tabs */}
                    <View style={styles.momoTabs}>
                        <TouchableOpacity
                            style={[styles.momoTab, momoType === 'QR' && styles.momoTabActive]}
                            onPress={() => setMoMoType('QR')}
                        >
                            <Ionicons
                                name="qr-code-outline"
                                size={20}
                                color={momoType === 'QR' ? MOMO_PINK : '#666'}
                            />
                            <Text style={[styles.momoTabText, momoType === 'QR' && styles.momoTabTextActive]}>
                                Quét QR
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.momoTab, momoType === 'CARD' && styles.momoTabActive]}
                            onPress={() => setMoMoType('CARD')}
                        >
                            <Ionicons
                                name="card-outline"
                                size={20}
                                color={momoType === 'CARD' ? MOMO_PINK : '#666'}
                            />
                            <Text style={[styles.momoTabText, momoType === 'CARD' && styles.momoTabTextActive]}>
                                Thẻ Card
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {momoType === 'QR' ? (
                            // QR Code View
                            <View style={styles.qrContainer}>
                                <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>

                                <View style={styles.qrCodeWrapper}>
                                    {momoLoading ? (
                                        <View style={styles.qrLoading}>
                                            <ActivityIndicator size="large" color={MOMO_PINK} />
                                            <Text style={styles.qrLoadingText}>Đang tạo mã QR...</Text>
                                        </View>
                                    ) : (qrCodeUrl || paymentUrl) ? (
                                        <View style={styles.qrCodeBorder}>
                                            <QRCode
                                                value={qrCodeUrl || paymentUrl || `momo://payment?orderId=${currentOrderId}`}
                                                size={180}
                                                backgroundColor="white"
                                                color="#000"
                                            />
                                        </View>
                                    ) : (
                                        <View style={styles.qrLoading}>
                                            <Ionicons name="qr-code-outline" size={60} color="#ccc" />
                                            <Text style={styles.qrLoadingText}>Không thể tạo mã QR</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.countdownContainer}>
                                    <Ionicons name="time-outline" size={16} color="#666" />
                                    <Text style={styles.countdownText}>
                                        Còn lại: {formatTime(countdown)}
                                    </Text>
                                </View>

                                {/* Instructions */}
                                <View style={styles.instructionsBox}>
                                    <Text style={styles.instructionsTitle}>Hướng dẫn thanh toán:</Text>
                                    <View style={styles.instructionStep}>
                                        <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
                                        <Text style={styles.stepText}>Mở ứng dụng MoMo trên điện thoại</Text>
                                    </View>
                                    <View style={styles.instructionStep}>
                                        <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
                                        <Text style={styles.stepText}>Chọn "Quét mã" và quét mã QR ở trên</Text>
                                    </View>
                                    <View style={styles.instructionStep}>
                                        <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
                                        <Text style={styles.stepText}>Xác nhận thanh toán trên MoMo</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            // Card Payment View
                            <View style={styles.cardContainer}>
                                <MaterialCommunityIcons name="credit-card-outline" size={48} color={MOMO_PINK} />
                                <Text style={styles.cardTitle}>Thanh toán bằng thẻ</Text>
                                <Text style={styles.cardDesc}>
                                    Thanh toán qua thẻ ATM/Visa/Mastercard liên kết với MoMo
                                </Text>

                                <View style={styles.cardLogos}>
                                    <View style={styles.cardLogoItem}>
                                        <MaterialCommunityIcons name="credit-card" size={28} color="#1A1F71" />
                                        <Text style={styles.cardLogoLabel}>Visa</Text>
                                    </View>
                                    <View style={styles.cardLogoItem}>
                                        <MaterialCommunityIcons name="credit-card-outline" size={28} color="#EB001B" />
                                        <Text style={styles.cardLogoLabel}>Mastercard</Text>
                                    </View>
                                    <View style={styles.cardLogoItem}>
                                        <MaterialCommunityIcons name="credit-card-chip" size={28} color="#006491" />
                                        <Text style={styles.cardLogoLabel}>JCB</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.openPaymentBtn, !paymentUrl && styles.openPaymentBtnDisabled]}
                                    onPress={handleOpenPaymentPage}
                                    disabled={!paymentUrl || momoLoading}
                                >
                                    {momoLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="open-in-new" size={20} color="#fff" />
                                            <Text style={styles.openPaymentText}>Mở trang thanh toán</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.cardNote}>
                                    * Bạn sẽ được chuyển đến trang thanh toán của MoMo
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Modal Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.checkStatusBtn}
                            onPress={handleCheckPaymentStatus}
                            disabled={momoLoading}
                        >
                            {momoLoading ? (
                                <ActivityIndicator size="small" color={MOMO_PINK} />
                            ) : (
                                <>
                                    <Ionicons name="refresh" size={18} color={MOMO_PINK} />
                                    <Text style={styles.checkStatusText}>Kiểm tra trạng thái</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Test button for simulation */}
                        {__DEV__ && (
                            <TouchableOpacity
                                style={styles.simulateBtn}
                                onPress={handleSimulatePayment}
                            >
                                <Text style={styles.simulateBtnText}>🧪 Test: Mô phỏng thành công</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.securityBadge}>
                            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                            <Text style={styles.securityText}>Giao dịch được bảo mật bởi MoMo</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );

    // =================== RENDER =====================

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán</Text>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepText}>Bước 2/2</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Order Summary Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="receipt-outline" size={18} color="#5B9EE1" />
                        <Text style={styles.cardHeaderText}>Đơn hàng của bạn</Text>
                        <Text style={styles.itemCount}>{totalItems} sản phẩm</Text>
                    </View>

                    {items.map((item, index) => (
                        <View
                            key={`${item.id}-${item.size}`}
                            style={[styles.orderItem, index === items.length - 1 && styles.orderItemLast]}
                        >
                            <View style={styles.orderItemImage}>
                                <Image
                                    source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                                    style={styles.itemImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.qtyBadge}>
                                    <Text style={styles.qtyBadgeText}>x{item.qty}</Text>
                                </View>
                            </View>
                            <View style={styles.orderItemInfo}>
                                <Text style={styles.orderItemName} numberOfLines={2}>{item.name}</Text>
                                <Text style={styles.orderItemSize}>Size: {item.size}</Text>
                                <Text style={styles.orderItemPrice}>{formatPrice(item.price * item.qty)}</Text>
                            </View>
                        </View>
                    ))}

                    {/* Price Summary */}
                    <View style={styles.priceSummary}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Tạm tính</Text>
                            <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <View style={styles.shippingLabel}>
                                <Text style={styles.priceLabel}>Phí vận chuyển</Text>
                                {shipping === 0 && (
                                    <View style={styles.freeBadge}>
                                        <Text style={styles.freeText}>FREE</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.priceValue, shipping === 0 && styles.freeValue]}>
                                {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Shipping Info Card */}
                <View style={[styles.card, styles.cardMargin]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location-outline" size={18} color="#5B9EE1" />
                        <Text style={styles.cardHeaderText}>Thông tin giao hàng</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Họ và tên người nhận *</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={18} color="#94A3B8" />
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Nhập họ tên"
                                placeholderTextColor="#94A3B8"
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Số điện thoại *</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={18} color="#94A3B8" />
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#94A3B8"
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Địa chỉ giao hàng *</Text>
                        <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
                            <Ionicons name="home-outline" size={18} color="#94A3B8" style={styles.inputIconTop} />
                            <TextInput
                                style={[styles.input, styles.inputMultiline]}
                                value={address}
                                onChangeText={setAddress}
                                multiline
                                numberOfLines={3}
                                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                placeholderTextColor="#94A3B8"
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Ghi chú (tùy chọn)</Text>
                        <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
                            <Ionicons name="document-text-outline" size={18} color="#94A3B8" style={styles.inputIconTop} />
                            <TextInput
                                style={[styles.input, styles.inputMultiline]}
                                value={note}
                                onChangeText={setNote}
                                multiline
                                numberOfLines={2}
                                placeholder="Ghi chú cho người giao hàng..."
                                placeholderTextColor="#94A3B8"
                                editable={!isLoading}
                            />
                        </View>
                    </View>
                </View>

                {/* Payment Method Card */}
                <View style={[styles.card, styles.cardMargin]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="wallet-outline" size={18} color="#5B9EE1" />
                        <Text style={styles.cardHeaderText}>Phương thức thanh toán</Text>
                    </View>

                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.paymentOption,
                                paymentMethod === method.id && styles.paymentOptionActive,
                                method.isMoMo && paymentMethod === method.id && styles.paymentOptionMoMo,
                            ]}
                            onPress={() => setPaymentMethod(method.id)}
                            disabled={isLoading}
                        >
                            <View style={[
                                styles.paymentIconWrapper,
                                paymentMethod === method.id && styles.paymentIconWrapperActive,
                                method.isMoMo && paymentMethod === method.id && styles.paymentIconWrapperMoMo,
                            ]}>
                                {method.isMoMo ? (
                                    <MaterialCommunityIcons
                                        name="wallet"
                                        size={22}
                                        color={paymentMethod === method.id ? MOMO_PINK : "#64748B"}
                                    />
                                ) : (
                                    <Ionicons
                                        name={method.icon as any}
                                        size={22}
                                        color={paymentMethod === method.id ? "#5B9EE1" : "#64748B"}
                                    />
                                )}
                            </View>
                            <View style={styles.paymentInfo}>
                                <Text style={[
                                    styles.paymentTitle,
                                    paymentMethod === method.id && styles.paymentTitleActive,
                                    method.isMoMo && paymentMethod === method.id && styles.paymentTitleMoMo,
                                ]}>
                                    {method.title}
                                </Text>
                                <Text style={styles.paymentDesc}>{method.desc}</Text>
                            </View>
                            <View style={[
                                styles.radioOuter,
                                paymentMethod === method.id && styles.radioOuterActive,
                                method.isMoMo && paymentMethod === method.id && styles.radioOuterMoMo,
                            ]}>
                                {paymentMethod === method.id && (
                                    <View style={[
                                        styles.radioInner,
                                        method.isMoMo && styles.radioInnerMoMo,
                                    ]} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* MoMo Payment Type Selection */}
                    {paymentMethod === 'momo' && (
                        <View style={styles.momoTypeSelection}>
                            <Text style={styles.momoTypeLabel}>Chọn hình thức thanh toán MoMo:</Text>
                            <View style={styles.momoTypeOptions}>
                                <TouchableOpacity
                                    style={[styles.momoTypeBtn, momoType === 'QR' && styles.momoTypeBtnActive]}
                                    onPress={() => setMoMoType('QR')}
                                >
                                    <Ionicons
                                        name="qr-code-outline"
                                        size={24}
                                        color={momoType === 'QR' ? MOMO_PINK : '#64748B'}
                                    />
                                    <Text style={[styles.momoTypeBtnText, momoType === 'QR' && styles.momoTypeBtnTextActive]}>
                                        Quét mã QR
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.momoTypeBtn, momoType === 'CARD' && styles.momoTypeBtnActive]}
                                    onPress={() => setMoMoType('CARD')}
                                >
                                    <Ionicons
                                        name="card-outline"
                                        size={24}
                                        color={momoType === 'CARD' ? MOMO_PINK : '#64748B'}
                                    />
                                    <Text style={[styles.momoTypeBtnText, momoType === 'CARD' && styles.momoTypeBtnTextActive]}>
                                        Thẻ ngân hàng
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Security Note */}
                <View style={styles.securityNote}>
                    <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
                    <Text style={styles.securityNoteText}>
                        Thông tin của bạn được bảo mật và mã hóa an toàn
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomTotal}>
                    <Text style={styles.bottomTotalLabel}>Tổng thanh toán</Text>
                    <Text style={styles.bottomTotalValue}>{formatPrice(total)}</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.payButton,
                        paymentMethod === 'momo' && styles.payButtonMoMo,
                        (items.length === 0 || isLoading) && styles.payButtonDisabled,
                    ]}
                    disabled={items.length === 0 || isLoading}
                    onPress={handlePlaceOrder}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.payText}>
                                {paymentMethod === 'momo' ? 'Thanh toán MoMo' : 'Đặt hàng'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* MoMo Payment Modal */}
            {renderMoMoModal()}
        </KeyboardAvoidingView>
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
        paddingBottom: 120,
    },

    // Header
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 50 : 40,
        paddingBottom: 12,
        backgroundColor: "#F8FAFC",
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
        marginLeft: 12,
    },
    stepIndicator: {
        backgroundColor: "#EBF4FF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stepText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#5B9EE1",
    },

    // Card
    card: {
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        padding: 16,
        ...Platform.select({
            ios: { shadowColor: "#5B9EE1", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 3 },
        }),
    },
    cardMargin: { marginTop: 16 },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 8,
    },
    cardHeaderText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#0F172A",
    },
    itemCount: {
        fontSize: 12,
        color: "#64748B",
        fontWeight: "500",
    },

    // Order Items
    orderItem: {
        flexDirection: "row",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    orderItemLast: { borderBottomWidth: 0 },
    orderItemImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        position: "relative",
    },
    itemImage: { width: 55, height: 55 },
    qtyBadge: {
        position: "absolute",
        bottom: -4,
        right: -4,
        backgroundColor: "#5B9EE1",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
    },
    qtyBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
    },
    orderItemInfo: { flex: 1, justifyContent: "center" },
    orderItemName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 4,
        lineHeight: 18,
    },
    orderItemSize: { fontSize: 12, color: "#94A3B8", marginBottom: 4 },
    orderItemPrice: { fontSize: 14, fontWeight: "700", color: "#5B9EE1" },

    // Price Summary
    priceSummary: {
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 12,
        marginTop: 8,
    },
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    shippingLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
    priceLabel: { fontSize: 14, color: "#64748B" },
    priceValue: { fontSize: 14, fontWeight: "500", color: "#0F172A" },
    freeBadge: {
        backgroundColor: "#ECFDF5",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    freeText: { fontSize: 9, fontWeight: "700", color: "#10B981" },
    freeValue: { color: "#10B981" },
    divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8 },
    totalLabel: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
    totalValue: { fontSize: 20, fontWeight: "800", color: "#EF4444" },

    // Input
    inputGroup: { marginBottom: 14 },
    inputLabel: { fontSize: 13, fontWeight: "500", color: "#64748B", marginBottom: 8 },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
    },
    inputWrapperMultiline: { alignItems: "flex-start" },
    inputIconTop: { marginTop: 2 },
    input: { flex: 1, fontSize: 14, color: "#0F172A" },
    inputMultiline: { height: 60, textAlignVertical: "top" },

    // Payment Options
    paymentOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        marginBottom: 10,
    },
    paymentOptionActive: {
        borderColor: "#5B9EE1",
        backgroundColor: "#EBF4FF",
    },
    paymentOptionMoMo: {
        borderColor: MOMO_PINK,
        backgroundColor: MOMO_LIGHT_PINK,
    },
    paymentIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    paymentIconWrapperActive: { backgroundColor: "#DBEAFE" },
    paymentIconWrapperMoMo: { backgroundColor: '#FFE4EC' },
    paymentInfo: { flex: 1 },
    paymentTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 2,
    },
    paymentTitleActive: { color: "#5B9EE1" },
    paymentTitleMoMo: { color: MOMO_PINK },
    paymentDesc: { fontSize: 12, color: "#94A3B8" },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
    },
    radioOuterActive: { borderColor: "#5B9EE1" },
    radioOuterMoMo: { borderColor: MOMO_PINK },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#5B9EE1",
    },
    radioInnerMoMo: { backgroundColor: MOMO_PINK },

    // MoMo Type Selection
    momoTypeSelection: {
        backgroundColor: MOMO_LIGHT_PINK,
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    momoTypeLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: MOMO_PINK,
        marginBottom: 10,
    },
    momoTypeOptions: {
        flexDirection: "row",
        gap: 10,
    },
    momoTypeBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        gap: 8,
    },
    momoTypeBtnActive: {
        borderColor: MOMO_PINK,
        backgroundColor: '#fff',
    },
    momoTypeBtnText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748B",
    },
    momoTypeBtnTextActive: {
        color: MOMO_PINK,
        fontWeight: "600",
    },

    // Security Note
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        gap: 8,
    },
    securityNoteText: { fontSize: 12, color: "#64748B" },

    // Bottom Bar
    bottomBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: Platform.OS === "ios" ? 30 : 16,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
            android: { elevation: 8 },
        }),
    },
    bottomTotal: { flex: 1 },
    bottomTotalLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 2 },
    bottomTotalValue: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
    payButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: "#5B9EE1",
        gap: 8,
        ...Platform.select({
            ios: { shadowColor: "#5B9EE1", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 5 },
        }),
    },
    payButtonMoMo: {
        backgroundColor: MOMO_PINK,
        ...Platform.select({
            ios: { shadowColor: MOMO_PINK },
        }),
    },
    payButtonDisabled: { backgroundColor: "#A0C4E8" },
    payText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.85,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    momoIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: MOMO_LIGHT_PINK,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    modalHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    modalHeaderAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: MOMO_PINK,
        marginTop: 2,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    momoTabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    momoTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        gap: 8,
    },
    momoTabActive: {
        backgroundColor: MOMO_LIGHT_PINK,
        borderWidth: 1,
        borderColor: MOMO_PINK,
    },
    momoTabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    momoTabTextActive: {
        color: MOMO_PINK,
        fontWeight: '600',
    },
    modalContent: {
        paddingHorizontal: 20,
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        alignItems: 'center',
    },

    // QR Container
    qrContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    qrTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 20,
    },
    qrCodeWrapper: {
        marginBottom: 16,
    },
    qrCodeBorder: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: MOMO_PINK,
        ...Platform.select({
            ios: { shadowColor: MOMO_PINK, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 4 },
        }),
    },
    qrLoading: {
        width: 180,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
    },
    qrLoadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 6,
    },
    countdownText: {
        fontSize: 14,
        color: '#666',
    },
    instructionsBox: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 12,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 12,
    },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: MOMO_PINK,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNum: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    modalStepText: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },

    // Card Container
    cardContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
        marginTop: 12,
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    cardLogos: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 24,
    },
    cardLogoItem: {
        alignItems: 'center',
        gap: 6,
    },
    cardLogoLabel: {
        fontSize: 12,
        color: '#666',
    },
    openPaymentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: MOMO_PINK,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
        width: '100%',
    },
    openPaymentText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    openPaymentBtnDisabled: {
        backgroundColor: '#D1B3C4',
        opacity: 0.7,
    },
    cardNote: {
        marginTop: 12,
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
    },

    // Footer buttons
    checkStatusBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: MOMO_PINK,
        gap: 8,
        marginBottom: 12,
    },
    checkStatusText: {
        fontSize: 14,
        fontWeight: '500',
        color: MOMO_PINK,
    },
    simulateBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    simulateBtnText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    securityText: {
        fontSize: 12,
        color: '#64748B',
    },
});
