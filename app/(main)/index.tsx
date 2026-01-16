// app/(main)/index.tsx
import React, { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import FloatingChatButton from "../../components/chat/FloatingChatButton";
import BannerCarouselApi from "../../components/home/BannerCarouselApi";
import CategoryTabs from "../../components/home/CategoryTabs";
import HomeBestSellerSection from "../../components/home/HomeBestSellerSection";
import HomeFlashSaleSection from "../../components/home/HomeFlashSaleSection";
import HomeHeader from "../../components/home/HomeHeader";
import MiniGameBanner from "../../components/home/MiniGameBanner";
import DrawerMenu from "../../components/ui/DrawerMenu";
import SearchBar from "../../components/ui/SearchBar";

export default function HomeScreen() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header with menu button */}
      <HomeHeader />

      {/* Main scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B9EE1"]}
            tintColor="#5B9EE1"
          />
        }
      >
        {/* Search Bar */}
        <SearchBar />

        {/* Banner Carousel from API */}
        <BannerCarouselApi />

        {/* 🎰 Mini Game Vòng Quay Voucher */}
        <MiniGameBanner />

        {/* Category Tabs */}
        <CategoryTabs />

        {/* Flash Sale Section */}
        <HomeFlashSaleSection />

        {/* Featured Products */}
        {/* <HomeFlashSaleSection /> */}

        {/* Best Sellers */}
        <HomeBestSellerSection />
      </ScrollView>

      {/* Floating Chat Button */}
      <FloatingChatButton />

      {/* Drawer Menu - slides from left with overlay */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8,
  },
});
