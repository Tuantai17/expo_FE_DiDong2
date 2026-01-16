/**
 * Cart Screen
 * ============
 * Displays shopping cart with real product data from CartContext
 * Includes: product list, quantity controls, order summary, checkout
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useCart } from "../../context/CartContext";
import { showConfirmAlert } from "../../utils/alert";
import haptics from "../../utils/haptics";

// =================== COMPONENT =====================

export default function CartScreen() {
  const router = useRouter();
  const { items, changeQty, removeItem, clearCart, isLoading: cartLoading } = useCart();
  
  // Local loading states
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // =================== CALCULATIONS =====================

  // Calculate total quantity of items
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  // Calculate subtotal from real product prices
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Shipping fee (free shipping over 1,000,000 VND)
  const FREE_SHIPPING_THRESHOLD = 1000000;
  const SHIPPING_FEE = 30000; // 30,000 VND
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (items.length > 0 ? SHIPPING_FEE : 0);

  // Total
  const total = subtotal + shipping;

  // =================== HELPERS =====================

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  // =================== HANDLERS =====================

  const handleCheckout = () => {
    haptics.buttonPress();
    router.push("/product/checkout");
  };

  const handleRemoveItem = async (id: string, size: string, name: string) => {
    haptics.removeFromCart();
    showConfirmAlert(
      "Xóa sản phẩm",
      `Bạn có chắc muốn xóa "${name}" khỏi giỏ hàng?`,
      async () => {
        try {
          setDeletingItemId(`${id}-${size}`);
          await removeItem(id, size);
          console.log("✅ [Cart] Removed item:", name);
        } catch (error) {
          console.log("❌ [Cart] Error removing item:", error);
          Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại.");
        } finally {
          setDeletingItemId(null);
        }
      }
    );
  };

  const handleClearCart = async () => {
    haptics.clearCart();
    showConfirmAlert(
      "Xóa tất cả",
      "Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?",
      async () => {
        try {
          setIsDeleting(true);
          console.log("🗑️ [Cart] Clearing all items...");
          await clearCart();
          console.log("✅ [Cart] All items cleared");
        } catch (error) {
          console.log("❌ [Cart] Error clearing cart:", error);
          Alert.alert("Lỗi", "Không thể xóa giỏ hàng. Vui lòng thử lại.");
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  // =================== RENDER =====================

  // Loading overlay
  if (isDeleting || cartLoading) {
    return (
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          <View style={styles.headerRight}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B9EE1" />
          <Text style={styles.loadingText}>
            {isDeleting ? "Đang xóa giỏ hàng..." : "Đang tải..."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Giỏ hàng</Text>

        <View style={styles.headerRight}>
          {items.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCart}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
        </View>
      </View>

      {/* Cart Items */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: items.length > 0 ? 280 : 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bag-outline" size={18} color="#5B9EE1" />
            <Text style={styles.cardHeaderText}>Sản phẩm ({items.length})</Text>
          </View>

          {/* Cart Items List */}
          {items.map((item, index) => (
            <View
              key={`${item.id}-${item.size}`}
              style={[
                styles.cartRow,
                index === items.length - 1 && styles.cartRowLast
              ]}
            >
              {/* Product Image */}
              <View style={styles.itemImageContainer}>
                <Image
                  source={
                    typeof item.image === 'string'
                      ? { uri: item.image }
                      : item.image
                  }
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              </View>

              {/* Product Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemSize}>Size: {item.size}</Text>

                <View style={styles.priceQtyRow}>
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.price)}
                  </Text>

                  {/* Quantity Controls */}
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[
                        styles.qtyButton,
                        item.qty <= 1 && styles.qtyButtonDisabled
                      ]}
                      onPress={() => {
                        haptics.decreaseQty();
                        changeQty(item.id, item.size, -1);
                      }}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={item.qty <= 1 ? "#CBD5E1" : "#64748B"}
                      />
                    </TouchableOpacity>

                    <Text style={styles.qtyValue}>{item.qty}</Text>

                    <TouchableOpacity
                      style={[styles.qtyButton, styles.qtyButtonActive]}
                      onPress={() => {
                        haptics.increaseQty();
                        changeQty(item.id, item.size, +1);
                      }}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Item Total */}
                <Text style={styles.itemTotal}>
                  Thành tiền: {formatPrice(item.price * item.qty)}
                </Text>
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveItem(item.id, item.size, item.name)}
              >
                <Ionicons name="close" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Empty Cart State */}
          {items.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
              <Text style={styles.emptySubtitle}>
                Hãy thêm sản phẩm vào giỏ hàng của bạn
              </Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push("/(main)/products")}
              >
                <Ionicons name="storefront-outline" size={18} color="#FFFFFF" />
                <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Order Summary - Fixed at bottom */}
      {items.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={[styles.card, styles.summaryCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt-outline" size={18} color="#5B9EE1" />
              <Text style={styles.cardHeaderText}>Chi tiết thanh toán</Text>
            </View>

            <View style={styles.summaryBox}>
              {/* Subtotal */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Tạm tính ({totalItems} sản phẩm)
                </Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(subtotal)}
                </Text>
              </View>

              {/* Shipping */}
              <View style={styles.summaryRow}>
                <View style={styles.shippingLabelRow}>
                  <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                  {subtotal >= FREE_SHIPPING_THRESHOLD && (
                    <View style={styles.freeShippingBadge}>
                      <Text style={styles.freeShippingText}>Miễn phí</Text>
                    </View>
                  )}
                  {subtotal < FREE_SHIPPING_THRESHOLD && subtotal > 0 && (
                    <View style={[styles.freeShippingBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.freeShippingText, { color: '#D97706' }]}>Dự tính</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.summaryValue,
                  shipping === 0 && styles.freeShippingValue
                ]}>
                  {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                </Text>
              </View>
              
              {/* Note about shipping calculated at checkout */}
              {subtotal < FREE_SHIPPING_THRESHOLD && subtotal > 0 && (
                <Text style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 }}>
                  * Phí ship chính xác sẽ được tính tại trang thanh toán
                </Text>
              )}

              {/* Free shipping progress */}
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <View style={styles.freeShippingProgress}>
                  <Text style={styles.progressText}>
                    Mua thêm {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} để được miễn phí vận chuyển
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }
                      ]}
                    />
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              {/* Total */}
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(total)}
                </Text>
              </View>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Ionicons
                name="card-outline"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.checkoutText}>Tiến hành thanh toán</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    backgroundColor: "#5B9EE1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    alignItems: "center",
  },
  cartBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Card
  card: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },

  // Cart Row
  cartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cartRowLast: {
    borderBottomWidth: 0,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
    lineHeight: 20,
  },
  itemSize: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 8,
  },
  priceQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5B9EE1",
  },
  itemTotal: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },

  // Quantity Controls
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonActive: {
    backgroundColor: "#5B9EE1",
  },
  qtyButtonDisabled: {
    backgroundColor: "#F8FAFC",
  },
  qtyValue: {
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    minWidth: 20,
    textAlign: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 24,
    textAlign: "center",
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#5B9EE1",
    gap: 8,
  },
  shopButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Summary
  summaryContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 30 : 20,
  },
  summaryCard: {
    marginTop: 0,
  },
  summaryBox: {
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  shippingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  freeShippingBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeShippingText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#10B981",
  },
  freeShippingValue: {
    color: "#10B981",
    fontWeight: "600",
  },
  freeShippingProgress: {
    marginBottom: 12,
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    color: "#F59E0B",
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#5B9EE1",
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#EF4444",
  },
  checkoutButton: {
    flexDirection: "row",
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "#5B9EE1",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 5,
      },
    }),
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
