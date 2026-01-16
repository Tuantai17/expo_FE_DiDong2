/**
 * Success Lottie Animation Component
 * ===================================
 * Cross-platform success animation using Lottie
 * Uses lottie-react for web, lottie-react-native for native
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from "react-native";

// Import Success animation JSON
const SuccessAnimationData = require("../../assets/animations/Success.json");

// =================== TYPES =====================

interface SuccessLottieProps {
    size?: number;
    style?: ViewStyle;
    autoPlay?: boolean;
    loop?: boolean;
}

// =================== WEB COMPONENT =====================

const WebLottie: React.FC<SuccessLottieProps> = ({ size = 150, style, autoPlay = true, loop = false }) => {
    // Dynamic import for web
    const Lottie = require("lottie-react").default;
    
    return (
        <View style={[{ width: size, height: size }, style]}>
            <Lottie
                animationData={SuccessAnimationData}
                loop={loop}
                autoplay={autoPlay}
                style={{ width: size, height: size }}
            />
        </View>
    );
};

// =================== NATIVE COMPONENT =====================

const NativeLottie: React.FC<SuccessLottieProps> = ({ size = 150, style, autoPlay = true, loop = false }) => {
    const LottieView = require("lottie-react-native").default;
    
    return (
        <LottieView
            source={SuccessAnimationData}
            autoPlay={autoPlay}
            loop={loop}
            style={[{ width: size, height: size }, style]}
        />
    );
};

// =================== FALLBACK COMPONENT =====================

const FallbackAnimation: React.FC<SuccessLottieProps> = ({ size = 150, style }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 300,
                easing: Easing.out(Easing.back(2)),
                useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: Platform.OS !== "web",
            }),
        ]).start();

        Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: Platform.OS !== "web",
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.fallbackContainer,
                {
                    width: size,
                    height: size,
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                },
                style,
            ]}
        >
            <View style={[styles.iconCircle, { width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35 }]}>
                <Ionicons name="checkmark" size={size * 0.4} color="#FFFFFF" />
            </View>
        </Animated.View>
    );
};

// =================== MAIN COMPONENT =====================

export const SuccessLottie: React.FC<SuccessLottieProps> = (props) => {
    // Use platform-specific component
    if (Platform.OS === "web") {
        try {
            return <WebLottie {...props} />;
        } catch (error) {
            console.log("Web Lottie failed, using fallback:", error);
            return <FallbackAnimation {...props} />;
        }
    }
    
    // Native platforms
    try {
        return <NativeLottie {...props} />;
    } catch (error) {
        console.log("Native Lottie failed, using fallback:", error);
        return <FallbackAnimation {...props} />;
    }
};

// =================== STYLES =====================

const styles = StyleSheet.create({
    fallbackContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    iconCircle: {
        backgroundColor: "#10B981",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            web: {
                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
            },
        }),
    },
});

export default SuccessLottie;
