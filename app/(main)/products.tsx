/**
 * Products Screen - Màn hình danh sách sản phẩm
 * ==============================================
 * 
 * Features:
 * - Hiển thị tất cả sản phẩm
 * - Lọc sản phẩm theo danh mục (category)
 * - Tìm kiếm sản phẩm
 * - Sắp xếp theo giá (tăng/giảm)
 * - Pull to refresh
 * - Hiển thị discount, stock status
 * 
 * API Endpoints:
 * - GET /api/products - Lấy tất cả sản phẩm (hoặc theo categoryId)
 * - GET /api/products/search?q=keyword&categoryId=x - Tìm kiếm
 * - GET /api/categories - Lấy danh mục
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import HomeHeader from "../../components/home/HomeHeader";
import { useFavorite } from "../../context/FavoriteContext";
import { api, BASE_URL } from "../../services/api";

// =================== CONSTANTS =====================

const SCREEN_WIDTH = Dimensions.get("window").width;
const PADDING = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP) / 2;

// Theme colors
const COLORS = {
  primary: "#5B9EE1",
  primaryLight: "#EBF4FF",
  secondary: "#1E3A5F",
  accent: "#FF6B6B",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
};

// =================== TYPES =====================

interface Category {
  id: number;
  name: string;
  slug?: string;
  isActive?: boolean;
}

interface Product {
  id: number;
  title: string;
  price: number;
  photo: string;
  description?: string;
  brand?: string;
  qty?: number;
  priceRoot?: number;
  price_root?: number;
  sku?: string;
  gender?: string;
  status?: string;
  category?: {
    id: number;
    name: string;
  };
  categoryId?: number;
}

type SortOrder = "asc" | "desc" | null;

// =================== HELPER FUNCTIONS =====================

const getImageUrl = (photo: string): string => {
  if (!photo) return "";
  if (photo.startsWith("http")) return photo;
  return `${BASE_URL}/images/${photo}`;
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
};

const calculateDiscount = (price: number, priceRoot?: number): number => {
  if (!priceRoot || priceRoot <= price) return 0;
  return Math.round(((priceRoot - price) / priceRoot) * 100);
};

const getStockStatus = (qty?: number): { text: string; color: string } | null => {
  if (qty === undefined || qty === null) return null;
  if (qty <= 0) return { text: "Hết hàng", color: COLORS.danger };
  if (qty <= 5) return { text: `Còn ${qty}`, color: COLORS.warning };
  return { text: `Còn ${qty}`, color: COLORS.success };
};

// =================== MAIN COMPONENT =====================

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; categoryId?: string }>();

  // =================== STATE =====================
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchKeyword, setSearchKeyword] = useState(params.search || "");
  const [activeCategory, setActiveCategory] = useState<number | null>(
    params.categoryId ? Number(params.categoryId) : null
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refs to prevent unnecessary API calls
  const isInitialMount = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Favorites hook
  const { isFavorite, toggleFavorite } = useFavorite();

  // =================== API FUNCTIONS =====================

  const fetchCategories = async (): Promise<Category[]> => {
    try {
      const response = await api.get<Category[]>("/api/categories");
      console.log("[Products] Categories loaded:", response.data.length);
      return response.data;
    } catch (error) {
      console.error("[Products] Failed to load categories:", error);
      return [];
    }
  };

  const fetchProducts = async (
    catId: number | null,
    keyword: string
  ): Promise<Product[]> => {
    try {
      let endpoint = "/api/products";
      const queryParams: Record<string, string | number> = {};

      // If searching, use search endpoint
      if (keyword.trim()) {
        endpoint = "/api/products/search";
        queryParams.q = keyword.trim();
      }

      // Add categoryId if filtering
      if (catId !== null) {
        queryParams.categoryId = catId;
      }

      console.log("[Products] Fetching:", { endpoint, queryParams });

      const response = await api.get<Product[]>(endpoint, { params: queryParams });
      console.log("[Products] Loaded:", response.data.length, "products");
      return response.data;
    } catch (error) {
      console.error("[Products] Failed to load products:", error);
      return [];
    }
  };

  // =================== LOAD FUNCTIONS =====================

  const loadData = useCallback(async (catId: number | null, keyword: string, sort: SortOrder) => {
    try {
      setLoading(true);
      let data = await fetchProducts(catId, keyword);

      // Apply sorting
      if (sort && data.length > 0) {
        data = [...data].sort((a, b) =>
          sort === "asc" ? a.price - b.price : b.price - a.price
        );
      }

      setProducts(data);
    } catch (error) {
      console.error("[Products] Error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =================== EFFECTS =====================

  // Initial load - categories and products
  useEffect(() => {
    const init = async () => {
      const cats = await fetchCategories();
      setCategories(cats);
      await loadData(activeCategory, searchKeyword, sortOrder);
    };
    init();
    isInitialMount.current = false;
  }, []); // Empty deps - only run once on mount

  // Reload when category changes
  useEffect(() => {
    if (isInitialMount.current) return;
    console.log("[Products] Category changed to:", activeCategory);
    loadData(activeCategory, searchKeyword, sortOrder);
  }, [activeCategory]); // Only activeCategory

  // Reload when sort changes
  useEffect(() => {
    if (isInitialMount.current) return;
    loadData(activeCategory, searchKeyword, sortOrder);
  }, [sortOrder]); // Only sortOrder

  // Debounced search
  useEffect(() => {
    if (isInitialMount.current) return;

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      console.log("[Products] Search keyword changed:", searchKeyword);
      loadData(activeCategory, searchKeyword, sortOrder);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchKeyword]); // Only searchKeyword

  // Update from navigation params
  useEffect(() => {
    if (params.search !== undefined && params.search !== searchKeyword) {
      setSearchKeyword(params.search);
    }
    if (params.categoryId !== undefined) {
      const catId = params.categoryId ? Number(params.categoryId) : null;
      if (catId !== activeCategory) {
        setActiveCategory(catId);
      }
    }
  }, [params.search, params.categoryId]);

  // =================== HANDLERS =====================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(activeCategory, searchKeyword, sortOrder);
    setRefreshing(false);
  }, [activeCategory, searchKeyword, sortOrder, loadData]);

  const handleSearch = useCallback(() => {
    loadData(activeCategory, searchKeyword, sortOrder);
  }, [activeCategory, searchKeyword, sortOrder, loadData]);

  const handleClearSearch = useCallback(() => {
    setSearchKeyword("");
  }, []);

  const handleCategorySelect = useCallback((categoryId: number | null) => {
    console.log("[Products] Category selected:", categoryId);
    setActiveCategory(categoryId);
  }, []);

  const handleToggleSort = useCallback(() => {
    setSortOrder((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  }, []);

  const handleProductPress = useCallback((productId: number) => {
    router.push({
      pathname: "/product/productDetail",
      params: { id: productId.toString() },
    });
  }, [router]);

  const handleToggleFavorite = useCallback((item: Product) => {
    toggleFavorite({
      id: item.id.toString(),
      tag: item.category?.name || "Sản phẩm",
      name: item.title,
      price: formatPrice(item.price),
      image: getImageUrl(item.photo),
    });
  }, [toggleFavorite]);

  const handleResetFilters = useCallback(() => {
    setSearchKeyword("");
    setActiveCategory(null);
    setSortOrder(null);
  }, []);

  // =================== COMPUTED VALUES =====================

  const sortLabel = sortOrder === "asc" ? "Giá thấp → cao" :
    sortOrder === "desc" ? "Giá cao → thấp" : "Mặc định";

  const sortIcon = sortOrder === "asc" ? "arrow-up" :
    sortOrder === "desc" ? "arrow-down" : "swap-vertical";

  const activeCategoryName = activeCategory === null
    ? "Tất cả"
    : categories.find(c => c.id === activeCategory)?.name || "Danh mục";

  // =================== RENDER COMPONENTS =====================

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {searchKeyword ? `Tìm: "${searchKeyword}"` : "Khám phá sản phẩm"}
      </Text>
      <Text style={styles.headerSubtitle}>
        {products.length} sản phẩm
        {activeCategory !== null && ` trong "${activeCategoryName}"`}
      </Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={COLORS.primary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm giày, dép..."
          placeholderTextColor={COLORS.textMuted}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchKeyword.length > 0 && (
          <TouchableOpacity
            onPress={handleClearSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {/* "All" button */}
      <TouchableOpacity
        style={[
          styles.categoryChip,
          activeCategory === null && styles.categoryChipActive,
        ]}
        onPress={() => handleCategorySelect(null)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.categoryChipText,
            activeCategory === null && styles.categoryChipTextActive,
          ]}
        >
          Tất cả
        </Text>
      </TouchableOpacity>

      {/* Category chips */}
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            activeCategory === category.id && styles.categoryChipActive,
          ]}
          onPress={() => handleCategorySelect(category.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.categoryChipText,
              activeCategory === category.id && styles.categoryChipTextActive,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSortBar = () => (
    <View style={styles.sortBar}>
      <View style={styles.resultBadge}>
        <Ionicons name="grid-outline" size={14} color={COLORS.primary} />
        <Text style={styles.resultText}>{products.length} sản phẩm</Text>
      </View>

      <TouchableOpacity
        style={styles.sortButton}
        onPress={handleToggleSort}
        activeOpacity={0.7}
      >
        <Text style={styles.sortButtonText}>{sortLabel}</Text>
        <Ionicons name={sortIcon as any} size={14} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderProductCard = ({ item, index }: { item: Product; index: number }) => {
    const isLeft = index % 2 === 0;
    const originalPrice = item.priceRoot || item.price_root;
    const discount = calculateDiscount(item.price, originalPrice);
    const stockStatus = getStockStatus(item.qty);
    const isOutOfStock = item.qty !== undefined && item.qty <= 0;
    const isItemFavorite = isFavorite(item.id.toString());

    return (
      <TouchableOpacity
        style={[styles.productCard, isLeft ? styles.cardLeft : styles.cardRight]}
        onPress={() => handleProductPress(item.id)}
        activeOpacity={0.9}
        disabled={isOutOfStock}
      >
        {/* Image Section */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: getImageUrl(item.photo) }}
            style={styles.productImage}
            resizeMode="contain"
          />

          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}

          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category.name}</Text>
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>HẾT HÀNG</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.wishlistButton, isItemFavorite && styles.wishlistButtonActive]}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorite(item);
            }}
          >
            <Ionicons
              name={isItemFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isItemFavorite ? COLORS.danger : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.productInfo}>
          {item.brand && <Text style={styles.brandText}>{item.brand}</Text>}
          <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.priceContainer}>
            <View style={styles.priceWrapper}>
              <Text style={styles.currentPrice}>{formatPrice(item.price)}</Text>
              {discount > 0 && originalPrice && (
                <Text style={styles.originalPrice}>{formatPrice(originalPrice)}</Text>
              )}
            </View>
            {stockStatus && (
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]}
            onPress={() => handleProductPress(item.id)}
            disabled={isOutOfStock}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="search-outline" size={64} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
      <Text style={styles.emptySubtitle}>
        {searchKeyword
          ? `Không có sản phẩm nào phù hợp với "${searchKeyword}"`
          : activeCategory !== null
            ? `Không có sản phẩm nào trong danh mục "${activeCategoryName}"`
            : "Thử thay đổi bộ lọc để tìm sản phẩm bạn cần"}
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleResetFilters}>
        <Text style={styles.emptyButtonText}>Xem tất cả sản phẩm</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
    </View>
  );

  // =================== MAIN RENDER =====================

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeHeader />
        {renderLoading()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader />

      <View style={styles.content}>
        {renderHeader()}
        {renderSearchBar()}
        {renderCategories()}
        {renderSortBar()}

        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductCard}
          numColumns={2}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </SafeAreaView>
  );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: PADDING,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: PADDING,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  categoriesContainer: {
    paddingHorizontal: PADDING,
    paddingBottom: 16,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  sortBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PADDING,
    paddingBottom: 12,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resultText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  productList: {
    paddingHorizontal: PADDING,
    paddingBottom: 100,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: CARD_GAP,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardLeft: {
    marginRight: CARD_GAP / 2,
  },
  cardRight: {
    marginLeft: CARD_GAP / 2,
  },
  imageWrapper: {
    width: "100%",
    height: 140,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  productImage: {
    width: "85%",
    height: "85%",
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  wishlistButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  wishlistButtonActive: {
    backgroundColor: "#FEE2E2",
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  productInfo: {
    padding: 14,
  },
  brandText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
    minHeight: 40,
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 12,
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.accent,
  },
  originalPrice: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
