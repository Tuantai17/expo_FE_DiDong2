// components/ui/Toast.tsx
/**
 * Toast Component
 * ================
 * In-app toast notifications that slide in from bottom
 * Auto-dismisses after a few seconds
 */

import { Ionicons } from "@expo/vector-icons";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState,
} from "react";
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// =================== TYPES =====================

type ToastType = "success" | "error" | "info" | "cart";

interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (
        type: ToastType,
        title: string,
        message?: string,
        duration?: number
    ) => void;
    showCartToast: (productName: string, size?: string, quantity?: number) => void;
    hideToast: (id: string) => void;
}

// =================== CONTEXT =====================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// =================== PROVIDER =====================

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);


    const hideToast = useCallback((id: string) => {
        console.log("🔔 [Toast] Hiding toast:", id);
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (
            type: ToastType,
            title: string,
            message?: string,
            duration: number = 3000
        ) => {
            const id = Date.now().toString();
            const newToast: ToastData = { id, type, title, message, duration };

            console.log("🔔 [Toast] Showing toast:", title, message);
            setToasts((prev) => [...prev, newToast]);

            // Auto dismiss
            setTimeout(() => {
                hideToast(id);
            }, duration);
        },
        [hideToast]
    );

    const showCartToast = useCallback(
        (productName: string, size: string = "40", quantity: number = 1) => {
            showToast(
                "cart",
                "Đã thêm vào giỏ hàng!",
                `${productName} (Size ${size}) x${quantity}`,
                3000
            );
        },
        [showToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, showCartToast, hideToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={hideToast} />
        </ToastContext.Provider>
    );
}

// =================== HOOK =====================

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}

// =================== TOAST CONTAINER =====================

interface ToastContainerProps {
    toasts: ToastData[];
    onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {toasts.map((toast, index) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => onDismiss(toast.id)}
                    index={index}
                />
            ))}
        </View>
    );
}

// =================== TOAST ITEM =====================

interface ToastItemProps {
    toast: ToastData;
    onDismiss: () => void;
    index: number;
}

function ToastItem({ toast, onDismiss, index }: ToastItemProps) {
    const getToastStyle = () => {
        switch (toast.type) {
            case "success":
                return styles.toastSuccess;
            case "error":
                return styles.toastError;
            case "cart":
                return styles.toastCart;
            case "info":
            default:
                return styles.toastInfo;
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case "success":
                return <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />;
            case "error":
                return <Ionicons name="close-circle" size={22} color="#FFFFFF" />;
            case "cart":
                return <Ionicons name="cart" size={22} color="#FFFFFF" />;
            case "info":
            default:
                return <Ionicons name="information-circle" size={22} color="#FFFFFF" />;
        }
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify().damping(15)}
            exiting={FadeOutDown.springify()}
            style={[styles.toast, getToastStyle()]}
        >
            <View style={styles.iconContainer}>{getIcon()}</View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{toast.title}</Text>
                {toast.message && (
                    <Text style={styles.message} numberOfLines={2}>
                        {toast.message}
                    </Text>
                )}
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
        </Animated.View>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: Platform.OS === "ios" ? 60 : 50,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 99999,
        elevation: 99999,
    },
    toast: {
        flexDirection: "row",
        alignItems: "center",
        width: SCREEN_WIDTH - 32,
        marginBottom: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    toastSuccess: {
        backgroundColor: "#10B981",
    },
    toastError: {
        backgroundColor: "#EF4444",
    },
    toastCart: {
        backgroundColor: "#5B9EE1",
    },
    toastInfo: {
        backgroundColor: "#6366F1",
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        fontWeight: "400",
        color: "rgba(255, 255, 255, 0.9)",
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
});

export default ToastProvider;
