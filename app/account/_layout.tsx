// app/account/_layout.tsx
import { Stack } from "expo-router";

export default function AccountLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="my-orders" />
            <Stack.Screen name="address" />
            <Stack.Screen name="settings" />
        </Stack>
    );
}
