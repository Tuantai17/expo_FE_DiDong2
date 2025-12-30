// components/home/HomePopularSection.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getImageUrl, getProducts } from "../../services/api";
import ProductCard from "../product/ProductCard";

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
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#5B9EE1" />
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                >
                    {products.map((item) => (
                        <ProductCard
                            key={item.id}
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
                            onAddPress={() =>
                                router.push({
                                    pathname: "/product/productDetail",
                                    params: { id: item.id.toString() },
                                })
                            }
                        />
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
