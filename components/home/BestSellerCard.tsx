// components/home/BestSellerCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef } from "react";
import {
    Image,
    ImageSourcePropType,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useFavorite } from "../../context/FavoriteContext";
import haptics from "../../utils/haptics";
import { useFlyAnimation } from "../ui/FlyToAnimation";

// ============================================
// TYPES
// ============================================
type BestSellerCardProps = {
    id: string;
    name: string;
    brand?: string;
    price: number;
    priceRoot?: number;
    image: ImageSourcePropType | { uri: string };
    rating?: number;
    reviewCount?: number;
    colorIndex?: number; // 0-3 for different gradient colors
    onPress?: () => void;
    onAddPress?: () => void;
};

// ============================================
// CONSTANTS
// ============================================
const CARD_PADDING = 16;
const CARD_GAP = 16; // Increased for better spacing

// Light gray background for all cards
const IMAGE_BG_COLOR = "#F1F5F9";

// ============================================
// HELPER FUNCTIONS
// ============================================
const calculateDiscountPercent = (price: number, priceRoot?: number): number => {
    if (!priceRoot || priceRoot <= price) return 0;
    return Math.round(((priceRoot - price) / priceRoot) * 100);
};

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
};

// ============================================
// COMPONENT
// ============================================
export default function BestSellerCard({
    id,
    name,
    brand,
    price,
    priceRoot,
    image,
    rating = 0,
    reviewCount = 0,
    colorIndex = 0,
    onPress,
    onAddPress,
}: BestSellerCardProps) {
    const { width } = useWindowDimensions();
    const cardWidth = (width - CARD_PADDING * 2 - CARD_GAP) / 2;

    // Favorites
    const { isFavorite, toggleFavorite } = useFavorite();
    const isLiked = isFavorite(id);

    // Fly Animation
    const { triggerCartFly, triggerFavoriteFly } = useFlyAnimation();

    // Calculate discount percentage
    const discountPercent = useMemo(
        () => calculateDiscountPercent(price, priceRoot),
        [price, priceRoot]
    );

    // Use consistent light gray background
    const bgColor = IMAGE_BG_COLOR;

    // Animation values
    const cardScale = useSharedValue(1);
    const favoriteScale = useSharedValue(1);
    const addButtonScale = useSharedValue(1);

    // Refs for measuring button positions
    const favoriteButtonRef = useRef<View>(null);
    const addButtonRef = useRef<View>(null);

    // Handle card press
    const handlePress = () => {
        haptics.buttonPress();
        cardScale.value = withSequence(
            withTiming(0.96, { duration: 50 }),
            withSpring(1, { damping: 15, stiffness: 300 })
        );
        onPress?.();
    };

    // Handle favorite press - only animate fly when ADDING
    const handleFavoritePress = (e: any) => {
        e.stopPropagation();
        
        if (!isLiked) {
            haptics.addFavorite();
            
            favoriteScale.value = withSequence(
                withSpring(1.4, { damping: 10, stiffness: 400 }),
                withSpring(1, { damping: 15, stiffness: 300 })
            );

            if (favoriteButtonRef.current) {
                favoriteButtonRef.current.measureInWindow((x, y, w, h) => {
                    triggerFavoriteFly(image, x + w / 2 - 30, y - 30);
                });
            }
        } else {
            haptics.buttonPress();
        }

        toggleFavorite({ id, name, price: formatPrice(price), image, tag: brand || "" });
    };

    // Handle add to cart - with fly animation
    const handleAddToCart = (e: any) => {
        e.stopPropagation();
        haptics.addToCart();
        
        addButtonScale.value = withSequence(
            withSpring(1.4, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 15, stiffness: 300 })
        );

        if (addButtonRef.current) {
            addButtonRef.current.measureInWindow((x, y) => {
                triggerCartFly(image, x - 20, y - 30);
            });
        }

        onAddPress?.();
    };

    // Animated styles
    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
    }));

    const favoriteAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: favoriteScale.value }],
    }));

    const addButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: addButtonScale.value }],
    }));

    return (
        <Pressable onPress={handlePress} style={[styles.container, { width: cardWidth }]}>
            <Animated.View style={[styles.card, cardAnimatedStyle]}>
                {/* Image Container with light background */}
                <View style={[styles.imageContainer, { backgroundColor: bgColor }]}>
                    {/* Product Image */}
                    <Image source={image} style={styles.productImage} />

                    {/* Discount Badge - Top Left */}
                    {discountPercent > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                                -{discountPercent}%
                            </Text>
                        </View>
                    )}

                    {/* Favorite Button - Top Right */}
                    <Animated.View style={[styles.favoriteWrapper, favoriteAnimatedStyle]}>
                        <Pressable
                            ref={favoriteButtonRef as any}
                            style={[
                                styles.favoriteButton,
                                isLiked && styles.favoriteButtonActive
                            ]}
                            onPress={handleFavoritePress}
                            onStartShouldSetResponder={() => true}
                        >
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={16}
                            color={isLiked ? "#EF4444" : "#64748B"}
                        />
                        </Pressable>
                    </Animated.View>
                </View>

                {/* Product Info Section - Dark Background */}
                <View style={styles.infoContainer}>
                    {/* Brand */}
                    {brand && (
                        <Text style={styles.brand} numberOfLines={1}>
                            {brand}
                        </Text>
                    )}

                    {/* Product Name */}
                    <Text style={styles.name} numberOfLines={1}>
                        {name}
                    </Text>

                    {/* Rating Row */}
                    {(rating > 0 || reviewCount > 0) && (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color="#FFC107" />
                            <Text style={styles.ratingText}>
                                {rating > 0 ? rating.toFixed(1) : "4.5"}
                            </Text>
                            <Text style={styles.reviewCount}>
                                ({reviewCount > 0 ? reviewCount : Math.floor(Math.random() * 500 + 100)})
                            </Text>
                        </View>
                    )}

                    {/* Price Row */}
                    <View style={styles.priceRow}>
                        <View style={styles.priceInfo}>
                            {/* Discounted Price */}
                            <Text style={styles.price}>{formatPrice(price)}</Text>
                            
                            {/* Original Price (strikethrough) - only show if priceRoot exists, > 0 and > price */}
                            {priceRoot && priceRoot > 0 && priceRoot > price && (
                                <Text style={styles.priceOriginal}>
                                    {formatPrice(priceRoot)}
                                </Text>
                            )}
                        </View>

                        {/* Add to Cart Button */}
                        <Animated.View style={addButtonAnimatedStyle}>
                            <Pressable
                                ref={addButtonRef as any}
                                style={styles.addButton}
                                onPress={handleAddToCart}
                                onStartShouldSetResponder={() => true}
                            >
                                <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                            </Pressable>
                        </Animated.View>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        marginBottom: CARD_GAP,
    },
    card: {
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        overflow: "hidden",
    },
    // Image Section
    imageContainer: {
        width: "100%",
        height: 140,
        position: "relative",
        overflow: "hidden",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    productImage: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
        zIndex: 1,
    },
    discountBadge: {
        position: "absolute",
        top: 10,
        left: 10,
        backgroundColor: "#FF4757",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        zIndex: 2,
    },
    discountText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "700",
    },
    favoriteWrapper: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 2,
    },
    favoriteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    favoriteButtonActive: {
        backgroundColor: "#FEE2E2",
        borderColor: "#FECACA",
    },
    // Info Section - Light
    infoContainer: {
        padding: 12,
        backgroundColor: "#FFFFFF",
    },
    brand: {
        fontSize: 11,
        fontWeight: "500",
        color: "#64748B",
        marginBottom: 2,
    },
    name: {
        fontSize: 13,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#0F172A",
        marginLeft: 4,
    },
    reviewCount: {
        fontSize: 10,
        color: "#64748B",
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    priceInfo: {
        flex: 1,
    },
    price: {
        fontSize: 14,
        fontWeight: "700",
        color: "#5B9EE1", // Blue for price
    },
    priceOriginal: {
        fontSize: 10,
        color: "#6B7280",
        textDecorationLine: "line-through",
        marginTop: 2,
    },
    addButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "#5B9EE1",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.4,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
});
