// components/home/HomeBestSellerSection.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useCart } from "../../context/CartContext";
import { getImageUrl, getProducts } from "../../services/api";
import { useToast } from "../ui/Toast";
import BestSellerCard from "./BestSellerCard";

// ============================================
// TYPES
// ============================================
type Product = {
    id: number;
    title: string;
    price: number;
    priceRoot?: number;
    price_root?: number;
    photo: string;
    brand?: string;
    avgRating?: number;
    avg_rating?: number;
    reviewCount?: number;
    review_count?: number;
    category?: {
        id: number;
        name: string;
    };
};

// ============================================
// SKELETON COMPONENT
// ============================================
const BestSellerSkeleton = () => (
    <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonInfo}>
                    <View style={styles.skeletonBrand} />
                    <View style={styles.skeletonName} />
                    <View style={styles.skeletonRating} />
                    <View style={styles.skeletonPrice} />
                </View>
            </View>
        ))}
    </View>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function HomeBestSellerSection() {
    const router = useRouter();
    const { addToCart } = useCart();
    const { showCartToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBestSellers();
    }, []);

    const loadBestSellers = async () => {
        try {
            setLoading(true);
            const data = await getProducts();

            // Filter out products with price = 0
            const validProducts = data.filter((p: Product) => p.price && p.price > 0);

            // Sort by reviewCount (as proxy for popularity/sales)
            // Products with higher review count are considered best sellers
            const sortedProducts = [...validProducts].sort((a: Product, b: Product) => {
                const aReviews = a.reviewCount || a.review_count || 0;
                const bReviews = b.reviewCount || b.review_count || 0;
                return bReviews - aReviews;
            });

            // Take top 8 products
            setProducts(sortedProducts.slice(0, 8));
        } catch (error) {
            console.log("Load best sellers failed:", error);
            // Fallback: use first 8 products with valid price
            try {
                const data = await getProducts();
                const validData = data.filter((p: Product) => p.price && p.price > 0);
                setProducts(validData.slice(0, 8));
            } catch {
                console.log("Fallback also failed");
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
    const getOriginalPrice = (product: Product): number | undefined => {
        const price = product.priceRoot || product.price_root;
        // Return undefined if price is 0 or doesn't exist
        return price && price > 0 ? price : undefined;
    };

    const getProductRating = (product: Product): number => {
        return product.avgRating || product.avg_rating || 0;
    };

    const getProductReviewCount = (product: Product): number => {
        // Return 0 for products without reviews
        return product.reviewCount || product.review_count || 0;
    };

    // Handle add to cart with toast notification
    const handleAddToCart = async (product: Product) => {
        try {
            await addToCart({
                id: product.id.toString(),
                productId: product.id,
                name: product.title,
                price: product.price,
                image: { uri: getImageUrl(product.photo) },
                size: "40",
                quantity: 1,
            });
            console.log("✅ [BestSeller] Added to cart:", product.title);
            
            // Show in-app toast with product name
            showCartToast(product.title, "40", 1);
        } catch (error) {
            console.log("❌ [BestSeller] Error adding to cart:", error);
            Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng");
        }
    };

    // Navigate to product detail
    const handleProductPress = (productId: number) => {
        router.push({
            pathname: "/product/productDetail",
            params: { id: productId.toString() },
        });
    };

    // Navigate to all products
    const handleViewAll = () => {
        router.push("/(main)/products");
    };

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <View style={styles.titleRow}>
                    <Ionicons name="flame" size={20} color="#FF6B6B" />
                    <Text style={styles.sectionTitle}>Bán chạy nhất</Text>
                </View>
                <TouchableOpacity onPress={handleViewAll}>
                    <Text style={styles.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            {/* Product Grid */}
            {loading ? (
                <BestSellerSkeleton />
            ) : (
                <View style={styles.grid}>
                    {products.map((product, index) => (
                        <Animated.View
                            key={product.id}
                            entering={FadeInUp.delay(index * 60).duration(400)}
                            style={styles.gridItem}
                        >
                            <BestSellerCard
                                id={product.id.toString()}
                                name={product.title}
                                brand={product.brand || product.category?.name}
                                price={product.price}
                                priceRoot={getOriginalPrice(product)}
                                image={{ uri: getImageUrl(product.photo) }}
                                rating={getProductRating(product)}
                                reviewCount={getProductReviewCount(product)}
                                colorIndex={index % 4}
                                onPress={() => handleProductPress(product.id)}
                                onAddPress={() => handleAddToCart(product)}
                            />
                        </Animated.View>
                    ))}
                </View>
            )}
        </View>
    );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    // Header
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        letterSpacing: -0.3,
    },
    seeAll: {
        fontSize: 13,
        fontWeight: "500",
        color: "#5B9EE1",
    },
    // Grid Layout
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    gridItem: {
        width: "48%",
        marginBottom: 16,
    },
    // Skeleton Styles
    skeletonGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    skeletonCard: {
        width: "48.5%",
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: "#F1F5F9",
        overflow: "hidden",
    },
    skeletonImage: {
        height: 140,
        backgroundColor: "#E2E8F0",
    },
    skeletonInfo: {
        padding: 12,
    },
    skeletonBrand: {
        width: 50,
        height: 10,
        backgroundColor: "#E2E8F0",
        borderRadius: 4,
        marginBottom: 6,
    },
    skeletonName: {
        width: "80%",
        height: 14,
        backgroundColor: "#E2E8F0",
        borderRadius: 4,
        marginBottom: 6,
    },
    skeletonRating: {
        width: 70,
        height: 10,
        backgroundColor: "#E2E8F0",
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonPrice: {
        width: 90,
        height: 16,
        backgroundColor: "#E2E8F0",
        borderRadius: 4,
    },
});
