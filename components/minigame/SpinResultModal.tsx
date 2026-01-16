/**
 * SpinResultModal Component
 * =========================
 * Shows the result after spinning the wheel
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SpinResult, formatVoucherDiscount } from "../../services/minigameService";

const { width } = Dimensions.get("window");

interface SpinResultModalProps {
    visible: boolean;
    result: SpinResult | null;
    onClose: () => void;
}

const SpinResultModal: React.FC<SpinResultModalProps> = ({
    visible,
    result,
    onClose,
}) => {
    if (!result) return null;

    const isWin = result.isWin;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, isWin && styles.winContainer]}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, isWin && styles.winIconContainer]}>
                        {isWin ? (
                            <Ionicons name="gift" size={60} color="#FFD700" />
                        ) : (
                            <Ionicons name="sad-outline" size={60} color="#888" />
                        )}
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, isWin && styles.winTitle]}>
                        {isWin ? "🎉 Chúc mừng!" : "Chúc may mắn lần sau!"}
                    </Text>

                    {/* Message */}
                    <Text style={styles.message}>{result.message}</Text>

                    {/* Voucher details if won */}
                    {isWin && result.voucherCode && (
                        <View style={styles.voucherCard}>
                            <Text style={styles.voucherLabel}>Bạn nhận được voucher:</Text>
                            <View style={styles.voucherCodeContainer}>
                                <Text style={styles.voucherCode}>{result.voucherCode}</Text>
                            </View>
                            <Text style={styles.voucherDiscount}>
                                Giảm{" "}
                                {formatVoucherDiscount(
                                    result.voucherDiscount || 0,
                                    result.voucherDiscountType
                                )}
                            </Text>
                            {result.voucherDescription && (
                                <Text style={styles.voucherDescription}>
                                    {result.voucherDescription}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Remaining spins info */}
                    <View style={styles.spinsInfo}>
                        <Ionicons name="reload-circle" size={20} color="#FF6B00" />
                        <Text style={styles.spinsText}>
                            Còn lại: {result.totalSpinsRemaining} lượt quay
                        </Text>
                    </View>

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: width * 0.85,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    winContainer: {
        backgroundColor: "#fff8e8",
        borderWidth: 3,
        borderColor: "#FFD700",
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    winIconContainer: {
        backgroundColor: "#FF6B00",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    winTitle: {
        color: "#FF6B00",
    },
    message: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
    },
    voucherCard: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#FF6B00",
        borderStyle: "dashed",
    },
    voucherLabel: {
        fontSize: 14,
        color: "#888",
        marginBottom: 8,
    },
    voucherCodeContainer: {
        backgroundColor: "#FF6B00",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    voucherCode: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        letterSpacing: 2,
    },
    voucherDiscount: {
        fontSize: 18,
        color: "#FF6B00",
        fontWeight: "600",
        marginBottom: 4,
    },
    voucherDescription: {
        fontSize: 12,
        color: "#888",
        textAlign: "center",
    },
    spinsInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 20,
    },
    spinsText: {
        fontSize: 14,
        color: "#666",
    },
    closeButton: {
        backgroundColor: "#FF6B00",
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 25,
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default SpinResultModal;
