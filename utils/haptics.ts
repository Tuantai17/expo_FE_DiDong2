/**
 * Haptics Utility
 * ===============
 * Centralized haptic feedback utilities using expo-haptics
 * Provides tactile feedback for user interactions
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// =================== TYPES =====================

type ImpactStyle = "light" | "medium" | "heavy" | "soft" | "rigid";
type NotificationType = "success" | "warning" | "error";

// =================== IMPACT MAPPING =====================

const impactStyleMap: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  soft: Haptics.ImpactFeedbackStyle.Soft,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
};

const notificationTypeMap: Record<Haptics.NotificationFeedbackType, Haptics.NotificationFeedbackType> = {
  [Haptics.NotificationFeedbackType.Success]: Haptics.NotificationFeedbackType.Success,
  [Haptics.NotificationFeedbackType.Warning]: Haptics.NotificationFeedbackType.Warning,
  [Haptics.NotificationFeedbackType.Error]: Haptics.NotificationFeedbackType.Error,
};

// =================== CORE FUNCTIONS =====================

/**
 * Trigger impact haptic feedback
 * Use for: button taps, toggles, sliders
 */
export const impact = (style: ImpactStyle = "medium") => {
  if (Platform.OS === "web") return;
  
  try {
    Haptics.impactAsync(impactStyleMap[style]);
  } catch (error) {
    console.warn("Haptic feedback error:", error);
  }
};

/**
 * Trigger notification haptic feedback
 * Use for: success/error/warning states
 */
export const notification = (type: NotificationType = "success") => {
  if (Platform.OS === "web") return;
  
  try {
    const feedbackType = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    }[type];
    
    Haptics.notificationAsync(feedbackType);
  } catch (error) {
    console.warn("Haptic feedback error:", error);
  }
};

/**
 * Trigger selection haptic feedback (lightest)
 * Use for: navigation, scrolling to items, minor selections
 */
export const selection = () => {
  if (Platform.OS === "web") return;
  
  try {
    Haptics.selectionAsync();
  } catch (error) {
    console.warn("Haptic feedback error:", error);
  }
};

// =================== PREDEFINED ACTIONS =====================

/**
 * Predefined haptic patterns for common actions
 */
export const haptics = {
  // Button interactions
  buttonPress: () => impact("light"),
  buttonPressHeavy: () => impact("medium"),
  
  // Cart actions
  addToCart: () => notification("success"),
  removeFromCart: () => impact("medium"),
  clearCart: () => impact("heavy"),
  
  // Quantity changes
  increaseQty: () => impact("light"),
  decreaseQty: () => impact("light"),
  
  // Navigation
  tabChange: () => selection(),
  drawerOpen: () => impact("soft"),
  drawerClose: () => impact("soft"),
  
  // Form feedback
  formError: () => notification("error"),
  formSuccess: () => notification("success"),
  
  // Order actions
  orderPlaced: () => notification("success"),
  paymentSuccess: () => notification("success"),
  paymentError: () => notification("error"),
  
  // Favorites
  addFavorite: () => impact("medium"),
  removeFavorite: () => impact("light"),
  
  // Refresh
  pullToRefresh: () => impact("soft"),
  
  // Selection
  sizeSelect: () => selection(),
  optionSelect: () => selection(),
  
  // Toggle
  toggle: () => impact("light"),
};

export default haptics;
