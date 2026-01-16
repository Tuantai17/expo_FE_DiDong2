/**
 * SpinWheel Component - Premium Design FINAL V2
 * ==============================================
 * Properly positioned text: Icon near edge, Label between icon and center
 * Animation: Always 4 full rotations
 */

import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Platform,
    StyleSheet,
    View
} from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from "react-native-svg";
import { Segment } from "../../services/minigameService";

const { width } = Dimensions.get("window");
const WHEEL_SIZE = Math.min(width * 0.82, 300);
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2 - 10;
const SEGMENTS_COUNT = 6;
const DEGREES_PER_SEGMENT = 360 / SEGMENTS_COUNT;
const CENTER_RADIUS = WHEEL_SIZE / 5.5;

interface SpinWheelProps {
    segments: Segment[];
    isSpinning: boolean;
    targetIndex: number | null;
    onSpinComplete?: () => void;
}

const SpinWheel: React.FC<SpinWheelProps> = ({
    segments,
    isSpinning,
    targetIndex,
    onSpinComplete,
}) => {
    const spinValue = useRef(new Animated.Value(0)).current;
    const [ledActive, setLedActive] = useState<number>(0);

    // LED animation
    useEffect(() => {
        const interval = setInterval(() => {
            setLedActive(prev => (prev + 1) % 20);
        }, isSpinning ? 40 : 150);
        return () => clearInterval(interval);
    }, [isSpinning]);

    useEffect(() => {
        if (isSpinning && targetIndex !== null) {
            // RESET spinValue to 0 - ensures consistent 4 rotations every time
            spinValue.setValue(0);
            
            const fullRotations = 4;
            const targetAngle = 360 - targetIndex * DEGREES_PER_SEGMENT - DEGREES_PER_SEGMENT / 2;
            const totalRotation = fullRotations * 360 + targetAngle;

            Animated.timing(spinValue, {
                toValue: totalRotation,
                duration: 4500,
                easing: Easing.bezier(0.1, 0.7, 0.1, 1),
                useNativeDriver: true,
            }).start(() => {
                if (onSpinComplete) onSpinComplete();
            });
        }
    }, [isSpinning, targetIndex]);

    const spin = spinValue.interpolate({
        inputRange: [0, 360],
        outputRange: ["0deg", "360deg"],
    });

    // Segment path
    const createSegmentPath = (index: number) => {
        const startAngle = (index * DEGREES_PER_SEGMENT - 90) * (Math.PI / 180);
        const endAngle = ((index + 1) * DEGREES_PER_SEGMENT - 90) * (Math.PI / 180);
        const x1 = CENTER + RADIUS * Math.cos(startAngle);
        const y1 = CENTER + RADIUS * Math.sin(startAngle);
        const x2 = CENTER + RADIUS * Math.cos(endAngle);
        const y2 = CENTER + RADIUS * Math.sin(endAngle);
        return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`;
    };

    // Position helper
    const getPos = (index: number, radiusPct: number) => {
        const angle = (index * DEGREES_PER_SEGMENT + DEGREES_PER_SEGMENT / 2 - 90) * (Math.PI / 180);
        return {
            x: CENTER + RADIUS * radiusPct * Math.cos(angle),
            y: CENTER + RADIUS * radiusPct * Math.sin(angle),
        };
    };

    // Default segments
    const displaySegments = segments.length >= 6 ? segments : [
        { id: 0, segmentIndex: 0, label: "10%", icon: "🎁" },
        { id: 1, segmentIndex: 1, label: "Chúc", icon: "😊" },
        { id: 2, segmentIndex: 2, label: "20%", icon: "🎫" },
        { id: 3, segmentIndex: 3, label: "Thử", icon: "🍀" },
        { id: 4, segmentIndex: 4, label: "50K", icon: "💰" },
        { id: 5, segmentIndex: 5, label: "Sau", icon: "⭐" },
    ] as Segment[];

    // Font sizes
    const ICON_SIZE = Math.round(WHEEL_SIZE / 8);   // ~37px
    const LABEL_SIZE = Math.round(WHEEL_SIZE / 14); // ~21px - larger for readability

    // Positions: Icon at 78%, Label at 55% (further from center)
    const ICON_RADIUS = 0.78;
    const LABEL_RADIUS = 0.55;

    // LED lights
    const leds = [];
    const ledCount = 20;
    const ledR = WHEEL_SIZE / 2 + 18;
    for (let i = 0; i < ledCount; i++) {
        const a = (i * 360 / ledCount - 90) * (Math.PI / 180);
        const isActive = (ledActive + i) % 4 === 0;
        leds.push({
            cx: CENTER + ledR * Math.cos(a),
            cy: CENTER + ledR * Math.sin(a),
            on: isActive,
        });
    }

    // Short label - max 4 chars for clarity
    const getShort = (text: string | undefined): string => {
        if (!text) return "";
        let clean = text.replace(/^Giảm\s*/i, "").replace(/\s+/g, "");
        return clean.slice(0, 4);
    };

    return (
        <View style={styles.container}>
            {/* Outer ring with LEDs */}
            <View style={styles.outerRing}>
                {leds.map((led, i) => (
                    <View
                        key={i}
                        style={[
                            styles.led,
                            {
                                left: led.cx + 22 - 10,
                                top: led.cy + 22 - 10,
                                backgroundColor: led.on ? "#FFD700" : "#4A3500",
                                shadowColor: led.on ? "#FFD700" : "transparent",
                                shadowOpacity: led.on ? 1 : 0,
                            },
                        ]}
                    />
                ))}
            </View>

            {/* Gold border */}
            <View style={styles.goldBorder} />

            {/* Pointer */}
            <View style={styles.pointerWrap}>
                <View style={styles.pointerMain} />
                <View style={styles.pointerHighlight} />
            </View>

            {/* Wheel */}
            <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
                <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                    <Defs>
                        <RadialGradient id="center" cx="50%" cy="50%" r="50%">
                            <Stop offset="0%" stopColor="#3B82F6" />
                            <Stop offset="70%" stopColor="#1D4ED8" />
                            <Stop offset="100%" stopColor="#1E3A8A" />
                        </RadialGradient>
                        <LinearGradient id="yellow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#FEF08A" />
                            <Stop offset="50%" stopColor="#FACC15" />
                            <Stop offset="100%" stopColor="#B45309" />
                        </LinearGradient>
                        <LinearGradient id="red" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#FCA5A5" />
                            <Stop offset="50%" stopColor="#EF4444" />
                            <Stop offset="100%" stopColor="#991B1B" />
                        </LinearGradient>
                    </Defs>
                    <G>
                        {displaySegments.map((seg, idx) => {
                            const isYellow = idx % 2 === 0;
                            // Label ở giữa segment (65% radius - không cần icon nữa)
                            const labelP = getPos(idx, 0.65);
                            const textCol = isYellow ? "#7C2D12" : "#FFFFFF";
                            const shortLabel = getShort(seg.label);

                            return (
                                <G key={seg.id || idx}>
                                    {/* Segment */}
                                    <Path
                                        d={createSegmentPath(idx)}
                                        fill={isYellow ? "url(#yellow)" : "url(#red)"}
                                        stroke="#FFF"
                                        strokeWidth={2}
                                    />
                                    
                                    {/* LABEL - shadow */}
                                    <SvgText
                                        x={labelP.x + 1}
                                        y={labelP.y + 1}
                                        fill="rgba(0,0,0,0.3)"
                                        fontSize={LABEL_SIZE}
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        alignmentBaseline="central"
                                    >
                                        {shortLabel}
                                    </SvgText>
                                    {/* LABEL - main */}
                                    <SvgText
                                        x={labelP.x}
                                        y={labelP.y}
                                        fill={textCol}
                                        fontSize={LABEL_SIZE}
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        alignmentBaseline="central"
                                    >
                                        {shortLabel}
                                    </SvgText>
                                </G>
                            );
                        })}

                        {/* Center button */}
                        <Circle 
                            cx={CENTER} 
                            cy={CENTER} 
                            r={CENTER_RADIUS} 
                            fill="url(#center)" 
                            stroke="#FACC15" 
                            strokeWidth={5} 
                        />
                        <Circle 
                            cx={CENTER} 
                            cy={CENTER - 4} 
                            r={CENTER_RADIUS - 8} 
                            fill="none" 
                            stroke="rgba(255,255,255,0.15)" 
                            strokeWidth={4} 
                        />
                        <SvgText
                            x={CENTER}
                            y={CENTER + 4}
                            fill="#FACC15"
                            fontSize={Math.round(WHEEL_SIZE / 8)}
                            fontWeight="bold"
                            textAnchor="middle"
                            alignmentBaseline="central"
                        >
                            QUAY
                        </SvgText>
                    </G>
                </Svg>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: WHEEL_SIZE + 55,
        height: WHEEL_SIZE + 55,
        alignItems: "center",
        justifyContent: "center",
    },
    outerRing: {
        position: "absolute",
        width: WHEEL_SIZE + 45,
        height: WHEEL_SIZE + 45,
        borderRadius: (WHEEL_SIZE + 45) / 2,
        backgroundColor: "#1F2937",
        borderWidth: 4,
        borderColor: "#FACC15",
        ...Platform.select({
            ios: { shadowColor: "#FACC15", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 25 },
            android: { elevation: 25 },
        }),
    },
    goldBorder: {
        position: "absolute",
        width: WHEEL_SIZE + 12,
        height: WHEEL_SIZE + 12,
        borderRadius: (WHEEL_SIZE + 12) / 2,
        borderWidth: 4,
        borderColor: "#CA8A04",
        backgroundColor: "transparent",
    },
    led: {
        position: "absolute",
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#1F2937",
        ...Platform.select({ ios: { shadowRadius: 15 } }),
    },
    wheel: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
    },
    pointerWrap: {
        position: "absolute",
        top: 5,
        zIndex: 30,
        alignItems: "center",
    },
    pointerMain: {
        width: 0,
        height: 0,
        borderLeftWidth: 22,
        borderRightWidth: 22,
        borderTopWidth: 50,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "#DC2626",
        ...Platform.select({ 
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 8 } 
        }),
    },
    pointerHighlight: {
        position: "absolute",
        top: 12,
        width: 0,
        height: 0,
        borderLeftWidth: 13,
        borderRightWidth: 13,
        borderTopWidth: 28,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "#F87171",
    },
});

export default SpinWheel;
