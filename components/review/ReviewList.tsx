/**
 * ReviewList - Danh sách đánh giá với pagination
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Review, reviewService } from '../../services/reviewService';
import ReviewItem from './ReviewItem';

interface ReviewListProps {
    productId: number;
    onReviewCountUpdated?: (count: number) => void;
}

export function ReviewList({ productId, onReviewCountUpdated }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const PAGE_SIZE = 5;

    useEffect(() => {
        loadReviews(0, true);
    }, [productId]);

    const loadReviews = async (pageNum: number, reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setError(null);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = await reviewService.getProductReviews(productId, pageNum, PAGE_SIZE);
            
            if (reset) {
                setReviews(response.data);
            } else {
                setReviews((prev) => [...prev, ...response.data]);
            }

            setPage(pageNum);
            setHasMore(pageNum < response.totalPages - 1);

            if (onReviewCountUpdated && reset) {
                onReviewCountUpdated(response.totalElements);
            }
        } catch (err: any) {
            console.error('Error loading reviews:', err);
            setError('Không thể tải đánh giá');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            loadReviews(page + 1);
        }
    };

    const handleRefresh = () => {
        loadReviews(0, true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B9EE1" />
                <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (reviews.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Chưa có đánh giá</Text>
                <Text style={styles.emptyText}>
                    Hãy là người đầu tiên đánh giá sản phẩm này!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={reviews}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <ReviewItem review={item} />}
                scrollEnabled={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() =>
                    loadingMore ? (
                        <View style={styles.loadMoreContainer}>
                            <ActivityIndicator size="small" color="#5B9EE1" />
                            <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
                        </View>
                    ) : hasMore ? (
                        <TouchableOpacity
                            style={styles.loadMoreButton}
                            onPress={handleLoadMore}
                        >
                            <Text style={styles.loadMoreButtonText}>Xem thêm đánh giá</Text>
                        </TouchableOpacity>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
    },
    errorContainer: {
        padding: 40,
        alignItems: 'center',
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        color: '#EF4444',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#5B9EE1',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    emptyText: {
        marginTop: 4,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    loadMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadMoreText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#64748B',
    },
    loadMoreButton: {
        alignItems: 'center',
        padding: 16,
    },
    loadMoreButtonText: {
        fontSize: 14,
        color: '#5B9EE1',
        fontWeight: '600',
    },
});

export default ReviewList;
