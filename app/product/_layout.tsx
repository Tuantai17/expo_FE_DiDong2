// app/product/_layout.tsx
import { Stack } from "expo-router";

export default function ProductLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                gestureEnabled: true,
                gestureDirection: "horizontal",
            }}
        >
            <Stack.Screen name="[id]" />
            <Stack.Screen 
                name="checkout" 
                options={{
                    animation: "slide_from_bottom",
                }}
            />
            <Stack.Screen 
                name="order-success" 
                options={{
                    animation: "fade",
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen 
                name="order-status" 
                options={{
                    animation: "slide_from_right",
                }}
            />
            <Stack.Screen 
                name="vnpay-webview" 
                options={{
                    animation: "slide_from_bottom",
                    gestureEnabled: false,
                }}
            />
        </Stack>
    );
}

