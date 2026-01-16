/**
 * VoucherCard - Component hiển thị một voucher
 * =============================================
 * Card với thông tin voucher, nút copy mã
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Voucher, formatVoucherDiscount, isVoucherValid } from '../../services/voucherService';

// =================== TYPES =====================

interface VoucherCardProps {
    voucher: Voucher;
    onSelect?: (voucher: Voucher) => void;
    showSelectButton?: boolean;
    compact?: boolean;
}

// =================== HELPERS =====================

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

// =================== COMPONENT =====================

export function VoucherCard({ voucher, onSelect, showSelectButton = true, compact = false }: VoucherCardProps) {
    const isValid = isVoucherValid(voucher);
    const discountText = formatVoucherDiscount(voucher);

    // Copy mã voucher
    const handleCopy = async () => {
        try {
            await Clipboard.setStringAsync(voucher.code);
            Alert.alert('Đã sao chép', `Mã "${voucher.code}" đã được sao chép!`);
        } catch (error) {
            console.error('Error copying voucher code:', error);
        }
    };

    // Chọn voucher
    const handleSelect = () => {
        if (onSelect && isValid) {
            onSelect(voucher);
        }
    };

    return (
        <View style={[
            styles.container,
            !isValid && styles.containerDisabled,
            compact && styles.containerCompact,
        ]}>
            {/* Left: Discount Badge */}
            <View style={[styles.badge, !isValid && styles.badgeDisabled]}>
                <Ionicons
                    name="pricetag"
                    size={20}
                    color={isValid ? '#FFFFFF' : '#94A3B8'}
                />
                <Text style={[styles.badgeText, !isValid && styles.textDisabled]}>
                    {voucher.discountType === 'PERCENTAGE'
                        ? `${voucher.discount}%`
                        : formatPrice(voucher.discount)
                    }
                </Text>
            </View>

            {/* Center: Info */}
            <View style={styles.info}>
                {/* Code + Copy Button */}
                <View style={styles.codeRow}>
                    <Text style={[styles.code, !isValid && styles.textDisabled]}>
                        {voucher.code}
                    </Text>
                    <TouchableOpacity
                        style={styles.copyButton}
                        onPress={handleCopy}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="copy-outline" size={16} color="#5B9EE1" />
                    </TouchableOpacity>
                </View>

                {/* Discount Description */}
                <Text style={[styles.discountText, !isValid && styles.textDisabled]}>
                    {discountText}
                    {voucher.maxDiscountAmount > 0 && voucher.discountType === 'PERCENTAGE' && (
                        ` (tối đa ${formatPrice(voucher.maxDiscountAmount)})`
                    )}
                </Text>

                {/* Conditions */}
                {voucher.minOrderAmount > 0 && (
                    <View style={styles.conditionRow}>
                        <Ionicons name="cart-outline" size={12} color="#64748B" />
                        <Text style={styles.conditionText}>
                            Đơn tối thiểu: {formatPrice(voucher.minOrderAmount)}
                        </Text>
                    </View>
                )}

                {/* Expiry */}
                <View style={styles.conditionRow}>
                    <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={isValid ? '#64748B' : '#EF4444'}
                    />
                    <Text style={[
                        styles.conditionText,
                        !isValid && styles.expiredText
                    ]}>
                        {isValid ? `HSD: ${formatDate(voucher.expiryDate)}` : 'Đã hết hạn'}
                    </Text>
                </View>

                {/* Description */}
                {voucher.description && !compact && (
                    <Text style={styles.description} numberOfLines={2}>
                        {voucher.description}
                    </Text>
                )}
            </View>

            {/* Right: Select Button */}
            {showSelectButton && (
                <TouchableOpacity
                    style={[styles.selectButton, !isValid && styles.selectButtonDisabled]}
                    onPress={handleSelect}
                    disabled={!isValid}
                >
                    <Text style={[styles.selectButtonText, !isValid && styles.textDisabled]}>
                        {isValid ? 'Chọn' : 'Hết hạn'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    containerDisabled: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    containerCompact: {
        padding: 12,
        marginBottom: 8,
    },
    badge: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#5B9EE1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    badgeDisabled: {
        backgroundColor: '#E2E8F0',
    },
    badgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
        marginTop: 2,
    },
    info: {
        flex: 1,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    code: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
    copyButton: {
        marginLeft: 8,
        padding: 4,
    },
    discountText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '600',
        marginBottom: 6,
    },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    conditionText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
    },
    expiredText: {
        color: '#EF4444',
    },
    description: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        fontStyle: 'italic',
    },
    textDisabled: {
        color: '#94A3B8',
    },
    selectButton: {
        backgroundColor: '#5B9EE1',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        marginLeft: 12,
    },
    selectButtonDisabled: {
        backgroundColor: '#E2E8F0',
    },
    selectButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default VoucherCard;
