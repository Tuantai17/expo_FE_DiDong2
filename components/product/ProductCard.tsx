// components/product/ProductCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef } from "react";
import {
  GestureResponderEvent,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle
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

// Constants for card calculation
const HORIZONTAL_PADDING = 16;
const GAP = 12;

type Props = {
  id: string;
  tag: string;
  name: string;
  price: string;
  image: ImageSourcePropType | { uri: string };
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onAddPress?: () => void;
  showFavoriteButton?: boolean;
};

export default function ProductCard({
  id,
  tag,
  name,
  price,
  image,
  style,
  onPress,
  onAddPress,
  showFavoriteButton = true,
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorite();
  const { triggerCartFly, triggerFavoriteFly } = useFlyAnimation();
  const isLiked = isFavorite(id);

  // Use useWindowDimensions for reactive width calculation
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate card width dynamically - memoized for performance
  const cardWidth = useMemo(() => {
    return (screenWidth - HORIZONTAL_PADDING * 2 - GAP) / 2;
  }, [screenWidth]);

  // Refs for measuring button positions
  const addButtonRef = useRef<View>(null);
  const favoriteButtonRef = useRef<View>(null);

  // Animation values
  const cardScale = useSharedValue(1);
  const addButtonScale = useSharedValue(1);
  const favoriteScale = useSharedValue(1);

  // Xác định màu tag dựa trên loại tag
  const getTagColor = () => {
    switch (tag) {
      case "BEST SELLER":
        return "#5B9EE1";
      case "BEST CHOICE":
        return "#F59E0B";
      case "HOT":
        return "#EF4444";
      case "NEW":
        return "#10B981";
      case "TRENDING":
        return "#8B5CF6";
      default:
        return "#60A5FA";
    }
  };

  // CRITICAL: Stop event propagation to parent card
  const handleFavoritePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    
    // Only animate when ADDING favorite, not removing
    if (!isLiked) {
      haptics.addFavorite();
      
      // Scale animation
      favoriteScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );

      // Trigger fly animation only when adding
      if (favoriteButtonRef.current) {
        favoriteButtonRef.current.measureInWindow((x, y, width, height) => {
          triggerFavoriteFly(image, x + width / 2 - 30, y - 30);
        });
      }
    } else {
      // Simple haptic for removing favorite
      haptics.buttonPress();
    }

    toggleFavorite({ id, tag, name, price, image });
  };

  // CRITICAL: Stop event propagation to parent card
  const handleAddToCart = (e: GestureResponderEvent) => {
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

    // Call parent handler if provided
    onAddPress?.();
  };

  const handleCardPress = () => {
    haptics.buttonPress();
    cardScale.value = withSequence(
      withTiming(0.97, { duration: 50 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onPress?.();
  };

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [
        styles.container,
        { width: cardWidth },
        style,
        pressed && Platform.OS !== 'web' && { opacity: 0.95 },
      ]}
    >
      <Animated.View style={cardAnimatedStyle}>
        {/* Image container */}
        <View style={styles.imageContainer}>
          <Image source={image} style={styles.productImage} />

          {/* Favorite Button - with stopPropagation */}
          {showFavoriteButton && (
            <Animated.View style={[styles.favoriteWrapper, favoriteAnimatedStyle]}>
              <Pressable
                ref={favoriteButtonRef as any}
                style={[
                  styles.favoriteButton,
                  isLiked && styles.favoriteButtonActive,
                ]}
                onPress={handleFavoritePress}
                // Block touch from bubbling to parent on web
                onStartShouldSetResponder={() => true}
              >
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={14}
                  color={isLiked ? "#EF4444" : "#94A3B8"}
                />
              </Pressable>
            </Animated.View>
          )}
        </View>

        {/* Tag badge */}
        <View style={[styles.tagBadge, { backgroundColor: getTagColor() }]}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>

        {/* Product info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{price}</Text>

            {/* Add to Cart Button - with stopPropagation */}
            <Animated.View style={addButtonAnimatedStyle}>
              <Pressable
                ref={addButtonRef as any}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && { backgroundColor: "#D4E6F9" },
                ]}
                onPress={handleAddToCart}
                // Block touch from bubbling to parent on web
                onStartShouldSetResponder={() => true}
              >
                <Ionicons name="add" size={16} color="#5B9EE1" />
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // width is now calculated dynamically using useWindowDimensions
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#5B9EE1",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 110,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    position: "relative",
  },
  productImage: {
    width: "75%",
    height: "100%",
    resizeMode: "contain",
  },
  favoriteWrapper: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  favoriteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  favoriteButtonActive: {
    backgroundColor: "#FEE2E2",
  },
  tagBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 7,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  infoContainer: {
    padding: 10,
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B9EE1",
  },
  addButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
});
