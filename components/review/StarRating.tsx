/**
 * StarRating - Component hiển thị và chọn sao đánh giá
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    color?: string;
    emptyColor?: string;
    editable?: boolean;
    onRatingChange?: (rating: number) => void;
}

export function StarRating({
    rating,
    maxRating = 5,
    size = 20,
    color = '#FBBF24',
    emptyColor = '#E2E8F0',
    editable = false,
    onRatingChange,
}: StarRatingProps) {
    const handlePress = (index: number) => {
        if (editable && onRatingChange) {
            onRatingChange(index + 1);
        }
    };

    return (
        <View style={styles.container}>
            {Array.from({ length: maxRating }, (_, index) => {
                const isFilled = index < rating;
                const isHalf = index === Math.floor(rating) && rating % 1 >= 0.5;

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handlePress(index)}
                        disabled={!editable}
                        activeOpacity={editable ? 0.7 : 1}
                        style={styles.star}
                    >
                        <Ionicons
                            name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                            size={size}
                            color={isFilled || isHalf ? color : emptyColor}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        marginHorizontal: 2,
    },
});

export default StarRating;
