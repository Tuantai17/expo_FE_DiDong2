// app/(main)/index.tsx
import React, { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import CategoryTabs from "../../components/home/CategoryTabs";
import HomeBanner from "../../components/home/HomeBanner";
import HomeHeader from "../../components/home/HomeHeader";
import HomeNewArrivalSection from "../../components/home/HomeNewArrivalSection";
import HomePopularSection from "../../components/home/HomePopularSection";
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
      <HomeHeader onMenuPress={() => setDrawerVisible(true)} />

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

        {/* Hero Banner */}
        <HomeBanner />

        {/* Category Tabs */}
        <CategoryTabs />

        {/* Popular / Best Sellers */}
        <HomePopularSection />

        {/* Featured Products */}
        {/* <HomePopularSection /> */}

        {/* New Arrivals */}
        <HomeNewArrivalSection />
      </ScrollView>

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
