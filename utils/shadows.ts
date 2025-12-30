/**
 * Shadow Styles Helper
 * ====================
 * Cross-platform shadow styles that work on iOS, Android, and Web
 */

import { Platform, ViewStyle } from "react-native";

export interface ShadowOptions {
    color?: string;
    offsetX?: number;
    offsetY?: number;
    opacity?: number;
    radius?: number;
    elevation?: number;
}

/**
 * Create cross-platform shadow styles
 * Works on iOS (shadow*), Android (elevation), and Web (boxShadow)
 */
export const createShadow = (options: ShadowOptions = {}): ViewStyle => {
    const {
        color = "#000",
        offsetX = 0,
        offsetY = 4,
        opacity = 0.3,
        radius = 8,
        elevation = 5,
    } = options;

    // Convert hex color to rgba for web
    const hexToRgba = (hex: string, alpha: number): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(0, 0, 0, ${alpha})`;
    };

    return Platform.select({
        ios: {
            shadowColor: color,
            shadowOffset: { width: offsetX, height: offsetY },
            shadowOpacity: opacity,
            shadowRadius: radius,
        },
        android: {
            elevation: elevation,
        },
        web: {
            boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${hexToRgba(color, opacity)}`,
        } as any,
        default: {},
    }) as ViewStyle;
};

/**
 * Pre-defined shadow presets for common use cases
 */
export const shadows = {
    // Small shadow for cards, inputs
    small: createShadow({
        offsetY: 2,
        radius: 4,
        opacity: 0.1,
        elevation: 2,
    }),

    // Medium shadow for buttons, floating elements
    medium: createShadow({
        offsetY: 4,
        radius: 8,
        opacity: 0.15,
        elevation: 4,
    }),

    // Large shadow for modals, dialogs
    large: createShadow({
        offsetY: 8,
        radius: 16,
        opacity: 0.2,
        elevation: 8,
    }),

    // Primary button shadow (blue)
    primaryButton: createShadow({
        color: "#5B9EE1",
        offsetY: 4,
        radius: 8,
        opacity: 0.3,
        elevation: 5,
    }),

    // Success button shadow (green)
    successButton: createShadow({
        color: "#10B981",
        offsetY: 4,
        radius: 8,
        opacity: 0.3,
        elevation: 5,
    }),

    // Danger button shadow (red)
    dangerButton: createShadow({
        color: "#EF4444",
        offsetY: 4,
        radius: 8,
        opacity: 0.3,
        elevation: 5,
    }),

    // Card shadow
    card: createShadow({
        offsetY: 2,
        radius: 8,
        opacity: 0.08,
        elevation: 3,
    }),

    // No shadow (for disabled states)
    none: {} as ViewStyle,
};
