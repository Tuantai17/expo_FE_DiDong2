// components/home/NewArrivalCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
    GestureResponderEvent,
    Image,
    ImageSourcePropType,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
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

type Props = {
  id: string;
  tag: string;
  name: string;
  price: string;
  image: ImageSourcePropType | { uri: string };
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onAddPress?: () => void;
};

export default function NewArrivalCard({
  id,
  tag,
  name,
  price,
  image,
  style,
  onPress,
  onAddPress,
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorite();
  const { triggerCartFly, triggerFavoriteFly } = useFlyAnimation();
  const isLiked = isFavorite(id);

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
      case "BEST CHOICE":
        return "#F59E0B"; // Amber
      case "HOT":
        return "#EF4444"; // Red
      case "NEW":
        return "#10B981"; // Emerald
      default:
        return "#60A5FA"; // Blue
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
        style,
        pressed && Platform.OS !== "web" && { opacity: 0.95 },
      ]}
    >
      <Animated.View style={cardAnimatedStyle}>
        {/* Image container */}
        <View style={styles.imageContainer}>
          <Image source={image} style={styles.productImage} />

          {/* Favorite Button - with stopPropagation */}
          <Animated.View style={[styles.favoriteWrapper, favoriteAnimatedStyle]}>
            <Pressable
              ref={favoriteButtonRef as any}
              style={[
                styles.favoriteButton,
                isLiked && styles.favoriteButtonActive,
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
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleAddToCart}
                onStartShouldSetResponder={() => true}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
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
    width: 180,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#5B9EE1",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    position: "relative",
  },
  productImage: {
    width: "85%",
    height: "100%",
    resizeMode: "contain",
  },
  favoriteWrapper: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  favoriteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  infoContainer: {
    padding: 14,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5B9EE1",
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
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
