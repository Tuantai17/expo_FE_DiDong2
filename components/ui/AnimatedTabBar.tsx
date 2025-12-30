import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    LayoutChangeEvent,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Kích thước indicator
const INDICATOR_SIZE = 50;

// Map route name to icon
const ROUTE_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    index: 'home-outline',
    products: 'bag-handle-outline',
    cart: 'bag-outline',
    favorite: 'heart-outline',
    profile: 'person-outline',
};

// Icon khi active (filled icons)
const ROUTE_ICONS_ACTIVE: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    index: 'home',
    products: 'bag-handle',
    cart: 'bag',
    favorite: 'heart',
    profile: 'person',
};

// Các route chính cần hiển thị trên tab bar
const MAIN_ROUTES = ['index', 'products', 'cart', 'favorite', 'profile'];

interface AnimatedTabBarProps extends BottomTabBarProps { }

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
    state,
    navigation,
}) => {
    const insets = useSafeAreaInsets();

    // State để lưu width thực tế của container
    const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
    const tabWidth = containerWidth / MAIN_ROUTES.length;

    // Animation values
    const translateX = useRef(new Animated.Value(0)).current;
    const indicatorScale = useRef(new Animated.Value(1)).current;

    // Icon scale animations for each tab
    const iconScales = useRef(
        MAIN_ROUTES.map(() => new Animated.Value(1))
    ).current;

    // Lọc chỉ các route chính
    const mainRoutes = state.routes.filter((route) =>
        MAIN_ROUTES.includes(route.name)
    );

    // Tìm index của tab đang active trong mainRoutes
    const activeRoute = state.routes[state.index];
    const activeMainIndex = MAIN_ROUTES.indexOf(activeRoute?.name || 'index');
    const currentIndex = activeMainIndex >= 0 ? activeMainIndex : 0;

    // Tính toán vị trí indicator
    const getIndicatorPosition = (index: number): number => {
        return tabWidth * index + (tabWidth - INDICATOR_SIZE) / 2;
    };

    // Xử lý khi layout thay đổi (ví dụ: xoay màn hình)
    const onContainerLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    // Animation chạy khi chuyển tab
    useEffect(() => {
        const targetPosition = getIndicatorPosition(currentIndex);

        // Animation cho indicator trượt
        Animated.parallel([
            // Di chuyển indicator
            Animated.spring(translateX, {
                toValue: targetPosition,
                useNativeDriver: true,
                friction: 6,
                tension: 80,
                velocity: 3,
            }),
            // Scale indicator nhẹ
            Animated.sequence([
                Animated.timing(indicatorScale, {
                    toValue: 0.85,
                    duration: 80,
                    useNativeDriver: true,
                }),
                Animated.spring(indicatorScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 4,
                    tension: 100,
                }),
            ]),
        ]).start();

        // Animation cho icon được chọn
        iconScales.forEach((scale, index) => {
            if (index === currentIndex) {
                // Icon active: bounce effect
                Animated.sequence([
                    Animated.timing(scale, {
                        toValue: 1.2,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                        friction: 3,
                        tension: 150,
                    }),
                ]).start();
            } else {
                // Icon không active: về lại scale 1
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }).start();
            }
        });
    }, [currentIndex, tabWidth]);

    // Set vị trí ban đầu cho indicator
    useEffect(() => {
        translateX.setValue(getIndicatorPosition(currentIndex));
    }, [containerWidth]);

    const handleTabPress = (routeName: string, routeKey: string) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
            navigation.navigate(routeName);
        }
    };

    const handleTabLongPress = (routeKey: string) => {
        navigation.emit({
            type: 'tabLongPress',
            target: routeKey,
        });
    };

    return (
        <View
            style={[
                styles.container,
                { paddingBottom: Math.max(insets.bottom, 8) }
            ]}
            onLayout={onContainerLayout}
        >
            {/* Sliding Indicator */}
            <Animated.View
                style={[
                    styles.indicator,
                    {
                        transform: [
                            { translateX },
                            { scale: indicatorScale },
                        ],
                    },
                ]}
            />

            {/* Tab Icons */}
            {mainRoutes.map((route, index) => {
                const isFocused = currentIndex === index;
                const isCartTab = route.name === 'cart';
                const iconName = isFocused
                    ? ROUTE_ICONS_ACTIVE[route.name]
                    : ROUTE_ICONS[route.name];

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={route.name}
                        activeOpacity={0.7}
                        onPress={() => handleTabPress(route.name, route.key)}
                        onLongPress={() => handleTabLongPress(route.key)}
                        style={styles.tabButton}
                    >
                        {isCartTab ? (
                            // Cart tab - Nút tròn xanh nổi lên ở giữa
                            <View style={styles.cartTabWrapper}>
                                {/* Outer glow layers */}
                                <View style={styles.cartGlow1} />
                                <View style={styles.cartGlow2} />
                                {/* Main cart button */}
                                <View style={styles.cartCircle}>
                                    <Ionicons name="bag-outline" size={24} color="#FFFFFF" />
                                </View>
                            </View>
                        ) : (
                            // Tab thường với animation
                            <Animated.View
                                style={[
                                    styles.iconWrapper,
                                    {
                                        transform: [{ scale: iconScales[index] }],
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={26}
                                    color={isFocused ? '#5B9EE1' : '#B8C5D0'}
                                />
                            </Animated.View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 70,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'space-around',
        // Cross-platform shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 12,
            },
            web: {
                boxShadow: '0px -4px 8px rgba(0, 0, 0, 0.08)',
            } as any,
        }),
    },
    indicator: {
        position: 'absolute',
        width: INDICATOR_SIZE,
        height: INDICATOR_SIZE,
        borderRadius: INDICATOR_SIZE / 2,
        backgroundColor: 'rgba(91, 158, 225, 0.15)',
        top: 10,
        left: 0,
        // Glow effect
        ...Platform.select({
            ios: {
                shadowColor: '#5B9EE1',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
            },
            android: {
                elevation: 0,
            },
            web: {
                boxShadow: '0px 0px 12px rgba(91, 158, 225, 0.4)',
            } as any,
        }),
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        paddingTop: 5,
    },
    iconWrapper: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 25,
    },
    // Cart button styles
    cartTabWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -35,
    },
    cartGlow1: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#5B9EE1',
        opacity: 0.1,
    },
    cartGlow2: {
        position: 'absolute',
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#5B9EE1',
        opacity: 0.18,
    },
    cartCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#5B9EE1',
        alignItems: 'center',
        justifyContent: 'center',
        // Shadow
        ...Platform.select({
            ios: {
                shadowColor: '#5B9EE1',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
            },
            android: {
                elevation: 10,
            },
            web: {
                boxShadow: '0px 6px 12px rgba(91, 158, 225, 0.4)',
            } as any,
        }),
    },
});

export default AnimatedTabBar;
