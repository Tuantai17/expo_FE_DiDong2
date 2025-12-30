import { Tabs } from "expo-router";
import { AnimatedTabBar } from "../../components/ui/AnimatedTabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />

      {/* Products */}
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
        }}
      />

      {/* Cart - Center with special styling */}
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
        }}
      />

      {/* Favorite */}
      <Tabs.Screen
        name="favorite"
        options={{
          title: "Favorite",
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />

      {/* ===== Hidden Screens (không hiện icon trên tab bar) ===== */}

      <Tabs.Screen
        name="about"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="productDetail"
        options={{
          href: null,
        }}
      />

      {/* Nếu cần màn chi tiết riêng cho favorite */}
      <Tabs.Screen
        name="favoriteDetail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
