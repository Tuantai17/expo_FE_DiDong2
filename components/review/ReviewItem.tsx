/**
 * ReviewItem - Hiển thị một đánh giá
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../../config/api.config';
import { Review } from '../../services/reviewService';
import StarRating from './StarRating';

interface ReviewItemProps {
    review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <View style={styles.container}>
            {/* Header: User info */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    {review.userAvatar ? (
                        <Image
                            source={{ uri: `${API_BASE_URL}${review.userAvatar}` }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Ionicons name="person-circle" size={40} color="#CBD5E1" />
                    )}
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{review.userName}</Text>
                    <View style={styles.ratingRow}>
                        <StarRating rating={review.rating} size={14} />
                        <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
                    </View>
                </View>
            </View>

            {/* Comment */}
            {review.comment && (
                <Text style={styles.comment}>{review.comment}</Text>
            )}

            {/* Admin Response */}
            {review.adminReply && (
                <View style={styles.adminResponse}>
                    <View style={styles.adminResponseHeader}>
                        <Ionicons name="storefront" size={14} color="#5B9EE1" />
                        <Text style={styles.adminResponseLabel}>Phản hồi từ shop</Text>
                    </View>
                    <Text style={styles.adminResponseText}>{review.adminReply}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
            },
            android: {
                elevation: 1,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        marginRight: 12,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        fontSize: 12,
        color: '#94A3B8',
        marginLeft: 8,
    },
    comment: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    adminResponse: {
        marginTop: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#5B9EE1',
    },
    adminResponseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    adminResponseLabel: {
        fontSize: 12,
        color: '#5B9EE1',
        fontWeight: '600',
        marginLeft: 4,
    },
    adminResponseText: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
});

export default ReviewItem;
