// app/product/_layout.tsx
import { Stack } from "expo-router";

export default function ProductLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="[id]" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="order-success" />
            <Stack.Screen name="order-status" />
        </Stack>
    );
}
