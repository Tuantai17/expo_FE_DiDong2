// components/home/HomeHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useCart } from "../../context/CartContext";

type HomeHeaderProps = {
  onMenuPress?: () => void;
};

export default function HomeHeader({ onMenuPress }: HomeHeaderProps) {
  const router = useRouter();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <View style={styles.container}>
      {/* Menu button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <Ionicons name="menu-outline" size={22} color="#0F172A" />
      </TouchableOpacity>

      {/* Location */}
      <TouchableOpacity style={styles.locationContainer} activeOpacity={0.8}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={14} color="#5B9EE1" />
        </View>
        <View>
          <Text style={styles.storeLabel}>Store location</Text>
          <View style={styles.storeNameRow}>
            <Text style={styles.storeName}>Mondolibug, Sylhet</Text>
            <Ionicons name="chevron-down" size={14} color="#64748B" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Icons */}
      <View style={styles.rightIcons}>
        {/* Wishlist */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(main)/favorite")}
          activeOpacity={0.7}
        >
          <Ionicons name="heart-outline" size={22} color="#0F172A" />
        </TouchableOpacity>

        {/* Cart with badge */}
        <TouchableOpacity
          style={[styles.iconButton, styles.cartButton]}
          onPress={() => router.push("/(main)/cart")}
          activeOpacity={0.7}
        >
          <Ionicons name="bag-outline" size={22} color="#0F172A" />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cartButton: {
    marginLeft: 10,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  locationContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  storeLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
});
