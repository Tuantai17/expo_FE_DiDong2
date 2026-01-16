/**
 * Product Reviews Section Component
 * Displays review summary and list for a product
 * Includes admin reply display
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { getImageUrl } from '../../services/api';
import type { Review, ReviewSummary } from '../../services/reviewService';
import { reviewService } from '../../services/reviewService';

interface Props {
    productId: number;
}

const ProductReviewsSection: React.FC<Props> = ({ productId }) => {
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        loadData();
    }, [productId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [summaryData, reviewsData] = await Promise.all([
                reviewService.getReviewSummary(productId),
                reviewService.getProductReviews(productId, 0, 10),
            ]);
            
            setSummary(summaryData);
            setReviews(reviewsData.data);
            setHasMore(reviewsData.totalPages > 1);
            setPage(0);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!hasMore || loading || loadingMore) return;
        
        try {
            setLoadingMore(true);
            const nextPage = page + 1;
            const data = await reviewService.getProductReviews(productId, nextPage, 10);
            setReviews(prev => [...prev, ...data.data]);
            setPage(nextPage);
            setHasMore(nextPage < data.totalPages - 1);
        } catch (error) {
            console.error('Error loading more reviews:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={16}
                        color="#FFA500"
                    />
                ))}
            </View>
        );
    };

    const renderReview = ({ item }: { item: Review }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {item.userName?.[0]?.toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.userName}</Text>
                        <Text style={styles.reviewDate}>
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                </View>
                {renderStars(item.rating)}
            </View>

            {item.comment && (
                <Text style={styles.comment}>{item.comment}</Text>
            )}

            {item.images && item.images.length > 0 && (
                <View style={styles.reviewImages}>
                    {item.images.map((img, idx) => (
                        <Image
                            key={idx}
                            source={{ uri: getImageUrl(img) }}
                            style={styles.reviewImage}
                            resizeMode="cover"
                        />
                    ))}
                </View>
            )}

            {item.adminReply && (
                <View style={styles.adminReply}>
                    <View style={styles.adminReplyHeader}>
                        <Ionicons name="storefront" size={14} color="#5B9EE1" />
                        <Text style={styles.adminReplyLabel}>Phản hồi từ Shop</Text>
                    </View>
                    <Text style={styles.adminReplyText}>{item.adminReply}</Text>
                    {item.adminReplyAt && (
                        <Text style={styles.adminReplyDate}>
                            {new Date(item.adminReplyAt).toLocaleDateString('vi-VN')}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#5B9EE1" />
                <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
            </View>
        );
    }

    if (!summary || summary.reviewCount === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="star-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
                <Text style={styles.emptySubtext}>
                    Hãy là người đầu tiên đánh giá sản phẩm này!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Summary Section */}
            <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.ratingBox}>
                        <Text style={styles.avgRating}>
                            {summary.avgRating.toFixed(1)}
                        </Text>
                        {renderStars(Math.round(summary.avgRating))}
                        <Text style={styles.reviewCount}>
                            {summary.reviewCount} đánh giá
                        </Text>
                    </View>
                    
                    <View style={styles.starDistribution}>
                        {[5, 4, 3, 2, 1].map((star) => (
                            <View key={star} style={styles.starRow}>
                                <Text style={styles.starLabel}>{star} ⭐</Text>
                                <View style={styles.barContainer}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                width: `${
                                                    summary.reviewCount > 0
                                                        ? ((summary.starCounts[star] || 0) /
                                                              summary.reviewCount) *
                                                          100
                                                        : 0
                                                }%`,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.starCount}>
                                    {summary.starCounts[star] || 0}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Reviews List */}
            <View style={styles.reviewsSection}>
                <Text style={styles.reviewsTitle}>
                    Đánh giá gần đây ({reviews.length})
                </Text>
                <FlatList
                    data={reviews}
                    renderItem={renderReview}
                    keyExtractor={(item) => item.id.toString()}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    scrollEnabled={false}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator size="small" color="#5B9EE1" style={{ marginVertical: 16 }} />
                        ) : null
                    }
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f8f9fa',
    },
    loading: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1a1a1a',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 24,
    },
    ratingBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 24,
        borderRightWidth: 1,
        borderRightColor: '#e8e8e8',
        minWidth: 120,
    },
    avgRating: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFA500',
        lineHeight: 56,
    },
    stars: {
        flexDirection: 'row',
        marginVertical: 8,
        gap: 2,
    },
    reviewCount: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    starDistribution: {
        flex: 1,
        gap: 8,
        justifyContent: 'center',
    },
    starRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    starLabel: {
        width: 40,
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    barContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: '#FFA500',
        borderRadius: 4,
    },
    starCount: {
        width: 32,
        fontSize: 13,
        color: '#666',
        textAlign: 'right',
    },
    reviewsSection: {
        marginTop: 8,
    },
    reviewsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#5B9EE1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    comment: {
        fontSize: 14,
        color: '#333',
        lineHeight: 22,
        marginBottom: 12,
    },
    reviewImages: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    reviewImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    adminReply: {
        backgroundColor: '#f0f7ff',
        borderLeftWidth: 3,
        borderLeftColor: '#5B9EE1',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    adminReplyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    adminReplyLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5B9EE1',
    },
    adminReplyText: {
        fontSize: 14,
        color: '#1a1a1a',
        lineHeight: 20,
    },
    adminReplyDate: {
        fontSize: 11,
        color: '#999',
        marginTop: 6,
    },
});

export default ProductReviewsSection;
