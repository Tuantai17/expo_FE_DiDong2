/**
 * StaggerAnimation Component
 * ==========================
 * Provides staggered animation for lists with sequential fade-in and slide-up effects
 * Uses react-native-reanimated for smooth 60fps animations
 */

import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
    Layout,
    SlideInDown,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
    ZoomIn
} from "react-native-reanimated";

// =================== TYPES =====================

interface StaggerItemProps {
  children: React.ReactNode;
  index: number;
  delayBase?: number; // Base delay between items (ms)
  duration?: number;
  style?: ViewStyle;
  animation?: "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "zoom" | "slideUp" | "slideDown";
}

interface StaggerListProps {
  children: React.ReactNode[];
  delayBase?: number;
  duration?: number;
  animation?: StaggerItemProps["animation"];
  containerStyle?: ViewStyle;
}

// =================== PRESET ANIMATIONS =====================

export const enteringAnimations = {
  fadeUp: (delay: number, duration: number) =>
    FadeInUp.delay(delay).duration(duration).easing(Easing.out(Easing.cubic)),
  
  fadeDown: (delay: number, duration: number) =>
    FadeInDown.delay(delay).duration(duration).easing(Easing.out(Easing.cubic)),
  
  fadeLeft: (delay: number, duration: number) =>
    FadeInLeft.delay(delay).duration(duration).easing(Easing.out(Easing.cubic)),
  
  fadeRight: (delay: number, duration: number) =>
    FadeInRight.delay(delay).duration(duration).easing(Easing.out(Easing.cubic)),
  
  zoom: (delay: number, duration: number) =>
    ZoomIn.delay(delay).duration(duration).springify(),
  
  slideUp: (delay: number, duration: number) =>
    SlideInUp.delay(delay).duration(duration).easing(Easing.out(Easing.cubic)),
  
  slideDown: (delay: number, duration: number) =>
    SlideInDown.delay(delay).duration(duration).easing(Easing.out(Easing.cubic)),
};

// =================== STAGGER ITEM =====================

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  index,
  delayBase = 80,
  duration = 400,
  style,
  animation = "fadeUp",
}) => {
  const delay = index * delayBase;
  const enteringAnimation = enteringAnimations[animation](delay, duration);

  return (
    <Animated.View
      entering={enteringAnimation}
      layout={Layout.springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

// =================== STAGGER LIST =====================

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  delayBase = 80,
  duration = 400,
  animation = "fadeUp",
  containerStyle,
}) => {
  return (
    <Animated.View style={containerStyle}>
      {React.Children.map(children, (child, index) => (
        <StaggerItem
          key={index}
          index={index}
          delayBase={delayBase}
          duration={duration}
          animation={animation}
        >
          {child}
        </StaggerItem>
      ))}
    </Animated.View>
  );
};

// =================== ANIMATED PRESSABLE =====================

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  scaleOnPress?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  style,
  scaleOnPress = 0.96,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleOnPress, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Animated.View
        // @ts-ignore - GestureDetector types
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};

// =================== FADE IN VIEW =====================

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 500,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// =================== PULSE ANIMATION =====================

interface PulseViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  minScale?: number;
  maxScale?: number;
  duration?: number;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  style,
  minScale = 0.97,
  maxScale = 1.03,
  duration = 1000,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(maxScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// Need to import withRepeat for PulseView
import { withRepeat } from "react-native-reanimated";

export default StaggerItem;
