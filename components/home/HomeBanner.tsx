// components/HomeBanner.tsx
/**
 * Home Banner Component
 * - Hiển thị banner quảng cáo thương hiệu (Nike)
 * - Khi click vào banner hoặc nút sẽ navigate đến trang products với categoryId của Nike
 */

import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Nike category ID (category id = 1 in the database)
const NIKE_CATEGORY_ID = 1;

const HomeBanner = () => {
  const router = useRouter();

  // Navigate to products page with Nike category filter
  const handleBannerPress = () => {
    router.push({
      pathname: "/(main)/products",
      params: { categoryId: NIKE_CATEGORY_ID.toString() },
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleBannerPress}
      activeOpacity={0.9}
    >
      {/* Text bên trái */}
      <View style={{ flex: 1 }}>
        <Text style={styles.smallText}>Just do it with</Text>
        <Text style={styles.title}>Nike</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleBannerPress}
        >
          <Text style={styles.buttonText}>Xem bộ sưu tập</Text>
        </TouchableOpacity>
      </View>

      {/* Hình giày bên phải */}
      <Image
        source={require("../../assets/images/home/bannergiay1.png")}
        style={styles.shoeImage}
      />
    </TouchableOpacity>
  );
};

export default HomeBanner;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#1F2937", // nền tối
    flexDirection: "row",
    alignItems: "center",
  },
  smallText: {
    fontSize: 12,
    color: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    alignSelf: "flex-start",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  shoeImage: {
    width: 110,
    height: 80,
    resizeMode: "contain",
    marginLeft: 8,
  },
});
