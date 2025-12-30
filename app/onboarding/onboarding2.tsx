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
    View
} from 'react-native';

const SWIPE_THRESHOLD = 80;

export default function Onboarding2() {
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

    const handleNext = () => {
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
            router.push('/onboarding/onboarding3');
        });
    };

    const handleBack = () => {
        // Animate slide out to right
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: width,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            router.replace('/onboarding/onboarding1');
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
                translateX.setValue(gestureState.dx);
                opacity.setValue(1 - Math.abs(gestureState.dx) / width);
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
                        router.push('/onboarding/onboarding3');
                    });
                } else if (gestureState.dx > SWIPE_THRESHOLD) {
                    // Swipe right - go to previous screen
                    Animated.parallel([
                        Animated.timing(translateX, {
                            toValue: width,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        router.replace('/onboarding/onboarding1');
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

            {/* Decorative dots */}
            <View style={styles.decorativeDots}>
                <View style={[styles.dot, { top: height * 0.15, left: 30 }]} />
                <View style={[styles.dot, { top: height * 0.12, right: width * 0.35 }]} />
                <View style={[styles.dot, { top: height * 0.42, left: 25 }]} />
                <View style={[styles.dot, { top: height * 0.4, right: 30 }]} />
            </View>

            {/* Main Content - flexible */}
            <View style={styles.mainContent}>
                {/* Shoe Image */}
                <View style={[styles.imageContainer, { height: height * 0.38 }]}>
                    <Image
                        source={require('../../assets/images/onboard/onboard-2.png')}
                        style={[styles.shoeImage, { width: width * 0.85 }]}
                        resizeMode="contain"
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>Follow Latest{'\n'}Style Shoes</Text>
                    <Text style={styles.subtitle}>There Are Many Beautiful And{'\n'}Attractive Plants To Your Room</Text>
                </View>
            </View>

            {/* Bottom Section - Fixed at bottom */}
            <View style={styles.bottomSection}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    <View style={styles.paginationDot} />
                    <View style={[styles.paginationDot, styles.paginationDotActive]} />
                    <View style={styles.paginationDot} />
                </View>

                {/* Swipe Hint */}
                <View style={styles.swipeHint}>
                    <Text style={styles.swipeHintText}>← Vuốt trái/phải →</Text>
                </View>

                {/* Navigation Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F9',
    },
    mainContent: {
        flex: 1,
    },
    bottomSection: {
        paddingBottom: 30,
    },
    decorativeDots: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#5B9EE1',
        opacity: 0.3,
        position: 'absolute',
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    shoeImage: {
        height: '100%',
    },
    content: {
        paddingHorizontal: 30,
        marginTop: 30,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1A2530',
        lineHeight: 44,
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#707B81',
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
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
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: 30,
        gap: 15,
    },
    backButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        backgroundColor: '#E5E7EB',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A2530',
    },
    nextButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        backgroundColor: '#5B9EE1',
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
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
