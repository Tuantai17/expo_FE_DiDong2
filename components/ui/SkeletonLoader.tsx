/**
 * SkeletonLoader Component
 * ========================
 * Provides skeleton loading placeholders for better UX
 * Uses react-native-reanimated for smooth shimmer effect
 */

import React, { useEffect } from "react";
import {
    StyleSheet,
    View,
    ViewStyle
} from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

// =================== TYPES =====================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface ProductCardSkeletonProps {
  count?: number;
}

// =================== BASE SKELETON =====================

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

// =================== PRODUCT CARD SKELETON =====================

export const ProductCardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.productCard, style]}>
      {/* Image placeholder */}
      <Skeleton width="100%" height={140} borderRadius={16} />

      {/* Content */}
      <View style={styles.productCardContent}>
        {/* Brand */}
        <Skeleton width={60} height={10} style={styles.mb8} />
        
        {/* Title */}
        <Skeleton width="90%" height={14} style={styles.mb4} />
        <Skeleton width="60%" height={14} style={styles.mb12} />
        
        {/* Price row */}
        <View style={styles.priceRow}>
          <Skeleton width={80} height={18} />
          <Skeleton width={32} height={32} borderRadius={10} />
        </View>
      </View>
    </View>
  );
};

// =================== PRODUCT LIST SKELETON =====================

export const ProductListSkeleton: React.FC<ProductCardSkeletonProps> = ({
  count = 4,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const PADDING = 16;
  const GAP = 12;
  const cardWidth = (screenWidth - PADDING * 2 - GAP) / 2;

  return (
    <View style={styles.productList}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton
          key={index}
          style={{ width: cardWidth, marginBottom: GAP }}
        />
      ))}
    </View>
  );
};

// =================== CART ITEM SKELETON =====================

export const CartItemSkeleton: React.FC = () => {
  return (
    <View style={styles.cartItem}>
      {/* Image */}
      <Skeleton width={80} height={80} borderRadius={14} />

      {/* Content */}
      <View style={styles.cartItemContent}>
        <Skeleton width="80%" height={14} style={styles.mb4} />
        <Skeleton width={50} height={12} style={styles.mb8} />
        
        <View style={styles.cartItemRow}>
          <Skeleton width={80} height={16} />
          <View style={styles.qtyRow}>
            <Skeleton width={30} height={30} borderRadius={8} />
            <Skeleton width={20} height={16} style={styles.mx8} />
            <Skeleton width={30} height={30} borderRadius={8} />
          </View>
        </View>
      </View>
    </View>
  );
};

// =================== PRODUCT DETAIL SKELETON =====================

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.productDetail}>
      {/* Image Card */}
      <View style={styles.imageCard}>
        <Skeleton width={80} height={28} borderRadius={20} style={styles.categoryBadge} />
        <Skeleton width="100%" height={220} borderRadius={20} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        {/* Title & Price */}
        <View style={styles.namePriceRow}>
          <View style={styles.nameContainer}>
            <Skeleton width="70%" height={22} style={styles.mb8} />
            <Skeleton width={100} height={14} />
          </View>
          <Skeleton width={100} height={24} />
        </View>

        <View style={styles.divider} />

        {/* Description */}
        <Skeleton width={120} height={15} style={styles.mb12} />
        <Skeleton width="100%" height={14} style={styles.mb4} />
        <Skeleton width="90%" height={14} style={styles.mb4} />
        <Skeleton width="70%" height={14} />

        <View style={styles.divider} />

        {/* Size selection */}
        <Skeleton width={80} height={15} style={styles.mb12} />
        <View style={styles.sizeRow}>
          {[1, 2, 3, 4, 5, 6].map((_, i) => (
            <Skeleton key={i} width={50} height={50} borderRadius={14} />
          ))}
        </View>
      </View>
    </View>
  );
};

// =================== HOME SECTION SKELETON =====================

export const HomeSectionSkeleton: React.FC = () => {
  return (
    <View style={styles.homeSection}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Skeleton width={120} height={18} />
        <Skeleton width={60} height={14} />
      </View>

      {/* Horizontal scroll placeholder */}
      <View style={styles.horizontalScroll}>
        {[1, 2, 3].map((_, i) => (
          <View key={i} style={styles.homeCard}>
            <Skeleton width={150} height={120} borderRadius={16} />
            <Skeleton width={120} height={12} style={styles.mt8} />
            <Skeleton width={80} height={14} style={styles.mt4} />
          </View>
        ))}
      </View>
    </View>
  );
};

// =================== STYLES =====================

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E2E8F0",
  },
  
  // Product Card
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    padding: 12,
  },
  productCardContent: {
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  // Product List
  productList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  
  // Cart Item
  cartItem: {
    flexDirection: "row",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cartItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  // Product Detail
  productDetail: {
    padding: 16,
  },
  imageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  categoryBadge: {
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nameContainer: {
    flex: 1,
    marginRight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  sizeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  
  // Home Section
  homeSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  horizontalScroll: {
    flexDirection: "row",
    paddingLeft: 16,
  },
  homeCard: {
    marginRight: 12,
  },
  
  // Spacing utilities
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mx8: { marginHorizontal: 8 },
});

export default Skeleton;
