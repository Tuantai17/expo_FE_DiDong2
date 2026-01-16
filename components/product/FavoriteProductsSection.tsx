// components/product/FavoriteProductsSection.tsx
/**
 * FavoriteProductsSection - Hiển thị danh sách sản phẩm yêu thích
 * ================================================================
 * Hiển thị grid các sản phẩm đã thêm vào yêu thích
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ListRenderItem,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FavoriteItem, useFavorite } from "../../context/FavoriteContext";
import ProductCard from "./ProductCard";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = 16;
const GAP = 12;

export default function FavoriteProductsSection() {
    const router = useRouter();
    const { favorites, favoritesCount, clearAllFavorites, isLoading } = useFavorite();

    const renderItem: ListRenderItem<FavoriteItem> = ({ item, index }) => {
        const isLeftItem = index % 2 === 0;
        return (
            <View style={[styles.cardWrapper, isLeftItem ? styles.cardLeft : styles.cardRight]}>
                <ProductCard
                    id={item.id}
                    tag={item.tag}
                    name={item.name}
                    price={item.price}
                    image={item.image}
                    onPress={() =>
                        router.push({
                            pathname: "/product/productDetail",
                            params: { id: item.id },
                        })
                    }
                    onAddPress={() => {
                        console.log("Add to cart from favorites:", item.name);
                    }}
                />
            </View>
        );
    };

    // Loading State
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B9EE1" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    // Empty State Component
    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
                <Ionicons name="heart-outline" size={64} color="#E2E8F0" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
            <Text style={styles.emptySubtitle}>
                Nhấn vào biểu tượng trái tim trên bất kỳ sản phẩm nào để thêm vào danh sách yêu thích của bạn
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/(main)")}
            >
                <Ionicons name="search-outline" size={18} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Khám phá sản phẩm</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="heart" size={24} color="#EF4444" />
                    <Text style={styles.title}>Yêu thích của tôi</Text>
                    {favoritesCount > 0 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{favoritesCount}</Text>
                        </View>
                    )}
                </View>

                {/* Clear All Button */}
                {favoritesCount > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            clearAllFavorites();
                        }}
                    >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text style={styles.clearButtonText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Product List or Empty State */}
            {favorites.length === 0 ? (
                <EmptyState />
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: "#64748B",
    },
    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 16,
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0F172A",
    },
    countBadge: {
        backgroundColor: "#5B9EE1",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    clearButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#FEE2E2",
        borderRadius: 10,
    },
    clearButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#EF4444",
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
    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    emptyIconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 2,
            },
        }),
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
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    browseButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "#5B9EE1",
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.25,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
    browseButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
