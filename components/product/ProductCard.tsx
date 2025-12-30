// components/product/ProductCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useFavorite } from "../../context/FavoriteContext";

// Tính toán width card để 2 card vừa khít màn hình
const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = 16;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GAP) / 2;

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
  const isLiked = isFavorite(id);

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

  const handleFavoritePress = () => {
    toggleFavorite({ id, tag, name, price, image });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* Image container */}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.productImage} />

        {/* Favorite Button */}
        {showFavoriteButton && (
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isLiked && styles.favoriteButtonActive,
            ]}
            onPress={handleFavoritePress}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={14}
              color={isLiked ? "#EF4444" : "#94A3B8"}
            />
          </TouchableOpacity>
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

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={onAddPress}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
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
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
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
  addButtonText: {
    color: "#5B9EE1",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
  },
});
