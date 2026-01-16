// components/home/HomePopularSection.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useCart } from "../../context/CartContext";
import { getImageUrl, getProducts } from "../../services/api";
import ProductCard from "../product/ProductCard";
import { ProductCardSkeleton } from "../ui/SkeletonLoader";

type Product = {
    id: number;
    title: string;
    price: number;
    photo: string;
    category?: {
        id: number;
        name: string;
    };
};

export default function HomePopularSection() {
    const router = useRouter();
    const { addToCart } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            // Get first 6 products for popular section
            setProducts(data.slice(0, 6));
        } catch (error) {
            console.log("Load popular products failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    // Quick add to cart without going to product detail
    const handleQuickAdd = async (item: Product) => {
        try {
            await addToCart({
                id: item.id.toString(),
                productId: item.id,
                name: item.title,
                price: item.price,
                image: { uri: getImageUrl(item.photo) },
                size: "40", // Default size
                quantity: 1,
            });
            console.log("✅ [Home] Added to cart:", item.title);
        } catch (error) {
            console.log("❌ [Home] Error adding to cart:", error);
            Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng");
        }
    };

    // Skeleton loading cards
    const renderSkeletonCards = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
        >
            {[1, 2, 3].map((i) => (
                <View key={i} style={styles.card}>
                    <ProductCardSkeleton />
                </View>
            ))}
        </ScrollView>
    );

    return (
        <View>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sản phẩm phổ biến</Text>
                <TouchableOpacity
                    onPress={() => router.push("/(main)/products")}
                >
                    <Text style={styles.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            {/* Horizontal scrollable product list */}
            {loading ? (
                renderSkeletonCards()
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                >
                    {products.map((item, index) => (
                        <Animated.View
                            key={item.id}
                            entering={FadeInRight.delay(index * 80).duration(400)}
                        >
                            <ProductCard
                                id={item.id.toString()}
                                tag={item.category?.name || "NEW"}
                                name={item.title}
                                price={formatPrice(item.price)}
                                image={{ uri: getImageUrl(item.photo) }}
                                style={styles.card}
                                onPress={() =>
                                    router.push({
                                        pathname: "/product/productDetail",
                                        params: { id: item.id.toString() },
                                    })
                                }
                                onAddPress={() => handleQuickAdd(item)}
                            />
                        </Animated.View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        marginTop: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 4,
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
    scrollView: {
        marginTop: 16,
    },
    scrollContent: {
        paddingLeft: 4,
        paddingRight: 16,
    },
    card: {
        marginRight: 16,
    },
    loadingContainer: {
        height: 180,
        justifyContent: "center",
        alignItems: "center",
    },
});
