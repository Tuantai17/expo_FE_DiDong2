// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FavoriteProvider } from "../context/FavoriteContext";
import { OrderProvider } from "../context/OrderContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FavoriteProvider>
          <CartProvider>
            <OrderProvider>
              <Stack screenOptions={{ headerShown: false }}>
                {/* màn khởi động / redirect */}
                <Stack.Screen name="index" />

                {/* Onboarding */}
                <Stack.Screen name="onboarding/onboarding1" />
                <Stack.Screen name="onboarding/onboarding2" />
                <Stack.Screen name="onboarding/onboarding3" />

                {/* Auth screens */}
                <Stack.Screen name="(auth)" />

                {/* Nhóm màn main dùng tabs */}
                <Stack.Screen name="(main)" />
              </Stack>
            </OrderProvider>
          </CartProvider>
        </FavoriteProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
