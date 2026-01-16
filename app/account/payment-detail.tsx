/**
 * Payment Detail Screen
 * Màn hình chi tiết thanh toán
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../../services/api';
import {
    formatCurrency,
    formatDateTime,
    getGatewayDisplayName,
    getMyPaymentDetail,
    getStatusColor,
    OrderItemSummary,
    PaymentDetail,
} from '../../services/paymentHistoryService';

// ==================== COMPONENT ====================

export default function PaymentDetailScreen() {
    const router = useRouter();
    const { paymentId } = useLocalSearchParams<{ paymentId: string }>();

    // State
    const [payment, setPayment] = useState<PaymentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ==================== DATA FETCHING ====================

    useEffect(() => {
        if (paymentId) {
            fetchPaymentDetail();
        }
    }, [paymentId]);

    const fetchPaymentDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            const detail = await getMyPaymentDetail(parseInt(paymentId!, 10));
            setPayment(detail);

        } catch (err: any) {
            console.error('Error fetching payment detail:', err);
            if (err.response?.status === 403) {
                setError('Bạn không có quyền xem thông tin thanh toán này');
            } else if (err.response?.status === 404) {
                setError('Không tìm thấy thông tin thanh toán');
            } else {
                setError(err.response?.data?.message || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    // ==================== RENDER FUNCTIONS ====================

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết thanh toán</Text>
            <View style={styles.headerRight} />
        </View>
    );

    const renderPaymentInfo = () => {
        if (!payment) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>

                {/* Status */}
                <View style={styles.statusContainer}>
                    <View style={[
                        styles.statusBadgeLarge,
                        { backgroundColor: getStatusColor(payment.status) + '20' }
                    ]}>
                        <Ionicons
                            name={getStatusIcon(payment.status)}
                            size={32}
                            color={getStatusColor(payment.status)}
                        />
                        <Text style={[
                            styles.statusTextLarge,
                            { color: getStatusColor(payment.status) }
                        ]}>
                            {payment.statusDisplay}
                        </Text>
                    </View>
                </View>

                {/* Payment details */}
                <View style={styles.infoCard}>
                    <InfoRow 
                        label="Mã đơn hàng" 
                        value={`#${payment.orderCode || payment.orderId}`} 
                    />
                    <InfoRow 
                        label="Phương thức" 
                        value={getGatewayDisplayName(payment.paymentGateway)} 
                    />
                    <InfoRow 
                        label="Số tiền" 
                        value={formatCurrency(payment.amount)} 
                        valueStyle={styles.amountText}
                    />
                    <InfoRow 
                        label="Thời gian" 
                        value={formatDateTime(payment.paidAt || payment.createdAt)} 
                    />
                    {payment.transactionId && (
                        <InfoRow 
                            label="Mã giao dịch" 
                            value={payment.transactionId} 
                        />
                    )}
                </View>
            </View>
        );
    };

    const renderOrderInfo = () => {
        if (!payment) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>

                <View style={styles.infoCard}>
                    {payment.shippingName && (
                        <InfoRow label="Người nhận" value={payment.shippingName} />
                    )}
                    {payment.shippingPhone && (
                        <InfoRow label="Số điện thoại" value={payment.shippingPhone} />
                    )}
                    {payment.shippingAddress && (
                        <InfoRow label="Địa chỉ" value={payment.shippingAddress} />
                    )}
                    <InfoRow 
                        label="Phí vận chuyển" 
                        value={formatCurrency(payment.shippingFee || 0)} 
                    />
                    {payment.discountAmount && payment.discountAmount > 0 && (
                        <InfoRow 
                            label="Giảm giá" 
                            value={`-${formatCurrency(payment.discountAmount)}`} 
                            valueStyle={styles.discountText}
                        />
                    )}
                    <InfoRow 
                        label="Tổng cộng" 
                        value={formatCurrency(payment.totalAmount || payment.amount)} 
                        valueStyle={styles.totalText}
                    />
                </View>
            </View>
        );
    };

    const renderOrderItems = () => {
        if (!payment || !payment.orderItems || payment.orderItems.length === 0) {
            return null;
        }

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Sản phẩm ({payment.orderItems.length})
                </Text>

                {payment.orderItems.map((item) => (
                    <OrderItemCard key={item.id} item={item} />
                ))}
            </View>
        );
    };

    const renderError = () => (
        <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchPaymentDetail}
            >
                <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
        </View>
    );

    // ==================== MAIN RENDER ====================

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {renderHeader()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : error ? (
                renderError()
            ) : (
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {renderPaymentInfo()}
                    {renderOrderInfo()}
                    {renderOrderItems()}
                    <View style={styles.bottomSpacer} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ==================== SUB COMPONENTS ====================

interface InfoRowProps {
    label: string;
    value: string;
    valueStyle?: object;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueStyle }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
);

interface OrderItemCardProps {
    item: OrderItemSummary;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item }) => {
    const imageUrl = item.productImage
        ? item.productImage.startsWith('http')
            ? item.productImage
            : `${BASE_URL}/images/${item.productImage}`
        : null;

    return (
        <View style={styles.orderItemCard}>
            <View style={styles.itemImageContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                ) : (
                    <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                    </View>
                )}
            </View>

            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.productTitle || 'Sản phẩm'}
                </Text>

                <View style={styles.itemMeta}>
                    {item.color && (
                        <Text style={styles.itemMetaText}>Màu: {item.color}</Text>
                    )}
                    {item.sizeValue && (
                        <Text style={styles.itemMetaText}>Size: {item.sizeValue}</Text>
                    )}
                </View>

                <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>
                        {formatCurrency(item.price)} x {item.quantity}
                    </Text>
                    <Text style={styles.itemSubtotal}>
                        {formatCurrency(item.subtotal)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

// ==================== HELPERS ====================

const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
        case 'SUCCESS':
            return 'checkmark-circle';
        case 'FAILED':
        case 'CANCELLED':
            return 'close-circle';
        case 'PENDING':
        case 'PROCESSING':
            return 'time';
        case 'REFUNDED':
            return 'refresh-circle';
        default:
            return 'help-circle';
    }
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 16,
    },
    statusTextLarge: {
        fontSize: 20,
        fontWeight: '700',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6366F1',
    },
    discountText: {
        color: '#10B981',
    },
    totalText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    orderItemCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    itemImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    itemImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    itemImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    itemMeta: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    itemMetaText: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemPrice: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemSubtotal: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
    },
    retryButton: {
        marginTop: 24,
        backgroundColor: '#6366F1',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 40,
    },
});
