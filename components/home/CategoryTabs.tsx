// components/CategoryTabs.tsx
/**
 * Category Tabs Component
 * - Hiển thị các brand icons (Nike, Adidas, Puma, etc.)
 * - Khi click vào một brand sẽ navigate đến trang products với categoryId tương ứng
 */

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "../../services/api";

// Brand icons mapping
const brandImages: Record<string, ImageSourcePropType> = {
  nike: require("../../assets/images/home/nike.png"),
  adidas: require("../../assets/images/home/adidas.png"),
  puma: require("../../assets/images/home/puma.png"),
  pumma: require("../../assets/images/home/puma.png"), // Handle typo in DB
  vans: require("../../assets/images/home/under_armour.png"), // Using under_armour image for vans
  converse: require("../../assets/images/home/converse.png"),
};

// Fallback brand image
const fallbackImage = require("../../assets/images/home/nike.png");

interface Category {
  id: number;
  name: string;
  slug?: string;
}

interface BrandItem {
  id: number;
  name: string;
  image: ImageSourcePropType;
}

const CategoryTabs = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<BrandItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<Category[]>("/api/categories");
        const cats = response.data;

        // Map categories to brand items with images
        const mappedBrands: BrandItem[] = cats.map((cat) => {
          const brandKey = cat.name.toLowerCase().trim();
          const image = brandImages[brandKey] || fallbackImage;
          return {
            id: cat.id,
            name: cat.name,
            image,
          };
        });

        setCategories(mappedBrands);
        console.log("[CategoryTabs] Loaded categories:", mappedBrands.length);
      } catch (error) {
        console.error("[CategoryTabs] Failed to load categories:", error);
        // Fallback to static brands if API fails
        setCategories([
          { id: 1, name: "Nike", image: brandImages.nike },
          { id: 2, name: "Adidas", image: brandImages.adidas },
          { id: 3, name: "Puma", image: brandImages.puma },
          { id: 4, name: "Converse", image: brandImages.converse },
          { id: 5, name: "Vans", image: brandImages.vans },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle category press - navigate to products page with categoryId
  const handleCategoryPress = (categoryId: number) => {
    console.log("[CategoryTabs] Selected category:", categoryId);
    setActiveId(categoryId);

    // Navigate to products page with categoryId
    router.push({
      pathname: "/(main)/products",
      params: { categoryId: categoryId.toString() },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#5B9EE1" />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {categories.map((item) => {
        const isActive = item.id === activeId;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => handleCategoryPress(item.id)}
            activeOpacity={0.7}
          >
            <Image
              source={item.image}
              style={[
                styles.brandImage,
                isActive && styles.brandImageActive
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default CategoryTabs;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  loadingContainer: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  pill: {
    width: 70,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandImage: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    tintColor: undefined,
  },
  brandImageActive: {
    tintColor: "#FFFFFF",
  },
});
