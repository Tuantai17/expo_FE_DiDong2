/**
 * Support Layout - Layout cho Support screens
 */

import { Stack } from 'expo-router';

export default function SupportLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#10b981' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '600' },
                headerBackTitle: 'Quay lại',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Trợ giúp & Hỗ trợ',
                }}
            />
            <Stack.Screen
                name="create-ticket"
                options={{
                    title: 'Tạo yêu cầu hỗ trợ',
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="ticket-list"
                options={{
                    title: 'Lịch sử yêu cầu',
                }}
            />
            <Stack.Screen
                name="ticket-detail"
                options={{
                    title: 'Chi tiết yêu cầu',
                }}
            />
            <Stack.Screen
                name="notifications"
                options={{
                    title: 'Thông báo hỗ trợ',
                }}
            />
        </Stack>
    );
}
