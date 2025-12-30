// components/home/NewArrivalCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
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
  const isLiked = isFavorite(id);

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
            size={16}
            color={isLiked ? "#EF4444" : "#94A3B8"}
          />
        </TouchableOpacity>
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
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
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
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
});
