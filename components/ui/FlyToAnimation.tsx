/**
 * FlyToAnimation Component
 * ========================
 * Creates a flying animation effect for items going to cart or favorites
 * Uses react-native-reanimated for smooth 60fps animations
 */

import React, { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    ImageSourcePropType,
    StyleSheet,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// =================== TYPES =====================

interface FlyingItem {
  id: string;
  image: ImageSourcePropType | { uri: string };
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: "cart" | "favorite";
}

interface FlyToAnimationProps {
  item: FlyingItem | null;
  onComplete?: () => void;
}

// =================== SINGLETON MANAGER =====================

type FlyCallback = (item: FlyingItem) => void;
let flyCallback: FlyCallback | null = null;

export const triggerFlyAnimation = (item: FlyingItem) => {
  if (flyCallback) {
    flyCallback(item);
  }
};

export const registerFlyCallback = (callback: FlyCallback | null) => {
  flyCallback = callback;
};

// =================== TARGET POSITIONS =====================

// These should match the tab bar icon positions
export const FLY_TARGETS = {
  cart: { x: SCREEN_WIDTH - 60, y: SCREEN_HEIGHT - 40 },
  favorite: { x: SCREEN_WIDTH / 2 + 40, y: SCREEN_HEIGHT - 40 },
};

// =================== FLYING ITEM COMPONENT =====================

const FlyingItemView: React.FC<FlyToAnimationProps> = ({ item, onComplete }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!item) return;

    const deltaX = item.endX - item.startX;
    const deltaY = item.endY - item.startY;

    // Reset initial position
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    opacity.value = 1;
    rotate.value = 0;

    // Animate with bezier curve effect
    translateX.value = withTiming(deltaX, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    translateY.value = withSequence(
      // First rise up slightly
      withTiming(deltaY * 0.3 - 50, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      }),
      // Then curve down to target
      withTiming(deltaY, {
        duration: 400,
        easing: Easing.bezier(0.45, 0, 0.55, 1),
      })
    );

    // Scale down as it flies
    scale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(0.3, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // Rotate slightly
    rotate.value = withTiming(item.type === "cart" ? 15 : -15, {
      duration: 600,
    });

    // Fade out at the end
    opacity.value = withDelay(
      400,
      withTiming(0, { duration: 200 })
    );

    // Notify completion
    const timeout = setTimeout(() => {
      onComplete?.();
    }, 650);

    return () => clearTimeout(timeout);
  }, [item]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (!item) return null;

  return (
    <Animated.View
      style={[
        styles.flyingItem,
        {
          left: item.startX,
          top: item.startY,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.flyingItemInner,
          item.type === "favorite" && styles.flyingItemFavorite,
        ]}
      >
        <Image
          source={item.image}
          style={styles.flyingImage}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
};

// =================== MAIN PROVIDER COMPONENT =====================

export const FlyToAnimationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  const addFlyingItem = useCallback((item: FlyingItem) => {
    const newItem = { ...item, id: `${item.id}-${Date.now()}` };
    setFlyingItems((prev) => [...prev, newItem]);
  }, []);

  const removeFlyingItem = useCallback((id: string) => {
    setFlyingItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Register callback on mount
  useEffect(() => {
    registerFlyCallback(addFlyingItem);
    return () => registerFlyCallback(null);
  }, [addFlyingItem]);

  return (
    <View style={styles.provider}>
      {children}
      {/* Flying items overlay */}
      <View style={styles.flyingContainer} pointerEvents="none">
        {flyingItems.map((item) => (
          <FlyingItemView
            key={item.id}
            item={item}
            onComplete={() => removeFlyingItem(item.id)}
          />
        ))}
      </View>
    </View>
  );
};

// =================== HOOK FOR EASY ACCESS =====================

export const useFlyAnimation = () => {
  const triggerCartFly = useCallback(
    (
      image: ImageSourcePropType | { uri: string },
      startX: number,
      startY: number
    ) => {
      triggerFlyAnimation({
        id: `cart-${Date.now()}`,
        image,
        startX,
        startY,
        endX: FLY_TARGETS.cart.x,
        endY: FLY_TARGETS.cart.y,
        type: "cart",
      });
    },
    []
  );

  const triggerFavoriteFly = useCallback(
    (
      image: ImageSourcePropType | { uri: string },
      startX: number,
      startY: number
    ) => {
      triggerFlyAnimation({
        id: `favorite-${Date.now()}`,
        image,
        startX,
        startY,
        endX: FLY_TARGETS.favorite.x,
        endY: FLY_TARGETS.favorite.y,
        type: "favorite",
      });
    },
    []
  );

  return { triggerCartFly, triggerFavoriteFly };
};

// =================== STYLES =====================

const styles = StyleSheet.create({
  provider: {
    flex: 1,
  },
  flyingContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  flyingItem: {
    position: "absolute",
    zIndex: 10000,
  },
  flyingItemInner: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5B9EE1",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  flyingItemFavorite: {
    backgroundColor: "#FEE2E2",
    shadowColor: "#EF4444",
  },
  flyingImage: {
    width: 40,
    height: 40,
  },
});

export default FlyToAnimationProvider;
