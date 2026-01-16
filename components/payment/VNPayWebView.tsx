/**
 * VNPay WebView Component
 * ========================
 * WebView for VNPay payment page
 * Handles payment URL navigation and success/failure detection
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

// =================== CONSTANTS =====================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VNPAY_BLUE = '#0066CC';
const VNPAY_LIGHT_BLUE = '#E6F0FF';

// =================== TYPES =====================

export interface VNPayWebViewProps {
    payUrl: string;
    orderId: number;
    amount: number;
    onSuccess: (orderId: number) => void;
    onFailure: (error: string) => void;
    onCancel: () => void;
}

// =================== COMPONENT =====================

const VNPayWebView: React.FC<VNPayWebViewProps> = ({
    payUrl,
    orderId,
    amount,
    onSuccess,
    onFailure,
    onCancel,
}) => {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Handle hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                Alert.alert(
                    'Hủy thanh toán?',
                    'Bạn có chắc muốn hủy thanh toán VNPay?',
                    [
                        { text: 'Tiếp tục thanh toán', style: 'cancel' },
                        { text: 'Hủy', onPress: onCancel },
                    ]
                );
                return true;
            }
        );

        return () => backHandler.remove();
    }, [onCancel]);

    /**
     * Handle WebView navigation state change
     * Detect success/failure URLs from backend redirect
     */
    const handleNavigationStateChange = (navState: { url: string }) => {
        const { url } = navState;
        console.log('🌐 [VNPay WebView] URL:', url);

        // SUCCESS: Backend redirects to /product/order-success
        if (url.includes('/product/order-success')) {
            console.log('✅ [VNPay WebView] Payment Success detected');
            onSuccess(orderId);
            return false;
        }

        // FAILURE: Backend redirects to /product/checkout with error
        if (url.includes('/product/checkout') && url.includes('error')) {
            console.log('❌ [VNPay WebView] Payment Failed detected');
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const errorMessage = urlParams.get('error') || 'Thanh toán thất bại';
            onFailure(decodeURIComponent(errorMessage));
            return false;
        }

        return true;
    };

    /**
     * Handle WebView error
     */
    const handleError = (syntheticEvent: { nativeEvent: { description: string } }) => {
        const { description } = syntheticEvent.nativeEvent;
        console.error('❌ [VNPay WebView] Error:', description);
        setError(description);
        setLoading(false);
    };

    /**
     * Format price for display
     */
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    };

    // Error state
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorTitle}>Không thể tải trang thanh toán</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => {
                    setError(null);
                    setLoading(true);
                    webViewRef.current?.reload();
                }}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Hủy thanh toán</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                    <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.vnpayIconContainer}>
                        <Ionicons name="card-outline" size={20} color={VNPAY_BLUE} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Thanh toán VNPay</Text>
                        <Text style={styles.headerAmount}>{formatPrice(amount)}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.securityBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                    </View>
                </View>
            </View>

            {/* Loading Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={VNPAY_BLUE} />
                    <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
                    <Text style={styles.loadingSubtext}>Vui lòng không tắt ứng dụng</Text>
                </View>
            )}

            {/* WebView */}
            <WebView
                ref={webViewRef}
                source={{ uri: payUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={handleError}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                style={styles.webView}
            />

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerContent}>
                    <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                    <Text style={styles.footerText}>
                        Đơn hàng #{orderId} • Giao dịch được bảo mật bởi VNPay
                    </Text>
                </View>
            </View>
        </View>
    );
};

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
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
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
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 12,
    },
    vnpayIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: VNPAY_LIGHT_BLUE,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    headerAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: VNPAY_BLUE,
    },
    headerRight: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    securityBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    webView: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    loadingSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
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
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 16,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 24,
        paddingVertical: 14,
        paddingHorizontal: 32,
        backgroundColor: VNPAY_BLUE,
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cancelButton: {
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#64748B',
    },
});

export default VNPayWebView;
