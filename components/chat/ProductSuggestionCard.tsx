/**
 * ProductSuggestionCard - Card hiển thị sản phẩm gợi ý trong chat
 * Sử dụng sau khi upload ảnh và nhận được kết quả từ Gemini Vision
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { SuggestedProduct } from '../../types/chatImage';

interface ProductSuggestionCardProps {
  product: SuggestedProduct;
  onAddToCart: (product: SuggestedProduct) => void | Promise<void>;
  isAdding?: boolean;
}

export default function ProductSuggestionCard({
  product,
  onAddToCart,
  isAdding = false,
}: ProductSuggestionCardProps) {
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  const getImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    // Assume BASE_URL is localhost:8080 for development
    return `http://localhost:8080${imageUrl}`;
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 0.8) return '#10B981'; // green
    if (score >= 0.6) return '#F59E0B'; // amber
    return '#6B7280'; // gray
  };

  const getSimilarityLabel = (score: number): string => {
    if (score >= 0.8) return 'Rất giống';
    if (score >= 0.6) return 'Khá giống';
    return 'Tương tự';
  };

  return (
    <View style={styles.card}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image
            source={{ uri: getImageUrl(product.imageUrl) }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color="#CBD5E1" />
          </View>
        )}
        
        {/* Similarity Score Badge */}
        <View 
          style={[
            styles.similarityBadge, 
            { backgroundColor: getSimilarityColor(product.similarityScore) }
          ]}
        >
          <Text style={styles.similarityText}>
            {getSimilarityLabel(product.similarityScore)}
          </Text>
          <Text style={styles.similarityScore}>
            {Math.round(product.similarityScore * 100)}%
          </Text>
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        {/* Brand */}
        {product.brand && (
          <Text style={styles.brandText}>{product.brand}</Text>
        )}
        
        {/* Product Name */}
        <Text style={styles.nameText} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Category */}
        {product.category && (
          <Text style={styles.categoryText}>{product.category}</Text>
        )}

        {/* Price */}
        <Text style={styles.priceText}>{formatPrice(product.price)}</Text>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddToCart(product)}
          disabled={isAdding}
          activeOpacity={0.7}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  similarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  similarityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  similarityScore: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoContainer: {
    padding: 12,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 18,
  },
  categoryText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5B9EE1',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B9EE1',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
