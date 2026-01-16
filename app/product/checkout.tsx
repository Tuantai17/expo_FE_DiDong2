/**
 * Checkout Screen with Cross-Platform VNPay Integration
 * ======================================================
 * Handles payment differently based on platform:
 * - Web: Browser redirect to VNPay
 * - iOS/Android: WebView screen for VNPay
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AddressSelectorModal from "../../components/checkout/AddressSelectorModal";
import LocationPickerModal from "../../components/checkout/LocationPickerModal";
import { DualVoucherSection } from "../../components/voucher";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useOrders } from "../../context/OrderContext";
import { useVNPayPayment } from "../../hooks/useVNPayPayment";
import { Address, addressService } from "../../services/addressService";
import { shippingService } from "../../services/shippingService";
import { showErrorAlert } from "../../utils/alert";
import { isWeb, openVNPayWeb } from "../../utils/vnpayPlatform";

// =================== CONSTANTS =====================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VNPAY_BLUE = '#0066CC';
const VNPAY_LIGHT_BLUE = '#E6F0FF';

// =================== TYPES =====================

type PaymentMethod = "cod" | "vnpay" | "banking";

// =================== COMPONENT =====================

export default function CheckoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ error?: string; orderId?: string; vnp_ResponseCode?: string }>();
    const { items, clearCart, refreshCart } = useCart();
    const { user, refreshUser } = useAuth();
    const { createOrder } = useOrders();

    // VNPay Payment Hook
    const {
        isLoading: vnpayLoading,
        error: vnpayError,
        paymentUrl,
        initiatePayment,
        resetState: resetVNPayState,
    } = useVNPayPayment();

    // =================== STATE =====================

    const [fullName, setFullName] = useState(user?.fullName || user?.name || user?.username || "");
    const [phone, setPhone] = useState(user?.phoneNumber || "");
    const [address, setAddress] = useState(user?.address || "");
    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
    const [isLoading, setIsLoading] = useState(false);

    // Location Picker Modal State
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // Address Selector State
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

    // Voucher State
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [appliedVoucherCode, setAppliedVoucherCode] = useState('');

    // Shipping State (Dynamic)
    const [shippingFee, setShippingFee] = useState(30000);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingVoucherDiscount, setShippingVoucherDiscount] = useState(0);
    const [appliedShippingVoucherCode, setAppliedShippingVoucherCode] = useState('');

    // =================== EFFECTS =====================

    // Refresh user info on mount to ensure latest data
    useEffect(() => {
        refreshUser();
    }, []);

    // Auto-fill form data when user info updates
    useEffect(() => {
        if (user) {
            // Prioritize fullName > name > username
            const nameToUse = user.fullName || user.name || user.username || "";
            setFullName(nameToUse);
            setPhone(user.phoneNumber || "");
            setAddress(user.address || "");
            
            loadSavedAddresses();
        }
    }, [user]);

    const loadSavedAddresses = async () => {
        try {
            if (user?.id) {
                const addrs = await addressService.getUserAddresses(user.id);
                setSavedAddresses(addrs);
                // Auto select default if no address entered yet
                if (!address) {
                    const defaultAddr = addrs.find(a => a.isDefault);
                    if (defaultAddr) {
                        fillAddress(defaultAddr);
                    }
                }
            }
        } catch (error) {
            console.log("Failed to load addresses", error);
        }
    };

    const fillAddress = (addr: Address) => {
        setFullName(addr.fullName);
        setPhone(addr.phone);
        // Combine address parts
        const fullAddr = [addr.address, addr.city, addr.country].filter(Boolean).join(", ");
        setAddress(fullAddr);
        setSelectedAddressId(addr.id);
    };

    // Handle VNPay error
    useEffect(() => {
        if (vnpayError) {
            Alert.alert("Lỗi thanh toán", vnpayError);
        }
    }, [vnpayError]);

    // Handle return from VNPay with failed payment
    useEffect(() => {
        if (params.error) {
            console.log('🔙 [Checkout] Returned from failed VNPay payment');
            console.log('📝 [Checkout] Error:', params.error, 'ResponseCode:', params.vnp_ResponseCode);
            
            // Refresh cart to ensure items are loaded from server
            refreshCart();
            
            // Show error message
            const errorMessages: Record<string, string> = {
                'Payment+failed': 'Thanh toán không thành công',
                'Payment+cancelled': 'Bạn đã hủy thanh toán',
            };
            
            const errorMsg = errorMessages[params.error] || 'Thanh toán thất bại';
            
            Alert.alert(
                'Thanh toán thất bại',
                `${errorMsg}. Giỏ hàng của bạn vẫn được giữ nguyên. Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.`,
                [
                    { text: 'Thử lại VNPay', onPress: () => setPaymentMethod('vnpay') },
                    { text: 'Thanh toán COD', onPress: () => setPaymentMethod('cod') },
                    { text: 'Đóng', style: 'cancel' }
                ]
            );
        }
    }, [params.error]);

    // =================== CALCULATIONS =====================

    const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    
    // Final shipping fee after discount
    const finalShippingFee = Math.max(0, shippingFee - shippingVoucherDiscount);
    
    // Total = subtotal - order discount + final shipping fee
    const total = subtotal - voucherDiscount + finalShippingFee;

    // Calculate shipping when address changes
    useEffect(() => {
        const calculateShipping = async () => {
            if (!address || items.length === 0) {
                setShippingFee(0);
                return;
            }
            
            setShippingLoading(true);
            try {
                const result = await shippingService.calculateShippingFromAddress(address, subtotal);
                console.log('📦 [Checkout] Shipping calculated:', result);
                setShippingFee(result.shippingFee);
            } catch (error) {
                console.error('[Checkout] Shipping calc error:', error);
                // Fallback to offline calculation
                const fallback = shippingService.calculateShippingOffline(address, subtotal);
                setShippingFee(fallback.shippingFee);
            } finally {
                setShippingLoading(false);
            }
        };
        
        calculateShipping();
    }, [address, subtotal, items.length]);

    // Handler for ORDER voucher applied
    const handleVoucherApplied = (discountAmount: number, voucherCode: string) => {
        console.log('🎟️ [Checkout] Order voucher applied:', voucherCode, 'Discount:', discountAmount);
        setVoucherDiscount(discountAmount);
        setAppliedVoucherCode(voucherCode);
    };

    // Handler for SHIPPING voucher applied
    const handleShippingVoucherApplied = (discountAmount: number, voucherCode: string) => {
        console.log('🚚 [Checkout] Shipping voucher applied:', voucherCode, 'Discount:', discountAmount);
        setShippingVoucherDiscount(Math.min(discountAmount, shippingFee)); // Can't discount more than shipping fee
        setAppliedShippingVoucherCode(voucherCode);
    };

    // =================== HELPERS =====================

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    // =================== HANDLERS =====================

    // Handle back navigation - go to home if coming from VNPay redirect (no history)
    const handleGoBack = () => {
        // If we came from VNPay failed redirect, go to home page
        // because there's no navigation history to go back to
        if (params.error || params.orderId) {
            router.replace('/(main)');
        } else {
            // Try normal back, fallback to home if it fails
            try {
                router.back();
            } catch (e) {
                router.replace('/(main)');
            }
        }
    };

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
        const paymentMethodMap: Record<PaymentMethod, "COD" | "VNPAY" | "BANKING"> = {
            cod: "COD",
            vnpay: "VNPAY",
            banking: "BANKING",
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
                addressId: selectedAddressId || undefined,
                note,
            },
            paymentMethod: paymentMethodMap[paymentMethod],
            subtotal,
            shippingFee: finalShippingFee, // Use final shipping fee after discount
            total,
            voucherCode: appliedVoucherCode || undefined,
            discountAmount: voucherDiscount || undefined,
            // Shipping voucher info
            shippingVoucherCode: appliedShippingVoucherCode || undefined,
            shippingDiscountAmount: shippingVoucherDiscount || undefined,
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

    /**
     * Handle VNPay payment - Platform aware
     * - Web: Redirect browser to VNPay
     * - Native: Navigate to WebView screen
     */
    const handleVNPayPayment = async () => {
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

            console.log("📦 Order created:", orderId);

            // Step 2: Initiate VNPay payment
            const result = await initiatePayment({
                orderId,
                amount: total,
                orderInfo: `Thanh toan don hang #${orderId} - ${fullName}`,
            });

            console.log("💳 Payment result:", result);

            if (!result.success || !result.payUrl) {
                Alert.alert(
                    "Lỗi VNPay",
                    "Không thể tạo thanh toán VNPay. Bạn có thể thử lại hoặc chọn phương thức khác.",
                    [
                        { text: "Thử lại", onPress: () => handleVNPayPayment() },
                        { text: "Thanh toán COD", onPress: () => setPaymentMethod('cod') },
                        { text: "Đóng", style: "cancel" }
                    ]
                );
                return;
            }

            // Step 3: Open VNPay based on platform
            if (isWeb()) {
                // WEB: Redirect browser to VNPay
                console.log("🌐 [Checkout] Web platform - Redirecting to VNPay");
                
                // IMPORTANT: Do NOT clear cart here!
                // Cart will be cleared only after successful payment confirmation
                // This ensures cart is preserved if user cancels VNPay payment
                console.log('📦 [Checkout] Cart preserved - will only clear after successful payment');

                // Redirect to VNPay
                openVNPayWeb(result.payUrl);
            } else {
                // NATIVE: Navigate to WebView screen
                console.log("📱 [Checkout] Native platform - Opening WebView");
                
                router.push({
                    pathname: '/product/vnpay-webview',
                    params: {
                        paymentUrl: result.payUrl,
                        orderId: orderId.toString(),
                        amount: total.toString(),
                        customerName: fullName,
                    },
                });
            }

        } catch (error: any) {
            console.error("❌ VNPay payment error:", error);
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
                try {
                    await clearCart();
                    console.log('✅ [Checkout] Cart cleared after COD order success');
                } catch (error) {
                    console.error('❌ [Checkout] Error clearing cart:', error);
                }
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
        if (paymentMethod === 'vnpay') {
            handleVNPayPayment();
        } else {
            handleCODPayment();
        }
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
            id: "vnpay" as PaymentMethod,
            icon: "card-outline",
            title: "VNPay",
            desc: isWeb() 
                ? "Thanh toán qua cổng VNPay (Chuyển hướng trình duyệt)"
                : "Thanh toán qua cổng VNPay (ATM, Visa, MasterCard)",
            isVNPay: true,
        },
        {
            id: "banking" as PaymentMethod,
            icon: "business-outline",
            title: "Chuyển khoản ngân hàng",
            desc: "Chuyển khoản trực tiếp đến tài khoản ngân hàng",
        },
    ];

    // =================== RENDER =====================

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
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
                        
                        {/* Shipping Fee Row */}
                        <View style={styles.priceRow}>
                            <View style={styles.shippingLabel}>
                                <Text style={styles.priceLabel}>Phí vận chuyển</Text>
                                {shippingLoading && (
                                    <ActivityIndicator size="small" color="#5B9EE1" style={{ marginLeft: 8 }} />
                                )}
                                {!shippingLoading && shippingFee === 0 && items.length > 0 && (
                                    <View style={styles.freeBadge}>
                                        <Text style={styles.freeText}>FREE</Text>
                                    </View>
                                )}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {shippingVoucherDiscount > 0 && shippingFee > 0 && (
                                    <Text style={{ color: '#94A3B8', textDecorationLine: 'line-through', fontSize: 13, marginRight: 8 }}>
                                        {formatPrice(shippingFee)}
                                    </Text>
                                )}
                                <Text style={[styles.priceValue, finalShippingFee === 0 && items.length > 0 && styles.freeValue]}>
                                    {items.length === 0 ? '0 ₫' : (finalShippingFee === 0 ? "Miễn phí" : formatPrice(finalShippingFee))}
                                </Text>
                            </View>
                        </View>
                        
                        {/* Order Voucher Discount */}
                        {voucherDiscount > 0 && (
                            <View style={styles.priceRow}>
                                <View style={styles.shippingLabel}>
                                    <Text style={[styles.priceLabel, { color: '#10B981' }]}>Giảm giá đơn hàng</Text>
                                    <View style={[styles.freeBadge, { backgroundColor: '#ECFDF5' }]}>
                                        <Text style={[styles.freeText, { color: '#10B981' }]}>{appliedVoucherCode}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.priceValue, { color: '#10B981' }]}>
                                    -{formatPrice(voucherDiscount)}
                                </Text>
                            </View>
                        )}
                        
                        {/* Shipping Voucher Discount */}
                        {shippingVoucherDiscount > 0 && (
                            <View style={styles.priceRow}>
                                <View style={styles.shippingLabel}>
                                    <Text style={[styles.priceLabel, { color: '#EE4D2D' }]}>Giảm phí vận chuyển</Text>
                                    <View style={[styles.freeBadge, { backgroundColor: '#FFF1ED' }]}>
                                        <Text style={[styles.freeText, { color: '#EE4D2D' }]}>{appliedShippingVoucherCode}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.priceValue, { color: '#EE4D2D' }]}>
                                    -{formatPrice(shippingVoucherDiscount)}
                                </Text>
                            </View>
                        )}
                        
                        <View style={styles.divider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Shipping Address Card - Shopee Style */}
                <TouchableOpacity 
                    style={[styles.card, styles.cardMargin, styles.addressCard]}
                    onPress={() => setShowAddressSelector(true)}
                    activeOpacity={0.7}
                    disabled={isLoading}
                >
                    <View style={styles.addressCardContent}>
                        {/* Location Icon */}
                        <View style={styles.addressIconContainer}>
                            <Ionicons name="location" size={20} color="#EE4D2D" />
                        </View>

                        {/* Address Info */}
                        {selectedAddressId && address ? (
                            <View style={styles.addressInfo}>
                                <View style={styles.addressNameRow}>
                                    <Text style={styles.addressName}>{fullName}</Text>
                                    <Text style={styles.addressDivider}>|</Text>
                                    <Text style={styles.addressPhone}>(+84) {phone?.replace(/^0/, "")}</Text>
                                </View>
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {address}
                                </Text>
                            </View>
                        ) : address ? (
                            <View style={styles.addressInfo}>
                                <View style={styles.addressNameRow}>
                                    <Text style={styles.addressName}>{fullName || "Người nhận"}</Text>
                                    {phone && (
                                        <>
                                            <Text style={styles.addressDivider}>|</Text>
                                            <Text style={styles.addressPhone}>(+84) {phone?.replace(/^0/, "")}</Text>
                                        </>
                                    )}
                                </View>
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {address}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.addressInfo}>
                                <Text style={styles.noAddressText}>Chọn địa chỉ giao hàng</Text>
                                <Text style={styles.noAddressHint}>Nhấn để chọn hoặc thêm địa chỉ mới</Text>
                            </View>
                        )}

                        {/* Arrow */}
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </View>
                    
                    {/* Quick Action Buttons */}
                    <View style={styles.addressQuickActions}>
                        <TouchableOpacity
                            style={styles.quickActionBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                setShowLocationPicker(true);
                            }}
                        >
                            <Ionicons name="map-outline" size={16} color="#5B9EE1" />
                            <Text style={styles.quickActionText}>Bản đồ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                setShowAddressSelector(true);
                            }}
                        >
                            <Ionicons name="book-outline" size={16} color="#5B9EE1" />
                            <Text style={styles.quickActionText}>Sổ địa chỉ</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Manual Entry Section (collapsed by default, expands if no saved address) */}
                {!selectedAddressId && (
                    <View style={[styles.card, styles.cardMargin]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="create-outline" size={18} color="#5B9EE1" />
                            <Text style={styles.cardHeaderText}>Nhập địa chỉ thủ công</Text>
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
                    </View>
                )}

                {/* Location Picker Modal */}
                <LocationPickerModal
                    visible={showLocationPicker}
                    onClose={() => setShowLocationPicker(false)}
                    onSelectAddress={(addr) => {
                        setAddress(addr);
                        setShowLocationPicker(false);
                        // Reset selected ID as this is a custom location
                        setSelectedAddressId(null);
                    }}
                    initialAddress={address}
                />
                
                {/* Address Selector Modal */}
                <AddressSelectorModal
                    visible={showAddressSelector}
                    onClose={() => setShowAddressSelector(false)}
                    addresses={savedAddresses}
                    selectedAddressId={selectedAddressId}
                    userId={user?.id}
                    onSelect={(addr) => {
                        fillAddress(addr);
                        setShowAddressSelector(false);
                    }}
                    onAddressCreated={loadSavedAddresses}
                />

                {/* Note Card */}
                <View style={[styles.card, styles.cardMargin]}>
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

                {/* Dual Voucher Section - ORDER + SHIPPING */}
                <View style={styles.cardMargin}>
                    <DualVoucherSection
                        orderAmount={subtotal}
                        shippingFee={shippingFee}
                        onOrderVoucherApplied={handleVoucherApplied}
                        onShippingVoucherApplied={handleShippingVoucherApplied}
                    />
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
                                method.isVNPay && paymentMethod === method.id && styles.paymentOptionVNPay,
                            ]}
                            onPress={() => setPaymentMethod(method.id)}
                            disabled={isLoading}
                        >
                            <View style={[
                                styles.paymentIconWrapper,
                                paymentMethod === method.id && styles.paymentIconWrapperActive,
                                method.isVNPay && paymentMethod === method.id && styles.paymentIconWrapperVNPay,
                            ]}>
                                <Ionicons
                                    name={method.icon as any}
                                    size={22}
                                    color={method.isVNPay && paymentMethod === method.id ? VNPAY_BLUE : (paymentMethod === method.id ? "#5B9EE1" : "#64748B")}
                                />
                            </View>
                            <View style={styles.paymentInfo}>
                                <Text style={[
                                    styles.paymentTitle,
                                    paymentMethod === method.id && styles.paymentTitleActive,
                                    method.isVNPay && paymentMethod === method.id && styles.paymentTitleVNPay,
                                ]}>
                                    {method.title}
                                </Text>
                                <Text style={styles.paymentDesc}>{method.desc}</Text>
                            </View>
                            <View style={[
                                styles.radioOuter,
                                paymentMethod === method.id && styles.radioOuterActive,
                                method.isVNPay && paymentMethod === method.id && styles.radioOuterVNPay,
                            ]}>
                                {paymentMethod === method.id && (
                                    <View style={[
                                        styles.radioInner,
                                        method.isVNPay && styles.radioInnerVNPay,
                                    ]} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* VNPay Info Message */}
                    {paymentMethod === 'vnpay' && (
                        <View style={styles.vnpayInfoBox}>
                            <MaterialCommunityIcons name="information-outline" size={18} color={VNPAY_BLUE} />
                            <Text style={styles.vnpayInfoText}>
                                {isWeb() 
                                    ? "Bạn sẽ được chuyển hướng đến trang VNPay trên trình duyệt. Sau khi thanh toán, vui lòng quay lại ứng dụng."
                                    : "Bạn sẽ được chuyển đến trang VNPay để hoàn tất thanh toán. Hỗ trợ thẻ ATM nội địa, Visa, MasterCard, JCB."
                                }
                            </Text>
                        </View>
                    )}
                </View>

                {/* Security Note */}
                <View style={styles.securityNoteContainer}>
                    <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
                    <Text style={styles.securityNoteBottomText}>
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
                        paymentMethod === 'vnpay' && styles.payButtonVNPay,
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
                                {paymentMethod === 'vnpay' ? 'Thanh toán VNPay' : 'Đặt hàng'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
            web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
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
            web: { boxShadow: '0 4px 12px rgba(91,158,225,0.08)' },
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

    // Address Label Row (with map button)
    addressLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    mapButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EBF4FF",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    mapButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#5B9EE1",
    },

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
    paymentOptionVNPay: {
        borderColor: VNPAY_BLUE,
        backgroundColor: VNPAY_LIGHT_BLUE,
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
    paymentIconWrapperVNPay: { backgroundColor: '#CCE0FF' },
    paymentInfo: { flex: 1 },
    paymentTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 2,
    },
    paymentTitleActive: { color: "#5B9EE1" },
    paymentTitleVNPay: { color: VNPAY_BLUE },
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
    radioOuterVNPay: { borderColor: VNPAY_BLUE },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#5B9EE1",
    },
    radioInnerVNPay: { backgroundColor: VNPAY_BLUE },

    // VNPay Info Box
    vnpayInfoBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: VNPAY_LIGHT_BLUE,
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        gap: 10,
    },
    vnpayInfoText: {
        flex: 1,
        fontSize: 13,
        color: VNPAY_BLUE,
        lineHeight: 18,
    },

    // Security Note
    securityNoteContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        gap: 8,
    },
    securityNoteBottomText: { fontSize: 12, color: "#64748B" },

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
            web: { boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' },
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
            web: { boxShadow: '0 4px 10px rgba(91,158,225,0.35)' },
        }),
    },
    payButtonVNPay: {
        backgroundColor: VNPAY_BLUE,
        ...Platform.select({
            ios: { shadowColor: VNPAY_BLUE },
            web: { boxShadow: '0 4px 10px rgba(0,102,204,0.35)' },
        }),
    },
    payButtonDisabled: { backgroundColor: "#A0C4E8" },
    payText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

    // Address Card - Shopee Style
    addressCard: {
        padding: 0,
        overflow: "hidden",
    },
    addressCardContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 16,
        gap: 12,
    },
    addressIconContainer: {
        marginTop: 2,
    },
    addressInfo: {
        flex: 1,
    },
    addressNameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
        flexWrap: "wrap",
    },
    addressName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F172A",
    },
    addressDivider: {
        marginHorizontal: 8,
        color: "#CBD5E1",
    },
    addressPhone: {
        fontSize: 14,
        color: "#64748B",
    },
    addressText: {
        fontSize: 13,
        color: "#475569",
        lineHeight: 18,
    },
    noAddressText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#EE4D2D",
    },
    noAddressHint: {
        fontSize: 13,
        color: "#94A3B8",
        marginTop: 2,
    },
    addressQuickActions: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    quickActionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 6,
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#5B9EE1",
    },
});
