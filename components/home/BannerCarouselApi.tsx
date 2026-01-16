/**
 * Banner Carousel Component - API Version
 * ========================================
 * Carousel hiển thị banner từ API với auto-play, swipe và dots
 * Sử dụng FlatList native (không cần cài thêm package)
 */

import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ViewToken
} from "react-native";
import { Banner, fetchHomeBanners, getBannerImageUrl } from "../../services/bannerService";

const BANNER_HEIGHT = 180;
const AUTO_PLAY_INTERVAL = 3500; // 3.5 giây

interface BannerCarouselApiProps {
    onBannerPress?: (banner: Banner) => void;
}

const BannerCarouselApi: React.FC<BannerCarouselApiProps> = ({ onBannerPress }) => {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const BANNER_WIDTH = SCREEN_WIDTH - 32; // 16px padding mỗi bên

    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const flatListRef = useRef<FlatList>(null);
    const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch banners on mount
    useEffect(() => {
        loadBanners();
    }, []);

    // Auto-play effect
    useEffect(() => {
        if (banners.length > 1) {
            startAutoPlay();
        }
        return () => stopAutoPlay();
    }, [banners, activeIndex]);

    const loadBanners = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchHomeBanners();
            setBanners(data);
        } catch (err) {
            console.error("Error loading banners:", err);
            setError("Không thể tải banner");
        } finally {
            setLoading(false);
        }
    };

    const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayTimerRef.current = setInterval(() => {
            if (banners.length > 1) {
                const nextIndex = (activeIndex + 1) % banners.length;
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
            }
        }, AUTO_PLAY_INTERVAL);
    };

    const stopAutoPlay = () => {
        if (autoPlayTimerRef.current) {
            clearInterval(autoPlayTimerRef.current);
            autoPlayTimerRef.current = null;
        }
    };

    // Handle scroll end to update active index
    const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / BANNER_WIDTH);
        if (index >= 0 && index < banners.length) {
            setActiveIndex(index);
        }
    };

    // Viewability config for better tracking
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                setActiveIndex(viewableItems[0].index);
            }
        }
    ).current;

    /**
     * Xử lý điều hướng khi bấm banner
     * Dựa theo actionType và actionValue
     */
    const handleBannerPress = useCallback(
        (banner: Banner) => {
            // Callback custom nếu có
            if (onBannerPress) {
                onBannerPress(banner);
                return;
            }

            const { actionType, actionValue } = banner;

            switch (actionType) {
                case "NONE":
                    // Không làm gì - banner chỉ để hiển thị
                    break;

                case "INTERNAL":
                    // Điều hướng nội bộ theo URL tự nhập
                    if (actionValue) {
                        try {
                            // actionValue có thể là "/products", "/features/vouchers", etc.
                            router.push(actionValue as any);
                        } catch (err) {
                            console.error("Error navigating to internal URL:", err);
                        }
                    }
                    break;

                case "PRODUCTS":
                    // Điều hướng đến trang danh sách sản phẩm
                    router.push("/(main)/products");
                    break;

                case "CATEGORY":
                    // Điều hướng đến products với filter category
                    if (actionValue) {
                        router.push({
                            pathname: "/(main)/products",
                            params: { categoryId: actionValue },
                        });
                    } else {
                        router.push("/(main)/products");
                    }
                    break;

                case "VOUCHERS":
                    // Điều hướng đến trang vouchers
                    router.push("/features/vouchers");
                    break;

                case "PRODUCT_DETAIL":
                    // Điều hướng đến chi tiết sản phẩm
                    if (actionValue) {
                        router.push({
                            pathname: "/product/productDetail",
                            params: { id: actionValue },
                        });
                    }
                    break;

                case "EXTERNAL":
                    // Mở URL bên ngoài
                    if (actionValue) {
                        Linking.openURL(actionValue).catch((err) => {
                            console.error("Error opening external URL:", err);
                        });
                    }
                    break;

                default:
                    // Mặc định không làm gì
                    console.log("Unknown or empty action type:", actionType);
            }
        },
        [router, onBannerPress]
    );

    // Render single banner item
    const renderBannerItem = useCallback(
        ({ item }: { item: Banner }) => {
            const imageUrl = getBannerImageUrl(item.imageUrl);
            const hasText = item.title || item.subtitle;
            const isClickable = item.actionType && item.actionType !== "NONE";

            return (
                <TouchableOpacity
                    style={[styles.bannerItem, { width: BANNER_WIDTH }]}
                    activeOpacity={isClickable ? 0.9 : 1}
                    onPress={() => handleBannerPress(item)}
                    disabled={!isClickable}
                >
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                    />
                    {/* Chỉ hiển thị overlay nếu có title hoặc subtitle */}
                    {hasText && (
                        <View style={styles.overlay}>
                            <View style={styles.textContainer}>
                                {item.title && (
                                    <Text style={styles.title} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                )}
                                {item.subtitle && (
                                    <Text style={styles.subtitle} numberOfLines={2}>
                                        {item.subtitle}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            );
        },
        [handleBannerPress, BANNER_WIDTH]
    );

    const keyExtractor = useCallback((item: Banner) => item.id.toString(), []);

    const getItemLayout = useCallback(
        (_: unknown, index: number) => ({
            length: BANNER_WIDTH,
            offset: BANNER_WIDTH * index,
            index,
        }),
        [BANNER_WIDTH]
    );

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Đang tải banner...</Text>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <TouchableOpacity
                style={[styles.container, styles.errorContainer]}
                onPress={loadBanners}
            >
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.retryText}>Nhấn để thử lại</Text>
            </TouchableOpacity>
        );
    }

    // Empty state
    if (banners.length === 0) {
        return null; // Không hiển thị gì nếu không có banner
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={banners}
                renderItem={renderBannerItem}
                keyExtractor={keyExtractor}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={BANNER_WIDTH}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={onMomentumScrollEnd}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={getItemLayout}
                onScrollBeginDrag={stopAutoPlay}
                onScrollEndDrag={startAutoPlay}
                contentContainerStyle={styles.flatListContent}
            />

            {/* Dots Indicator */}
            {banners.length > 1 && (
                <View style={styles.dotsContainer}>
                    {banners.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                flatListRef.current?.scrollToIndex({ index, animated: true });
                            }}
                        >
                            <View
                                style={[
                                    styles.dot,
                                    index === activeIndex ? styles.activeDot : styles.inactiveDot,
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

export default BannerCarouselApi;

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    loadingContainer: {
        height: BANNER_HEIGHT,
        borderRadius: 16,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 8,
        color: "#6b7280",
        fontSize: 14,
    },
    errorContainer: {
        height: BANNER_HEIGHT,
        borderRadius: 16,
        backgroundColor: "#fee2e2",
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: "#dc2626",
        fontSize: 14,
        fontWeight: "600",
    },
    retryText: {
        marginTop: 4,
        color: "#9ca3af",
        fontSize: 12,
    },
    flatListContent: {
        // Padding được xử lý bởi container
    },
    bannerItem: {
        height: BANNER_HEIGHT,
        borderRadius: 16,
        overflow: "hidden",
    },
    bannerImage: {
        width: "100%",
        height: "100%",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "flex-end",
    },
    textContainer: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#ffffff",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 14,
        color: "#f3f4f6",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeDot: {
        backgroundColor: "#10b981",
        width: 24,
    },
    inactiveDot: {
        backgroundColor: "#d1d5db",
    },
});
