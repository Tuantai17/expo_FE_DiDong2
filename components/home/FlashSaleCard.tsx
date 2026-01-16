// components/home/FlashSaleCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef } from "react";
import {
    Image,
    ImageSourcePropType,
    Pressable,
    StyleSheet,
    Text,
    View,
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
type FlashSaleCardProps = {
    id: string;
    name: string;
    brand?: string;
    price: number;
    priceRoot: number;
    image: ImageSourcePropType | { uri: string };
    rating?: number;
    reviewCount?: number;
    onPress?: () => void;
    onAddPress?: () => void;
};

// ============================================
// CONSTANTS
// ============================================
const CARD_WIDTH = 160;

// ============================================
// HELPER FUNCTIONS
// ============================================
const calculateDiscountPercent = (price: number, priceRoot: number): number => {
    if (!priceRoot || priceRoot <= price) return 0;
    return Math.round(((priceRoot - price) / priceRoot) * 100);
};

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
};

// ============================================
// COMPONENT
// ============================================
export default function FlashSaleCard({
    id,
    name,
    brand,
    price,
    priceRoot,
    image,
    rating = 0,
    reviewCount = 0,
    onPress,
    onAddPress,
}: FlashSaleCardProps) {
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
            withTiming(0.95, { duration: 50 }),
            withSpring(1, { damping: 15, stiffness: 300 })
        );
        onPress?.();
    };

    // Handle favorite press - only animate fly when ADDING
    const handleFavoritePress = (e: any) => {
        e.stopPropagation();
        
        // Only fly animation when ADDING favorite, not removing
        if (!isLiked) {
            haptics.addFavorite();
            
            // Scale animation
            favoriteScale.value = withSequence(
                withSpring(1.4, { damping: 10, stiffness: 400 }),
                withSpring(1, { damping: 15, stiffness: 300 })
            );

            // Trigger fly animation
            if (favoriteButtonRef.current) {
                favoriteButtonRef.current.measureInWindow((x, y, width, height) => {
                    triggerFavoriteFly(image, x + width / 2 - 30, y - 30);
                });
            }
        } else {
            // Simple haptic for removing favorite
            haptics.buttonPress();
        }

        toggleFavorite({ id, name, price: formatPrice(price), image, tag: brand || "" });
    };

    // Handle add to cart - with fly animation
    const handleAddToCart = (e: any) => {
        e.stopPropagation();
        haptics.addToCart();
        
        // Scale animation
        addButtonScale.value = withSequence(
            withSpring(1.4, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 15, stiffness: 300 })
        );

        // Trigger fly animation
        if (addButtonRef.current) {
            addButtonRef.current.measureInWindow((x, y, width, height) => {
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
        <Pressable onPress={handlePress} style={styles.container}>
            <Animated.View style={[styles.card, cardAnimatedStyle]}>
                {/* Image Container with gradient background */}
                <View style={styles.imageContainer}>
                    {/* Background layer */}
                    <View style={styles.gradientBase} />
                    
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
                                color={isLiked ? "#EF4444" : "#94A3B8"}
                            />
                        </Pressable>
                    </Animated.View>
                </View>

                {/* Product Info Section */}
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
                    {rating > 0 && (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color="#FFC107" />
                            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                            {reviewCount > 0 && (
                                <Text style={styles.reviewCount}>({reviewCount})</Text>
                            )}
                        </View>
                    )}

                    {/* Price Row */}
                    <View style={styles.priceRow}>
                        <View style={styles.priceInfo}>
                            {/* Discounted Price */}
                            <Text style={styles.price}>{formatPrice(price)}</Text>
                            
                            {/* Original Price (strikethrough) */}
                            {discountPercent > 0 && (
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
        marginRight: 12,
    },
    card: {
        width: CARD_WIDTH,
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
        height: 120,
        position: "relative",
        overflow: "hidden",
    },
    gradientBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#F1F5F9",
    },
    productImage: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
        zIndex: 1,
    },
    discountBadge: {
        position: "absolute",
        top: 8,
        left: 8,
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
        top: 8,
        right: 8,
        zIndex: 2,
    },
    favoriteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    favoriteButtonActive: {
        backgroundColor: "#FEE2E2",
        borderColor: "#FECACA",
    },
    // Info Section
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
        marginBottom: 6,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#0F172A",
        marginLeft: 4,
    },
    reviewCount: {
        fontSize: 10,
        color: "#9CA3AF",
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
        color: "#5B9EE1",
    },
    priceOriginal: {
        fontSize: 11,
        color: "#6B7280",
        textDecorationLine: "line-through",
        marginTop: 2,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: "#5B9EE1",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#5B9EE1",
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
});
