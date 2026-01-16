/**
 * Spin Wheel Screen - Premium Design
 * ===================================
 * Main screen for the voucher spin wheel mini game
 * Inspired by professional lucky wheel apps
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SpinResultModal, SpinWheel } from "../../components/minigame";
import {
    SpinResult,
    SpinStatus,
    Wheel,
    checkin,
    getFirstActiveWheel,
    getSpinStatus,
    spin,
} from "../../services/minigameService";

const { width, height } = Dimensions.get("window");

export default function SpinWheelScreen() {
    const [wheel, setWheel] = useState<Wheel | null>(null);
    const [spinStatus, setSpinStatus] = useState<SpinStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isCheckinLoading, setIsCheckinLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Spin result state
    const [targetIndex, setTargetIndex] = useState<number | null>(null);
    const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);

    // Fetch wheel and status
    const fetchData = useCallback(async () => {
        try {
            const wheelData = await getFirstActiveWheel();
            if (wheelData) {
                setWheel(wheelData);
                const status = await getSpinStatus(wheelData.id);
                setSpinStatus(status);
            } else {
                setWheel(null);
                setSpinStatus(null);
            }
        } catch (error) {
            console.error("Error fetching wheel data:", error);
            Alert.alert("Lỗi", "Không thể tải vòng quay. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    // Handle spin
    const handleSpin = useCallback(async () => {
        if (!wheel || isSpinning || !spinStatus?.canSpin) return;

        try {
            setIsSpinning(true);
            const result = await spin(wheel.id);
            
            if (result.success) {
                setTargetIndex(result.segmentIndex);
                setSpinResult(result);
                
                setSpinStatus(prev => prev ? {
                    ...prev,
                    totalSpinsRemaining: result.totalSpinsRemaining,
                    freeSpinsRemaining: result.freeSpinsRemaining,
                    extraSpinsRemaining: result.extraSpinsRemaining,
                    canSpin: result.totalSpinsRemaining > 0,
                } : null);
            } else {
                setIsSpinning(false);
                Alert.alert("Thông báo", result.message);
            }
        } catch (error: any) {
            setIsSpinning(false);
            const message = error.response?.data?.message || "Không thể quay. Vui lòng thử lại.";
            Alert.alert("Lỗi", message);
        }
    }, [wheel, isSpinning, spinStatus]);

    // Handle spin complete
    const handleSpinComplete = useCallback(() => {
        setIsSpinning(false);
        setTargetIndex(null);
        if (spinResult) {
            setShowResultModal(true);
        }
    }, [spinResult]);

    // Handle close result modal
    const handleCloseResult = useCallback(() => {
        setShowResultModal(false);
        setSpinResult(null);
    }, []);

    // Handle checkin
    const handleCheckin = useCallback(async () => {
        if (!wheel || isCheckinLoading || spinStatus?.hasCheckedInToday) return;

        try {
            setIsCheckinLoading(true);
            const result = await checkin(wheel.id);
            
            if (result.success) {
                Alert.alert("🎉 Thành công!", result.message);
                const status = await getSpinStatus(wheel.id);
                setSpinStatus(status);
            } else {
                Alert.alert("Thông báo", result.message);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || "Không thể điểm danh. Vui lòng thử lại.";
            Alert.alert("Lỗi", message);
        } finally {
            setIsCheckinLoading(false);
        }
    }, [wheel, isCheckinLoading, spinStatus]);

    // Loading state
    if (isLoading) {
        return (
            <LinearGradient colors={["#DC2626", "#EF4444", "#FCA5A5"]} style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Đang tải vòng quay...</Text>
            </LinearGradient>
        );
    }

    // No wheel available
    if (!wheel) {
        return (
            <LinearGradient colors={["#DC2626", "#EF4444", "#FCA5A5"]} style={styles.emptyContainer}>
                <StatusBar barStyle="light-content" />
                <Ionicons name="game-controller-outline" size={80} color="#FFD700" />
                <Text style={styles.emptyTitle}>Chưa có vòng quay</Text>
                <Text style={styles.emptyText}>
                    Hiện tại chưa có chương trình vòng quay nào đang diễn ra. Hãy quay lại sau nhé!
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={["#DC2626", "#EF4444", "#FF6B6B"]} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
                            <View style={styles.backIconBg}>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        
                        {/* Title with decorative style */}
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleTop}>VÒNG QUAY</Text>
                            <Text style={styles.titleBottom}>VOUCHER</Text>
                        </View>
                        
                        <TouchableOpacity style={styles.menuIcon}>
                            <Ionicons name="menu" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Wheel name badge */}
                    <View style={styles.nameBadge}>
                        <Ionicons name="trophy" size={16} color="#FFD700" />
                        <Text style={styles.nameText}>{wheel.name}</Text>
                    </View>

                    {/* Wheel container with decorative background */}
                    <View style={styles.wheelSection}>
                        {/* Decorative background glow */}
                        <View style={styles.wheelGlow} />
                        
                        {/* The wheel */}
                        <View style={styles.wheelWrapper}>
                            <SpinWheel
                                segments={wheel.segments}
                                isSpinning={isSpinning}
                                targetIndex={targetIndex}
                                onSpinComplete={handleSpinComplete}
                            />
                        </View>
                    </View>

                    {/* Spins count */}
                    <View style={styles.spinsSection}>
                        <LinearGradient
                            colors={["#FFD700", "#FFA500"]}
                            style={styles.spinsBadge}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="gift" size={20} color="#fff" />
                            <Text style={styles.spinsCount}>
                                {spinStatus?.totalSpinsRemaining || 0} lượt miễn phí
                            </Text>
                        </LinearGradient>
                        
                        <View style={styles.spinsBreakdown}>
                            <View style={styles.spinsItem}>
                                <Text style={styles.spinsLabel}>🎁 Free</Text>
                                <Text style={styles.spinsValue}>{spinStatus?.freeSpinsRemaining || 0}</Text>
                            </View>
                            <View style={styles.spinsDivider} />
                            <View style={styles.spinsItem}>
                                <Text style={styles.spinsLabel}>⭐ Bonus</Text>
                                <Text style={styles.spinsValue}>{spinStatus?.extraSpinsRemaining || 0}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.buttonsContainer}>
                        {/* Checkin button */}
                        <TouchableOpacity
                            style={[
                                styles.checkinButton,
                                spinStatus?.hasCheckedInToday && styles.checkinButtonDone,
                            ]}
                            onPress={handleCheckin}
                            disabled={isCheckinLoading || spinStatus?.hasCheckedInToday}
                        >
                            {isCheckinLoading ? (
                                <ActivityIndicator size="small" color="#FFD700" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={spinStatus?.hasCheckedInToday ? "checkmark-circle" : "calendar"}
                                        size={22}
                                        color={spinStatus?.hasCheckedInToday ? "#4CAF50" : "#FFD700"}
                                    />
                                    <Text style={[
                                        styles.checkinText,
                                        spinStatus?.hasCheckedInToday && styles.checkinTextDone
                                    ]}>
                                        {spinStatus?.hasCheckedInToday ? "Đã điểm danh" : "Điểm danh nhận lượt"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Spin button */}
                        <TouchableOpacity
                            style={[
                                styles.spinButton,
                                (!spinStatus?.canSpin || isSpinning) && styles.spinButtonDisabled,
                            ]}
                            onPress={handleSpin}
                            disabled={!spinStatus?.canSpin || isSpinning}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={spinStatus?.canSpin && !isSpinning 
                                    ? ["#FF4500", "#FF0000", "#CC0000"] 
                                    : ["#666", "#444", "#333"]}
                                style={styles.spinButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {isSpinning ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="play" size={24} color="#fff" />
                                        <Text style={styles.spinButtonText}>
                                            {spinStatus?.canSpin ? "QUAY NGAY" : "HẾT LƯỢT"}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Tips section */}
                    <View style={styles.tipsContainer}>
                        <View style={styles.tipsHeader}>
                            <Text style={styles.tipsIcon}>💡</Text>
                            <Text style={styles.tipsTitle}>Mẹo hay</Text>
                        </View>
                        <View style={styles.tipsList}>
                            <Text style={styles.tipItem}>• Điểm danh mỗi ngày để nhận +1 lượt quay miễn phí</Text>
                            <Text style={styles.tipItem}>• Mỗi ngày bạn có {wheel.dailyFreeSpins} lượt quay free</Text>
                            <Text style={styles.tipItem}>• Voucher trúng thưởng sẽ được lưu vào "Mã giảm giá"</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Result modal */}
            <SpinResultModal
                visible={showResultModal}
                result={spinResult}
                onClose={handleCloseResult}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#fff",
        fontWeight: "500",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 20,
    },
    emptyText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        marginTop: 10,
    },
    backButton: {
        marginTop: 30,
        backgroundColor: "#FFD700",
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 30,
    },
    backButtonText: {
        color: "#333",
        fontWeight: "bold",
        fontSize: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    backIcon: {
        padding: 4,
    },
    backIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    titleContainer: {
        alignItems: "center",
    },
    titleTop: {
        fontSize: 20,
        fontWeight: "800",
        color: "#FFD700",
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    titleBottom: {
        fontSize: 32,
        fontWeight: "900",
        color: "#fff",
        textShadowColor: "#FFD700",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
        marginTop: -5,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    nameBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 10,
        gap: 8,
    },
    nameText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    wheelSection: {
        marginTop: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    wheelGlow: {
        position: "absolute",
        width: width * 0.95,
        height: width * 0.95,
        borderRadius: width * 0.475,
        backgroundColor: "rgba(255,165,0,0.15)",
    },
    wheelWrapper: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
        elevation: 25,
    },
    spinsSection: {
        marginTop: 25,
        alignItems: "center",
    },
    spinsBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 10,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    spinsCount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    spinsBreakdown: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
    spinsItem: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    spinsDivider: {
        width: 1,
        height: 30,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    spinsLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
    },
    spinsValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFD700",
    },
    buttonsContainer: {
        width: "100%",
        paddingHorizontal: 24,
        marginTop: 25,
        gap: 14,
    },
    checkinButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingVertical: 15,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: "#FFD700",
        gap: 10,
    },
    checkinButtonDone: {
        backgroundColor: "rgba(76,175,80,0.2)",
        borderColor: "#4CAF50",
    },
    checkinText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFD700",
    },
    checkinTextDone: {
        color: "#4CAF50",
    },
    spinButton: {
        borderRadius: 35,
        overflow: "hidden",
        shadowColor: "#FF0000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
    },
    spinButtonDisabled: {
        shadowOpacity: 0,
    },
    spinButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        gap: 12,
    },
    spinButtonText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        letterSpacing: 1,
    },
    tipsContainer: {
        marginTop: 30,
        marginHorizontal: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    tipsHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    tipsIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFD700",
    },
    tipsList: {
        gap: 6,
    },
    tipItem: {
        fontSize: 13,
        color: "rgba(255,255,255,0.9)",
        lineHeight: 20,
    },
});
