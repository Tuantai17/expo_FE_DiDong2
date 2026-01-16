/**
 * ReviewSummaryCard - Hiển thị tổng hợp đánh giá sản phẩm
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { ReviewSummary } from '../../services/reviewService';
import StarRating from './StarRating';

interface ReviewSummaryCardProps {
    summary: ReviewSummary | null;
    loading?: boolean;
}

export function ReviewSummaryCard({ summary, loading }: ReviewSummaryCardProps) {
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingPlaceholder} />
            </View>
        );
    }

    if (!summary) {
        return null;
    }

    const { avgRating, reviewCount, starCounts } = summary;

    // Tính phần trăm cho từng sao
    const getPercentage = (count: number) => {
        if (reviewCount === 0) return 0;
        return (count / reviewCount) * 100;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="star" size={20} color="#FBBF24" />
                <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
            </View>

            <View style={styles.content}>
                {/* Left: Average Rating */}
                <View style={styles.avgSection}>
                    <Text style={styles.avgRating}>{avgRating.toFixed(1)}</Text>
                    <StarRating rating={avgRating} size={16} />
                    <Text style={styles.reviewCount}>{reviewCount} đánh giá</Text>
                </View>

                {/* Right: Star Distribution */}
                <View style={styles.distributionSection}>
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = starCounts[star as keyof typeof starCounts] || 0;
                        const percentage = getPercentage(count);

                        return (
                            <View key={star} style={styles.barRow}>
                                <Text style={styles.starLabel}>{star}</Text>
                                <Ionicons name="star" size={12} color="#FBBF24" />
                                <View style={styles.barBackground}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            { width: `${percentage}%` },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.countLabel}>{count}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
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
    loadingPlaceholder: {
        height: 120,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginLeft: 8,
    },
    content: {
        flexDirection: 'row',
    },
    avgSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 16,
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
    },
    avgRating: {
        fontSize: 40,
        fontWeight: '700',
        color: '#0F172A',
    },
    reviewCount: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    distributionSection: {
        flex: 2,
        paddingLeft: 16,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    starLabel: {
        fontSize: 12,
        color: '#64748B',
        width: 12,
        textAlign: 'center',
    },
    barBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#FBBF24',
        borderRadius: 4,
    },
    countLabel: {
        fontSize: 12,
        color: '#64748B',
        width: 24,
        textAlign: 'right',
    },
});

export default ReviewSummaryCard;
