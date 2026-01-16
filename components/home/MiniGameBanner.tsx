/**
 * Mini Game Banner Component
 * ==========================
 * Entry point cho user tham gia vòng quay voucher
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getFirstActiveWheel, Wheel } from "../../services/minigameService";

const { width } = Dimensions.get("window");

interface MiniGameBannerProps {
    onPress?: () => void;
}

const MiniGameBanner: React.FC<MiniGameBannerProps> = ({ onPress }) => {
    const [wheel, setWheel] = useState<Wheel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const spinAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchWheel();
        startSpinAnimation();
    }, []);

    const fetchWheel = async () => {
        try {
            const activeWheel = await getFirstActiveWheel();
            setWheel(activeWheel);
        } catch (error) {
            console.log("No active wheel");
        } finally {
            setIsLoading(false);
        }
    };

    const startSpinAnimation = () => {
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push("/features/spin-wheel");
        }
    };

    // Không hiển thị nếu không có wheel active
    if (isLoading || !wheel) {
        return null;
    }

    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={["#FF6B00", "#FF8533", "#FFB380"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Spinning wheel icon */}
                <Animated.View style={[styles.wheelIcon, { transform: [{ rotate: spin }] }]}>
                    <Text style={styles.wheelEmoji}>🎰</Text>
                </Animated.View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>🎁 VÒNG QUAY VOUCHER</Text>
                    <Text style={styles.subtitle}>{wheel.name}</Text>
                    <Text style={styles.description}>
                        Quay ngay để nhận voucher giảm giá!
                    </Text>
                </View>

                {/* Arrow */}
                <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                </View>

                {/* Decorative circles */}
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#FF6B00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    gradient: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        minHeight: 100,
        position: "relative",
    },
    wheelIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    wheelEmoji: {
        fontSize: 32,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        fontWeight: "600",
        marginBottom: 4,
    },
    description: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
    },
    arrowContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    circle: {
        position: "absolute",
        borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    circle1: {
        width: 80,
        height: 80,
        top: -20,
        right: -20,
    },
    circle2: {
        width: 40,
        height: 40,
        bottom: -10,
        right: 60,
    },
    circle3: {
        width: 30,
        height: 30,
        top: 10,
        right: 100,
    },
});

export default MiniGameBanner;
