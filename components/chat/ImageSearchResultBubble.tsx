/**
 * ImageSearchResultBubble - Chat bubble hiển thị kết quả phân tích ảnh
 * Bao gồm: ảnh đã upload, analysis info, và danh sách sản phẩm gợi ý
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    ToastAndroid,
    View,
} from 'react-native';
import { addToCartApi } from '../../services/api';
import type { ImageSearchResult, SuggestedProduct } from '../../types/chatImage';
import ProductSuggestionCard from './ProductSuggestionCard';

interface ImageSearchResultBubbleProps {
  result: ImageSearchResult;
  userId: number;
  onCartUpdate?: () => void;
}

export default function ImageSearchResultBubble({
  result,
  userId,
  onCartUpdate,
}: ImageSearchResultBubbleProps) {
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

  const getImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };

  const handleAddToCart = async (product: SuggestedProduct) => {
    try {
      setAddingProductId(product.productId);
      
      console.log('[Chat] Adding to cart:', product.name);
      
      await addToCartApi({
        userId: userId,
        productId: product.productId,
        quantity: 1,
        productPrice: product.price,
        discount: 0,
      });

      ToastAndroid.show(
        `✅ Đã thêm ${product.name} vào giỏ hàng!`,
        ToastAndroid.SHORT
      );

      // Trigger cart refresh
      onCartUpdate?.();
    } catch (error: any) {
      console.error('[Chat] Add to cart failed:', error);
      ToastAndroid.show(
        '❌ Không thể thêm vào giỏ hàng. Vui lòng thử lại!',
        ToastAndroid.LONG
      );
    } finally {
      setAddingProductId(null);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#10B981';
    if (confidence >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  const { analysis, suggestedProducts, chatMessage } = result;

  return (
    <View style={styles.container}>
      {/* Uploaded Image */}
      <View style={styles.uploadedImageContainer}>
        <Image
          source={{ uri: getImageUrl(result.imageUrl) }}
          style={styles.uploadedImage}
          resizeMode="cover"
        />
      </View>

      {/* Analysis Info */}
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>
          <Ionicons name="scan-outline" size={18} color="#5B9EE1" />
          <Text style={styles.analysisTitle}>Kết quả phân tích</Text>
        </View>

        {/* Detected Product */}
        {analysis.detectedProduct && (
          <View style={styles.analysisRow}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.analysisText}>{analysis.detectedProduct}</Text>
          </View>
        )}

        {/* Confidence */}
        <View style={styles.analysisRow}>
          <Ionicons 
            name="speedometer-outline" 
            size={16} 
            color={getConfidenceColor(analysis.confidence)} 
          />
          <Text style={styles.analysisText}>
            Độ chính xác: {' '}
            <Text style={{ color: getConfidenceColor(analysis.confidence), fontWeight: '600' }}>
              {Math.round(analysis.confidence * 100)}%
            </Text>
          </Text>
        </View>

        {/* Keywords */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <View style={styles.keywordsContainer}>
            {analysis.keywords.slice(0, 5).map((keyword, index) => (
              <View key={index} style={styles.keywordChip}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Chat Message */}
      <Text style={styles.chatMessage}>{chatMessage}</Text>

      {/* Suggested Products */}
      {suggestedProducts && suggestedProducts.length > 0 && (
        <View style={styles.productsSection}>
          <View style={styles.productsSectionHeader}>
            <Ionicons name="sparkles" size={18} color="#F59E0B" />
            <Text style={styles.productsSectionTitle}>
              {suggestedProducts.length} sản phẩm tương tự
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScrollContent}
          >
            {suggestedProducts.map((product) => (
              <ProductSuggestionCard
                key={product.productId}
                product={product}
                onAddToCart={handleAddToCart}
                isAdding={addingProductId === product.productId}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* No Products Found */}
      {(!suggestedProducts || suggestedProducts.length === 0) && (
        <View style={styles.noProductsContainer}>
          <Ionicons name="search-outline" size={32} color="#CBD5E1" />
          <Text style={styles.noProductsText}>
            Chưa tìm thấy sản phẩm tương tự
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadedImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  analysisContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  analysisText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  keywordChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  chatMessage: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 16,
  },
  productsSection: {
    marginTop: 8,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  productsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  productsScrollContent: {
    paddingRight: 16,
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noProductsText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
});
