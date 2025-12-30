import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SWIPE_THRESHOLD = 80;

export default function Onboarding1() {
    const router = useRouter();
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });

        return () => subscription?.remove();
    }, []);

    const { width, height } = dimensions;

    const handleGetStarted = () => {
        // Animate slide out to left
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: -width,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            router.push('/onboarding/onboarding2');
        });
    };

    const handleSkip = () => {
        router.push('/(auth)/login');
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                // Only allow swipe left (negative dx)
                if (gestureState.dx < 0) {
                    translateX.setValue(gestureState.dx);
                    opacity.setValue(1 + gestureState.dx / width);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -SWIPE_THRESHOLD) {
                    // Swipe left - go to next screen
                    Animated.parallel([
                        Animated.timing(translateX, {
                            toValue: -width,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        router.push('/onboarding/onboarding2');
                    });
                } else {
                    // Reset position
                    Animated.parallel([
                        Animated.spring(translateX, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 100,
                            friction: 10,
                        }),
                        Animated.spring(opacity, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 100,
                            friction: 10,
                        }),
                    ]).start();
                }
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateX }],
                    opacity
                }
            ]}
            {...panResponder.panHandlers}
        >
            <StatusBar style="dark" />

            {/* Skip Button */}
            <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
            >
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Decorative dots - positioned exactly like the reference image */}
            <View style={styles.decorativeDots}>
                {/* Top left small dot */}
                <View style={[styles.dotSmall, { top: height * 0.08, left: width * 0.08 }]} />

                {/* Top center area - light background bubble */}
                <View style={[styles.backgroundBubble, {
                    top: height * 0.02,
                    right: width * 0.15,
                    width: width * 0.35,
                    height: height * 0.18,
                }]} />

                {/* Right side dot */}
                <View style={[styles.dotSmall, { top: height * 0.35, right: width * 0.08 }]} />
            </View>

            {/* Main Content - flexible */}
            <View style={styles.mainContent}>
                {/* Shoe Image - centered and prominent */}
                <View style={[styles.imageContainer, {
                    height: height * 0.40,
                    marginTop: height * 0.08,
                }]}>
                    <Image
                        source={require('../../assets/images/onboard/onboard-1.png')}

                        style={[styles.shoeImage, {
                            width: width * 0.75,
                            height: '100%',
                        }]}
                        resizeMode="contain"
                    />
                </View>

                {/* Content Section */}
                <View style={styles.content}>
                    <Text style={styles.title}>Start Journey{'\n'}With Nike</Text>
                    <Text style={styles.subtitle}>
                        Smart, Gorgeous & Fashionable{'\n'}Collection
                    </Text>
                </View>
            </View>

            {/* Bottom Section - Fixed at bottom */}
            <View style={styles.bottomSection}>
                {/* Pagination Indicator */}
                <View style={styles.paginationContainer}>
                    <View style={styles.pagination}>
                        <View style={[styles.paginationDot, styles.paginationDotActive]} />
                        <View style={styles.paginationDot} />
                        <View style={styles.paginationDot} />
                    </View>
                </View>

                {/* Swipe Hint */}
                <View style={styles.swipeHint}>
                    <Text style={styles.swipeHintText}>← Vuốt sang trái để tiếp tục</Text>
                </View>

                {/* Get Started Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.getStartedButton}
                        onPress={handleGetStarted}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffffff',
    },
    mainContent: {
        flex: 1,
        zIndex: 1,
    },
    bottomSection: {
        paddingBottom: 30,
    },
    decorativeDots: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 0,
    },
    dotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#5B9EE1',
        opacity: 0.4,
        position: 'absolute',
    },
    backgroundBubble: {
        position: 'absolute',
        backgroundColor: '#E8F1F8',
        borderRadius: 100,
        opacity: 0.3,
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    shoeImage: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    content: {
        paddingHorizontal: 40,
        marginTop: 20,
        zIndex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0D1B2A',
        lineHeight: 40,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#778899',
        lineHeight: 22,
        fontWeight: '400',
    },
    paginationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        marginBottom: 10,
    },
    paginationLine: {
        width: 40,
        height: 3,
        backgroundColor: '#5B9EE1',
        borderRadius: 2,
    },
    buttonContainer: {
        paddingHorizontal: 40,
        marginTop: 30,
        marginBottom: 40,
    },
    getStartedButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 25,
        backgroundColor: '#5B9EE1',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5B9EE1',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 25,
        paddingHorizontal: 20,
        paddingVertical: 8,
        zIndex: 10,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5B9EE1',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationDot: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: '#5B9EE1',
    },
    swipeHint: {
        alignItems: 'center',
        marginTop: 15,
    },
    swipeHintText: {
        fontSize: 13,
        color: '#A0AEC0',
        fontWeight: '500',
    },
});
