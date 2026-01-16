/**
 * LottieAnimation Component
 * =========================
 * Wrapper for Lottie animations with common use cases
 * Uses lottie-react-native for high-performance animations
 */

import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// =================== TYPES =====================

interface LottieAnimationProps {
  source: any; // Lottie JSON or URI
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: ViewStyle;
  size?: number | "small" | "medium" | "large" | "xlarge";
  onAnimationFinish?: () => void;
}

interface AnimatedStateProps {
  type: "loading" | "success" | "error" | "empty" | "noConnection";
  title?: string;
  message?: string;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  onAnimationFinish?: () => void;
}

// =================== SIZE MAPPING =====================

const sizeMap = {
  small: 80,
  medium: 150,
  large: 220,
  xlarge: 300,
};

// =================== BUILT-IN ANIMATIONS (Fallback colors) =====================

// Note: These are placeholder fallback UIs when Lottie files are not available
// For production, download Lottie JSON files from lottiefiles.com and place in assets/animations/

const fallbackAnimations = {
  loading: {
    color: "#5B9EE1",
    icon: "⏳",
    defaultTitle: "Đang tải...",
    defaultMessage: "Vui lòng chờ trong giây lát",
  },
  success: {
    color: "#10B981",
    icon: "✓",
    defaultTitle: "Thành công!",
    defaultMessage: "",
  },
  error: {
    color: "#EF4444",
    icon: "✕",
    defaultTitle: "Có lỗi xảy ra",
    defaultMessage: "Vui lòng thử lại sau",
  },
  empty: {
    color: "#94A3B8",
    icon: "📦",
    defaultTitle: "Không có dữ liệu",
    defaultMessage: "Chưa có nội dung để hiển thị",
  },
  noConnection: {
    color: "#F59E0B",
    icon: "📶",
    defaultTitle: "Mất kết nối",
    defaultMessage: "Kiểm tra kết nối internet của bạn",
  },
};

// =================== MAIN COMPONENT =====================

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  source,
  autoPlay = true,
  loop = true,
  speed = 1,
  style,
  size = "medium",
  onAnimationFinish,
}) => {
  const lottieRef = useRef<LottieView>(null);
  const computedSize = typeof size === "number" ? size : sizeMap[size];

  useEffect(() => {
    if (autoPlay && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [autoPlay]);

  return (
    <LottieView
      ref={lottieRef}
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      speed={speed}
      style={[{ width: computedSize, height: computedSize }, style]}
      onAnimationFinish={onAnimationFinish}
    />
  );
};

// =================== ANIMATED STATE COMPONENT =====================

export const AnimatedState: React.FC<AnimatedStateProps> = ({
  type,
  title,
  message,
  size = "medium",
  style,
  onAnimationFinish,
}) => {
  const config = fallbackAnimations[type];
  const computedSize = sizeMap[size];

  // Try to load Lottie animation, fallback to simple UI
  // In production, replace with actual Lottie files
  const renderFallback = () => (
    <View
      style={[
        styles.fallbackCircle,
        { width: computedSize, height: computedSize, backgroundColor: config.color + "20" },
      ]}
    >
      {type === "loading" ? (
        <ActivityIndicator size="large" color={config.color} />
      ) : (
        <Text style={[styles.fallbackIcon, { color: config.color, fontSize: computedSize / 2.5 }]}>
          {config.icon}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.stateContainer, style]}>
      {renderFallback()}
      
      {(title || config.defaultTitle) && (
        <Text style={styles.stateTitle}>{title || config.defaultTitle}</Text>
      )}
      
      {(message || config.defaultMessage) && (
        <Text style={styles.stateMessage}>{message || config.defaultMessage}</Text>
      )}
    </View>
  );
};

// =================== PRESET ANIMATIONS =====================

/**
 * Loading Animation
 */
export const LoadingAnimation: React.FC<{
  size?: "small" | "medium" | "large";
  message?: string;
  style?: ViewStyle;
}> = ({ size = "medium", message, style }) => (
  <AnimatedState
    type="loading"
    message={message}
    size={size}
    style={style}
  />
);

/**
 * Success Animation
 */
export const SuccessAnimation: React.FC<{
  size?: "small" | "medium" | "large";
  title?: string;
  message?: string;
  style?: ViewStyle;
  onFinish?: () => void;
}> = ({ size = "medium", title, message, style, onFinish }) => (
  <AnimatedState
    type="success"
    title={title}
    message={message}
    size={size}
    style={style}
    onAnimationFinish={onFinish}
  />
);

/**
 * Error Animation
 */
export const ErrorAnimation: React.FC<{
  size?: "small" | "medium" | "large";
  title?: string;
  message?: string;
  style?: ViewStyle;
}> = ({ size = "medium", title, message, style }) => (
  <AnimatedState
    type="error"
    title={title}
    message={message}
    size={size}
    style={style}
  />
);

/**
 * Empty State Animation
 */
export const EmptyAnimation: React.FC<{
  size?: "small" | "medium" | "large";
  title?: string;
  message?: string;
  style?: ViewStyle;
}> = ({ size = "medium", title, message, style }) => (
  <AnimatedState
    type="empty"
    title={title}
    message={message}
    size={size}
    style={style}
  />
);

/**
 * No Connection Animation
 */
export const NoConnectionAnimation: React.FC<{
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}> = ({ size = "medium", style }) => (
  <AnimatedState
    type="noConnection"
    size={size}
    style={style}
  />
);

// =================== STYLES =====================

const styles = StyleSheet.create({
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  fallbackCircle: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  fallbackIcon: {
    fontWeight: "bold",
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  stateMessage: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default LottieAnimation;
