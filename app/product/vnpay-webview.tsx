/**
 * VNPay WebView Screen (Native Only)
 * ===================================
 * Full-screen WebView for VNPay payment
 * ONLY renders on iOS/Android - NOT on Web
 * 
 * This screen should be navigated to from checkout
 * when Platform.OS !== 'web'
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Only import WebView on native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').default;
}

// =================== CONSTANTS =====================

const VNPAY_BLUE = '#0066CC';
const SUCCESS_PATTERNS = ['/product/order-success', 'vnp_ResponseCode=00'];
const FAIL_PATTERNS = ['/product/checkout?error'];

// =================== TYPES =====================

interface WebViewNavState {
    url: string;
    title?: string;
    loading?: boolean;
    canGoBack?: boolean;
    canGoForward?: boolean;
}

// =================== COMPONENT =====================

export default function VNPayWebViewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        paymentUrl?: string;
        orderId?: string;
        amount?: string;
        customerName?: string;
    }>();

    const webViewRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState<string>('');

    // Parse params
    const paymentUrl = params.paymentUrl || '';
    const orderId = params.orderId || '';
    const amount = params.amount ? parseInt(params.amount, 10) : 0;
    const customerName = params.customerName || '';

    // =================== EFFECTS =====================

    // Handle Android back button
    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            showCancelConfirmation();
            return true;
        });

        return () => backHandler.remove();
    }, []);

    // Web platform: redirect to VNPay URL directly
    useEffect(() => {
        if (Platform.OS === 'web' && paymentUrl) {
            // Small delay to allow the component to mount
            const timer = setTimeout(() => {
                window.location.href = paymentUrl;
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [paymentUrl]);

    // =================== HANDLERS =====================

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    };

    const showCancelConfirmation = () => {
        Alert.alert(
            'Hủy thanh toán?',
            'Bạn có chắc muốn hủy giao dịch thanh toán VNPay?',
            [
                { text: 'Tiếp tục thanh toán', style: 'cancel' },
                { 
                    text: 'Hủy thanh toán', 
                    style: 'destructive',
                    onPress: handleCancel
                },
            ]
        );
    };

    const handleCancel = () => {
        // Navigate to payment-pending screen instead of going back
        // This allows the order to stay in PENDING status
        router.replace({
            pathname: '/product/payment-pending',
            params: {
                orderId,
                amount: amount.toString(),
                customerName,
                paymentMethod: 'vnpay',
            },
        });
    };

    const handlePaymentSuccess = () => {
        console.log('✅ [VNPayWebView] Payment success detected');
        
        // Navigate to success screen
        router.replace({
            pathname: '/product/order-success',
            params: {
                orderId,
                total: amount.toString(),
                name: customerName,
                paymentMethod: 'vnpay',
                status: 'success',
            },
        });
    };

    const handlePaymentFailure = (errorMessage?: string) => {
        console.log('❌ [VNPayWebView] Payment failure detected:', errorMessage);
        
        Alert.alert(
            'Thanh toán thất bại',
            errorMessage || 'Giao dịch không thành công. Vui lòng thử lại.',
            [
                {
                    text: 'Quay lại',
                    onPress: () => router.back(),
                },
            ]
        );
    };

    const handleNavigationStateChange = (navState: WebViewNavState) => {
        const { url } = navState;
        setCurrentUrl(url);
        console.log('🌐 [VNPayWebView] Navigation:', url);

        // Check for success URL
        if (SUCCESS_PATTERNS.some(pattern => url.includes(pattern))) {
            handlePaymentSuccess();
            return false;
        }

        // Check for failure URL
        if (FAIL_PATTERNS.some(pattern => url.includes(pattern))) {
            // Extract error message from URL if available
            try {
                const urlObj = new URL(url);
                const errorMsg = urlObj.searchParams.get('error');
                handlePaymentFailure(errorMsg ? decodeURIComponent(errorMsg) : undefined);
            } catch {
                handlePaymentFailure();
            }
            return false;
        }

        return true;
    };

    const handleWebViewError = (syntheticEvent: any) => {
        const { nativeEvent } = syntheticEvent;
        console.error('❌ [VNPayWebView] Error:', nativeEvent.description);
        setError(nativeEvent.description || 'Không thể tải trang thanh toán');
        setLoading(false);
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        webViewRef.current?.reload();
    };

    // =================== RENDER =====================

    // Web platform guard - show redirect message
    if (Platform.OS === 'web') {
        return (
            <View style={styles.errorContainer}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.errorTitle}>Đang chuyển hướng...</Text>
                <Text style={styles.errorMessage}>
                    Bạn sẽ được chuyển đến trang thanh toán VNPay.
                    Nếu không tự động chuyển, vui lòng nhấn nút bên dưới.
                </Text>
                <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={() => {
                        if (paymentUrl) window.location.href = paymentUrl;
                    }}
                >
                    <Text style={styles.retryButtonText}>Đến trang thanh toán</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
                    <Text style={styles.cancelLinkText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No payment URL
    if (!paymentUrl) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={64} color="#EF4444" />
                <Text style={styles.errorTitle}>Lỗi thanh toán</Text>
                <Text style={styles.errorMessage}>
                    Không tìm thấy liên kết thanh toán. Vui lòng thử lại.
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="wifi-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Không thể kết nối</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
                        <Text style={styles.cancelLinkText}>Hủy thanh toán</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={showCancelConfirmation}
                >
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                
                <View style={styles.headerCenter}>
                    <View style={styles.vnpayBadge}>
                        <Ionicons name="card" size={16} color={VNPAY_BLUE} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>VNPay</Text>
                        {amount > 0 && (
                            <Text style={styles.headerAmount}>{formatPrice(amount)}</Text>
                        )}
                    </View>
                </View>
                
                <View style={styles.securityBadge}>
                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                </View>
            </View>

            {/* WebView */}
            <View style={styles.webViewContainer}>
                {WebView && (
                    <WebView
                        ref={webViewRef}
                        source={{ uri: paymentUrl }}
                        style={styles.webView}
                        onNavigationStateChange={handleNavigationStateChange}
                        onLoadStart={() => setLoading(true)}
                        onLoadEnd={() => setLoading(false)}
                        onError={handleWebViewError}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        scalesPageToFit={true}
                        allowsBackForwardNavigationGestures={true}
                        sharedCookiesEnabled={true}
                    />
                )}

                {/* Loading Overlay */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={VNPAY_BLUE} />
                        <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
                        <Text style={styles.loadingSubtext}>Vui lòng không tắt ứng dụng</Text>
                    </View>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerContent}>
                    <Ionicons name="lock-closed" size={14} color="#64748B" />
                    <Text style={styles.footerText}>
                        Giao dịch được bảo mật bởi VNPay
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 12,
    },
    vnpayBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#E6F0FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    headerAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: VNPAY_BLUE,
    },
    securityBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    loadingSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
    },
    footer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: '#64748B',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        paddingVertical: 14,
        paddingHorizontal: 32,
        backgroundColor: VNPAY_BLUE,
        borderRadius: 12,
        gap: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cancelLink: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    cancelLinkText: {
        fontSize: 14,
        color: '#6B7280',
    },
    backButton: {
        marginTop: 24,
        paddingVertical: 14,
        paddingHorizontal: 32,
        backgroundColor: '#6B7280',
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
