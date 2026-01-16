/**
 * Features Layout
 * ================
 * Stack navigator for feature screens (spin-wheel, vouchers, etc.)
 * These are non-tab screens that need their own navigation stack
 */

import { Stack } from "expo-router";
import React from "react";

export default function FeaturesLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="spin-wheel" />
            <Stack.Screen 
                name="vouchers" 
                options={{
                    headerShown: true,
                    title: "Mã giảm giá",
                    headerStyle: { backgroundColor: "#10b981" },
                    headerTintColor: "#fff",
                    headerTitleStyle: { fontWeight: "600" },
                }}
            />
        </Stack>
    );
}
