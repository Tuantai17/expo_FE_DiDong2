/**
 * NotificationBell Component
 * ==========================
 * Icon chuông thông báo với badge số lượng chưa đọc
 * Dùng ở header của app
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getUnreadCount, notificationPolling } from '../../services/notificationService';

interface NotificationBellProps {
    size?: number;
    color?: string;
    onPress?: () => void;
}

export function NotificationBell({
    size = 24,
    color = '#1f2937',
    onPress,
}: NotificationBellProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            notificationPolling.stopPolling();
            return;
        }

        // Start polling
        notificationPolling.startPolling(15000); // Poll every 15 seconds

        // Listen for unread count updates
        const unsubscribe = notificationPolling.onUnreadCount((count) => {
            setUnreadCount(count);
        });

        // Initial load
        getUnreadCount().then(setUnreadCount).catch(() => {});

        return () => {
            unsubscribe();
        };
    }, [isAuthenticated]);

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push('/account/notifications');
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Ionicons name="notifications-outline" size={size} color={color} />

            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
});

export default NotificationBell;
