// components/home/HomeFlashSaleSection.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useCart } from "../../context/CartContext";
import { getImageUrl, getProducts } from "../../services/api";
import { useToast } from "../ui/Toast";
import FlashSaleCard from "./FlashSaleCard";

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

type TimeLeft = {
    hours: number;
    minutes: number;
    seconds: number;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate time remaining until end of day (23:59:59)
 */
const calculateTimeLeft = (): TimeLeft => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const difference = endOfDay.getTime() - now.getTime();

    if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
};

/**
 * Format number to 2 digits (e.g., 5 -> "05")
 */
const padZero = (num: number): string => {
    return num.toString().padStart(2, "0");
};

/**
 * Get original price from product (handles different field names)
 * Returns undefined if priceRoot is 0 or doesn't exist
 */
const getOriginalPrice = (product: Product): number => {
    const priceRoot = product.priceRoot || product.price_root;
    // Return priceRoot only if it's valid and greater than 0, otherwise return current price
    return (priceRoot && priceRoot > 0) ? priceRoot : product.price;
};

/**
 * Calculate discount percentage
 */
const getDiscountPercent = (product: Product): number => {
    const originalPrice = getOriginalPrice(product);
    if (!originalPrice || originalPrice <= product.price) return 0;
    return Math.round(((originalPrice - product.price) / originalPrice) * 100);
};

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Flash Sale Header with Logo and Countdown
 */
const FlashSaleHeader = ({
    timeLeft,
    onViewAll,
}: {
    timeLeft: TimeLeft;
    onViewAll: () => void;
}) => (
    <View style={styles.header}>
        {/* Left side: Flash Sale Logo + Deal Badge */}
        <View style={styles.headerLeft}>
            {/* Flash Sale Logo */}
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>F</Text>
                <Ionicons name="flash" size={18} color="#FF6B35" />
                <Text style={styles.logoText}>ash Sale</Text>
            </View>

            {/* Deal Badge */}
            <View style={styles.dealBadge}>
                <Text style={styles.dealText}>Băm Săn Deal - 70%</Text>
            </View>
        </View>

        {/* Right side: Countdown Timer */}
        <View style={styles.countdownContainer}>
            <View style={styles.timeBox}>
                <Text style={styles.timeText}>{padZero(timeLeft.hours)}</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeBox}>
                <Text style={styles.timeText}>{padZero(timeLeft.minutes)}</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeBox}>
                <Text style={styles.timeText}>{padZero(timeLeft.seconds)}</Text>
            </View>
        </View>
    </View>
);

/**
 * Loading Skeleton for Flash Sale Cards
 */
const FlashSaleSkeleton = () => (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
    >
        {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonPrice} />
            </View>
        ))}
    </ScrollView>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function HomeFlashSaleSection() {
    const router = useRouter();
    const { addToCart } = useCart();
    const { showCartToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

    // Countdown Timer Effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Load Products
    useEffect(() => {
        loadFlashSaleProducts();
    }, []);

    const loadFlashSaleProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();

            // Filter products that have discount (priceRoot > price)
            const discountedProducts = data.filter((product: Product) => {
                const originalPrice = getOriginalPrice(product);
                return originalPrice && originalPrice > product.price;
            });

            // Sort by discount percentage (highest first)
            const sortedProducts = discountedProducts.sort(
                (a: Product, b: Product) => {
                    return getDiscountPercent(b) - getDiscountPercent(a);
                }
            );

            // Take top 8 products
            setProducts(sortedProducts.slice(0, 8));
        } catch (error) {
            console.log("Load flash sale products failed:", error);
            // Fallback: show first 6 products if filter fails
            try {
                const data = await getProducts();
                setProducts(data.slice(0, 6));
            } catch {
                console.log("Fallback also failed");
            }
        } finally {
            setLoading(false);
        }
    };

    // Navigate to product detail
    const handleProductPress = (productId: number) => {
        router.push({
            pathname: "/product/productDetail",
            params: { id: productId.toString() },
        });
    };

    // Add to cart handler with toast notification
    const handleAddToCart = async (product: Product) => {
        try {
            await addToCart({
                id: product.id.toString(),
                productId: product.id,
                name: product.title,
                price: product.price,
                image: { uri: getImageUrl(product.photo) },
                size: "40", // Default size
                quantity: 1,
            });
            console.log("✅ [FlashSale] Added to cart:", product.title);
            
            // Show in-app toast with product name
            showCartToast(product.title, "40", 1);
        } catch (error) {
            console.log("❌ [FlashSale] Error adding to cart:", error);
            Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng");
        }
    };

    // Navigate to all products
    const handleViewAll = () => {
        router.push("/(main)/products");
    };

    // Get rating value from product
    const getProductRating = (product: Product): number => {
        return product.avgRating || product.avg_rating || 0;
    };

    // Get review count from product
    const getProductReviewCount = (product: Product): number => {
        return product.reviewCount || product.review_count || 0;
    };

    return (
        <View style={styles.container}>
            {/* Header with Flash Sale Logo and Countdown */}
            <FlashSaleHeader timeLeft={timeLeft} onViewAll={handleViewAll} />

            {/* Product List */}
            {loading ? (
                <FlashSaleSkeleton />
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                >
                    {products.map((product, index) => (
                        <Animated.View
                            key={product.id}
                            entering={FadeInRight.delay(index * 60).duration(
                                300
                            )}
                        >
                            <FlashSaleCard
                                id={product.id.toString()}
                                name={product.title}
                                brand={product.brand || product.category?.name}
                                price={product.price}
                                priceRoot={getOriginalPrice(product)}
                                image={{ uri: getImageUrl(product.photo) }}
                                rating={getProductRating(product)}
                                reviewCount={getProductReviewCount(product)}
                                onPress={() => handleProductPress(product.id)}
                                onAddPress={() => handleAddToCart(product)}
                            />
                        </Animated.View>
                    ))}
                </ScrollView>
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
    },
    // Header Styles
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 4,
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1A1A1A",
        letterSpacing: -0.5,
    },
    dealBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: "#FF6B6B",
    },
    dealText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
    },
    // Countdown Styles
    countdownContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    timeBox: {
        backgroundColor: "#1A1A1A",
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
        minWidth: 28,
        alignItems: "center",
    },
    timeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    timeSeparator: {
        color: "#1A1A1A",
        fontSize: 14,
        fontWeight: "700",
        marginHorizontal: 2,
    },
    // Product List Styles
    scrollView: {
        marginTop: 4,
    },
    scrollContent: {
        paddingLeft: 4,
        paddingRight: 16,
    },
    // Skeleton Styles
    skeletonCard: {
        width: 120,
        height: 160,
        borderRadius: 12,
        backgroundColor: "#F1F5F9",
        marginRight: 12,
        overflow: "hidden",
    },
    skeletonImage: {
        flex: 1,
        backgroundColor: "#E2E8F0",
    },
    skeletonPrice: {
        height: 40,
        backgroundColor: "#F8FAFC",
    },
});
