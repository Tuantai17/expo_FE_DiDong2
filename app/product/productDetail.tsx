/**
 * Product Detail Screen
 * =====================
 * Displays detailed product information fetched from API
 * Includes: image gallery, product info, size selection, add to cart
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../../context/CartContext";
import { useFavorite } from "../../context/FavoriteContext";
import { getImageUrl, getProductDetail } from "../../services/api";
import { showSuccessAlert } from "../../utils/alert";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SIZES = [38, 39, 40, 41, 42, 43];

// =================== TYPES =====================

type Product = {
  id: number;
  title: string;
  price: number;
  photo: string;
  description?: string;
  qty?: number;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
  };
};

// =================== COMPONENT =====================

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorite();

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number>(40);
  const [quantity, setQuantity] = useState(1);

  const productId = Number(id) || 1;
  const isLiked = product ? isFavorite(product.id.toString()) : false;

  // =================== EFFECTS =====================

  useEffect(() => {
    loadProductDetail();
  }, [productId]);

  // =================== FUNCTIONS =====================

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      console.log("📤 Loading product detail for ID:", productId);
      const data = await getProductDetail(productId);
      console.log("📦 Product data received:", data);
      setProduct(data);
    } catch (error) {
      console.log("❌ Load product detail failed:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProductDetail();
    setRefreshing(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id.toString(),
      productId: product.id,  // Thêm productId cho API
      name: product.title,
      price: product.price,
      image: getImageUrl(product.photo),
      size: selectedSize.toString(),
      quantity: quantity,
    });

    showSuccessAlert(
      "🛒 Đã thêm vào giỏ hàng!",
      `${product.title} (Size ${selectedSize}) x${quantity}`,
      () => router.push("/cart")
    );
  };

  const handleBuyNow = () => {
    if (!product) return;

    addToCart({
      id: product.id.toString(),
      productId: product.id,  // Thêm productId cho API
      name: product.title,
      price: product.price,
      image: getImageUrl(product.photo),
      size: selectedSize.toString(),
      quantity: quantity,
    });

    router.push("/cart");
  };

  const handleFavoritePress = () => {
    if (!product) return;
    toggleFavorite({
      id: product.id.toString(),
      tag: getCategoryName(),
      name: product.title,
      price: formatPrice(product.price),
      image: { uri: getImageUrl(product.photo) },
    });
  };

  const getCategoryName = () => {
    if (product?.category?.name) return product.category.name;
    // Fallback category names based on categoryId
    const categoryNames: Record<number, string> = {
      5: "Cà phê",
      6: "Trà",
      7: "Nước ép",
      8: "Bánh ngọt",
    };
    return categoryNames[product?.categoryId || 0] || "Sản phẩm";
  };

  const increaseQty = () => {
    const maxQty = product?.qty || 10;
    if (quantity < maxQty) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // =================== RENDER: LOADING =====================

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B9EE1" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // =================== RENDER: ERROR =====================

  if (!product) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#CBD5E1" />
          <Text style={styles.errorTitle}>Không tìm thấy sản phẩm</Text>
          <Text style={styles.errorSubtitle}>
            Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa
          </Text>
          <TouchableOpacity
            style={styles.backButtonError}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.backButtonErrorText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // =================== RENDER: MAIN =====================

  const totalPrice = product.price * quantity;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>

        <TouchableOpacity
          style={[styles.headerButton, isLiked && styles.headerButtonActive]}
          onPress={handleFavoritePress}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? "#EF4444" : "#0F172A"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Image Card */}
        <View style={styles.imageCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{getCategoryName()}</Text>
          </View>

          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: getImageUrl(product.photo) }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          </View>

          {/* Stock indicator */}
          {product.qty !== undefined && (
            <View style={[
              styles.stockBadge,
              product.qty <= 5 && styles.stockBadgeLow
            ]}>
              <MaterialCommunityIcons
                name="package-variant"
                size={12}
                color={product.qty <= 5 ? "#F59E0B" : "#10B981"}
              />
              <Text style={[
                styles.stockText,
                product.qty <= 5 && styles.stockTextLow
              ]}>
                {product.qty > 0 ? `Còn ${product.qty} sản phẩm` : "Hết hàng"}
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          {/* Name & Price */}
          <View style={styles.namePriceRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.productName}>{product.title}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>4.8</Text>
                <Text style={styles.reviewCount}>(128 đánh giá)</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.description}>
              {product.description || "Chưa có mô tả cho sản phẩm này."}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Size Selection */}
          <View style={styles.section}>
            <View style={styles.sizeHeader}>
              <Text style={styles.sectionTitle}>Chọn size</Text>
              <View style={styles.sizeTypeRow}>
                <Text style={styles.sizeTypeActive}>EU</Text>
                <Text style={styles.sizeType}>US</Text>
                <Text style={styles.sizeType}>UK</Text>
              </View>
            </View>

            <View style={styles.sizeRow}>
              {SIZES.map((size) => {
                const isActive = size === selectedSize;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeItem, isActive && styles.sizeItemActive]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.sizeText, isActive && styles.sizeTextActive]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Quantity Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Số lượng</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={decreaseQty}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? "#CBD5E1" : "#0F172A"} />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={[styles.quantityButton, quantity >= (product.qty || 10) && styles.quantityButtonDisabled]}
                onPress={increaseQty}
                disabled={quantity >= (product.qty || 10)}
              >
                <Ionicons name="add" size={20} color={quantity >= (product.qty || 10) ? "#CBD5E1" : "#0F172A"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <Ionicons name="bag-add-outline" size={20} color="#5B9EE1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyNowButton}
            onPress={handleBuyNow}
          >
            <Text style={styles.buyNowText}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#64748B",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonActive: {
    backgroundColor: "#FEE2E2",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0F172A",
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Image Card
  imageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryBadge: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EBF4FF",
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5B9EE1",
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
  },
  mainImage: {
    width: SCREEN_WIDTH - 112,
    height: 220,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    gap: 4,
  },
  stockBadgeLow: {
    backgroundColor: "#FFFBEB",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#10B981",
  },
  stockTextLow: {
    color: "#F59E0B",
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameContainer: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    lineHeight: 28,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  reviewCount: {
    fontSize: 12,
    color: "#94A3B8",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#EF4444",
  },

  // Sections
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },

  // Size Selection
  sizeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sizeTypeRow: {
    flexDirection: "row",
    gap: 12,
  },
  sizeType: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  sizeTypeActive: {
    fontSize: 12,
    color: "#5B9EE1",
    fontWeight: "600",
  },
  sizeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sizeItem: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  sizeItemActive: {
    backgroundColor: "#5B9EE1",
    borderColor: "#5B9EE1",
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  sizeTextActive: {
    color: "#FFFFFF",
  },

  // Quantity
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quantityButtonDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#F1F5F9",
  },
  quantityText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    minWidth: 40,
    textAlign: "center",
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addToCartButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#5B9EE1",
  },
  buyNowButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#5B9EE1",
    ...Platform.select({
      ios: {
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 20,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  backButtonError: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#5B9EE1",
    gap: 8,
  },
  backButtonErrorText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
