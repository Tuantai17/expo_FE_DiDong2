/**
 * Cross-Platform Alert Utility
 * ============================
 * Shows alerts that work on iOS, Android, and Web
 */

import { Alert, Platform } from "react-native";

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
}

export interface AlertOptions {
    cancelable?: boolean;
}

/**
 * Show an alert that works on all platforms (iOS, Android, Web)
 */
export const showAlert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
): void => {
    if (Platform.OS === "web") {
        // Web: Use window.confirm or window.alert
        const fullMessage = message ? `${title}\n\n${message}` : title;

        if (buttons && buttons.length > 0) {
            // If there's only one button or we want to use confirm
            if (buttons.length === 1) {
                window.alert(fullMessage);
                buttons[0].onPress?.();
            } else {
                // For multiple buttons, use confirm (OK/Cancel)
                const result = window.confirm(fullMessage);
                if (result) {
                    // Find the default/OK button
                    const okButton = buttons.find(b => b.style !== "cancel") || buttons[0];
                    okButton.onPress?.();
                } else {
                    // Find the cancel button
                    const cancelButton = buttons.find(b => b.style === "cancel");
                    cancelButton?.onPress?.();
                }
            }
        } else {
            window.alert(fullMessage);
        }
    } else {
        // iOS/Android: Use React Native Alert
        Alert.alert(title, message, buttons, options);
    }
};

/**
 * Show a success alert and execute callback
 */
export const showSuccessAlert = (
    title: string,
    message: string,
    onOk?: () => void
): void => {
    showAlert(
        title,
        message,
        [{ text: "OK", onPress: onOk, style: "default" }],
        { cancelable: false }
    );
};

/**
 * Show an error alert
 */
export const showErrorAlert = (title: string, message: string): void => {
    showAlert(title, message, [{ text: "OK", style: "default" }]);
};

/**
 * Show a confirmation dialog
 */
export const showConfirmAlert = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = "Xác nhận",
    cancelText: string = "Hủy"
): void => {
    showAlert(
        title,
        message,
        [
            { text: cancelText, onPress: onCancel, style: "cancel" },
            { text: confirmText, onPress: onConfirm, style: "default" },
        ],
        { cancelable: true }
    );
};
