// components/product/ProductList.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ListRenderItem,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { getCategories, getImageUrl, getProducts, searchProducts } from "../../services/api";
import ProductCard from "./ProductCard";

// Tính toán khoảng cách
const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = 16;
const GAP = 12;

// Type Product from API
export type Product = {
    id: number;
    title: string;
    price: number;
    photo: string;
    description?: string;
    category?: {
        id: number;
        name: string;
    };
};

type Category = {
    id: number;
    name: string;
};

export default function ProductList() {
    const router = useRouter();
    const params = useLocalSearchParams<{ search?: string; categoryId?: string }>();

    // State quản lý
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [activeCategory, setActiveCategory] = useState<number | null>(
        params.categoryId ? Number(params.categoryId) : null
    );
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
    const [searchKeyword, setSearchKeyword] = useState(params.search || "");

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Load products when category changes
    useEffect(() => {
        loadProducts();
    }, [activeCategory]);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.log("Load categories failed:", error);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            let data: Product[];

            if (searchKeyword.trim()) {
                data = await searchProducts(searchKeyword.trim(), activeCategory || undefined);
            } else {
                data = await getProducts(activeCategory || undefined);
            }

            setProducts(data);
        } catch (error) {
            console.log("Load products failed:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    // Filter & Sort products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Sort by price
        if (sortOrder) {
            result.sort((a, b) =>
                sortOrder === "asc" ? a.price - b.price : b.price - a.price
            );
        }

        return result;
    }, [products, sortOrder]);

    // Handle search
    const handleSearch = useCallback(() => {
        loadProducts();
    }, [searchKeyword, activeCategory]);

    // Clear search
    const handleClearSearch = () => {
        setSearchKeyword("");
        loadProducts();
    };

    // Toggle sort
    const toggleSort = () => {
        if (sortOrder === null) setSortOrder("asc");
        else if (sortOrder === "asc") setSortOrder("desc");
        else setSortOrder(null);
    };

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    // Render item
    const renderItem: ListRenderItem<Product> = ({ item, index }) => {
        const isLeftItem = index % 2 === 0;
        return (
            <View
                style={[styles.cardWrapper, isLeftItem ? styles.cardLeft : styles.cardRight]}
            >
                <ProductCard
                    id={item.id.toString()}
                    tag={item.category?.name || "NEW"}
                    name={item.title}
                    price={formatPrice(item.price)}
                    image={{ uri: getImageUrl(item.photo) }}
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
            </View>
        );
    };

    if (loading && products.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B9EE1" />
                <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header Title */}
            <View style={styles.headerSection}>
                <Text style={styles.title}>
                    {searchKeyword ? `Tìm: "${searchKeyword}"` : "Tất cả sản phẩm"}
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={18} color="#5B9EE1" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm sản phẩm..."
                        placeholderTextColor="#9CA3AF"
                        value={searchKeyword}
                        onChangeText={setSearchKeyword}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchKeyword.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Section */}
            <View style={styles.filterWrapper}>
                {/* Category Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContainer}
                >
                    <TouchableOpacity
                        style={[
                            styles.categoryBtn,
                            activeCategory === null && styles.categoryBtnActive,
                        ]}
                        onPress={() => setActiveCategory(null)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                activeCategory === null && styles.categoryTextActive,
                            ]}
                        >
                            Tất cả
                        </Text>
                    </TouchableOpacity>

                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryBtn,
                                activeCategory === cat.id && styles.categoryBtnActive,
                            ]}
                            onPress={() => setActiveCategory(cat.id)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    activeCategory === cat.id && styles.categoryTextActive,
                                ]}
                            >
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Sort Bar */}
                <View style={styles.sortBar}>
                    <Text style={styles.resultText}>
                        Tìm thấy {filteredProducts.length} sản phẩm
                    </Text>

                    <TouchableOpacity style={styles.sortBtn} onPress={toggleSort}>
                        <Text style={styles.sortBtnText}>
                            Sắp xếp:{" "}
                            {sortOrder === "asc"
                                ? "Thấp → Cao"
                                : sortOrder === "desc"
                                    ? "Cao → Thấp"
                                    : "Mặc định"}
                        </Text>
                        <Ionicons
                            name={
                                sortOrder === "asc"
                                    ? "arrow-up"
                                    : sortOrder === "desc"
                                        ? "arrow-down"
                                        : "filter"
                            }
                            size={14}
                            color="#5B9EE1"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Product Grid */}
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyView}>
                        <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>Không tìm thấy sản phẩm.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748B",
    },
    // Header
    headerSection: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 16,
        paddingBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0F172A",
        letterSpacing: -0.3,
    },
    // Search
    searchContainer: {
        paddingHorizontal: HORIZONTAL_PADDING,
        marginBottom: 12,
    },
    searchInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#0F172A",
    },
    // Filter
    filterWrapper: {
        backgroundColor: "#F8FAFC",
        marginBottom: 8,
    },
    categoryContainer: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: 12,
        gap: 8,
    },
    categoryBtn: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    categoryBtnActive: {
        backgroundColor: "#5B9EE1",
        borderColor: "#5B9EE1",
    },
    categoryText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
    },
    categoryTextActive: {
        color: "#FFFFFF",
    },
    // Sort
    sortBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: HORIZONTAL_PADDING,
        marginBottom: 8,
    },
    resultText: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
    },
    sortBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    sortBtnText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#5B9EE1",
    },
    // List
    listContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: 100,
    },
    cardWrapper: {
        marginBottom: 12,
    },
    cardLeft: {
        marginRight: GAP / 2,
    },
    cardRight: {
        marginLeft: GAP / 2,
    },
    // Empty
    emptyView: {
        alignItems: "center",
        marginTop: 60,
        gap: 10,
    },
    emptyText: {
        fontSize: 16,
        color: "#94A3B8",
    },
});