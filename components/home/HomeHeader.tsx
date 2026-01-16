/**
 * HomeHeader Component
 * =====================
 * Header cho trang chủ với:
 * - Menu button (hamburger)
 * - Greeting section: Hiển thị "Xin chào, [Tên]" khi đã đăng nhập
 * - Wishlist & Cart buttons
 * 
 * Cấu trúc dễ chỉnh sửa:
 * - Constants cho text/config
 * - Helper functions riêng biệt
 * - Render functions cho từng section
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../config/api.config";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useNotificationBadge } from "../../hooks/useNotifications";

// =================== TYPES =====================

type HomeHeaderProps = {
  // Props can be added here if needed
};

// =================== CONSTANTS =====================

// Các text có thể thay đổi dễ dàng
const TEXTS = {
  greeting: {
    morning: "Chào buổi sáng",     // 5:00 - 11:59
    afternoon: "Chào buổi chiều",  // 12:00 - 17:59
    evening: "Chào buổi tối",      // 18:00 - 4:59
    default: "Xin chào",
  },
  guestName: "Khách",
  welcomeLabel: "Chào mừng bạn đến với",
  storeName: "ShoeShop",
  loginPrompt: "Đăng nhập ngay",
};

// =================== HELPER FUNCTIONS =====================

/**
 * Lấy lời chào theo thời gian trong ngày
 */
const getGreetingByTime = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return TEXTS.greeting.morning;
  } else if (hour >= 12 && hour < 18) {
    return TEXTS.greeting.afternoon;
  } else {
    return TEXTS.greeting.evening;
  }
};

/**
 * Lấy tên hiển thị từ user object
 * Ưu tiên: fullName > name > email (trước @) > Guest
 */
const getDisplayName = (user: any): string => {
  if (!user) return TEXTS.guestName;

  // Ưu tiên fullName
  if (user.fullName && user.fullName.trim()) {
    return user.fullName.trim();
  }

  // Fallback to name
  if (user.name && user.name.trim()) {
    return user.name.trim();
  }

  // Fallback to email (lấy phần trước @)
  if (user.email) {
    const emailName = user.email.split("@")[0];
    // Capitalize first letter
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  return TEXTS.guestName;
};

/**
 * Rút gọn tên nếu quá dài
 */
const truncateName = (name: string, maxLength: number = 15): string => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 2) + "...";
};

// =================== COMPONENT =====================

export default function HomeHeader({}: HomeHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items } = useCart();
  const notificationCount = useNotificationBadge();

  // =================== COMPUTED VALUES =====================

  const cartItemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  const greeting = useMemo(() => {
    return getGreetingByTime();
  }, []);

  const displayName = useMemo(() => {
    return getDisplayName(user);
  }, [user]);

  const truncatedName = useMemo(() => {
    return truncateName(displayName);
  }, [displayName]);

  // =================== HANDLERS =====================

  const handleGreetingPress = () => {
    if (isAuthenticated) {
      // Đã đăng nhập -> Đi tới trang profile
      router.push("/(main)/profile");
    } else {
      // Chưa đăng nhập -> Đi tới login
      router.push("/(auth)/login");
    }
  };

  const handleNotificationPress = () => {
    if (isAuthenticated) {
      router.push("/account/notifications");
    } else {
      // Nếu chưa đăng nhập, yêu cầu đăng nhập trước
      router.push("/(auth)/login");
    }
  };

  const handleCartPress = () => {
    router.push("/(main)/cart");
  };

  // =================== RENDER FUNCTIONS =====================

  const renderGreetingSection = () => (
    <TouchableOpacity
      style={styles.greetingContainer}
      onPress={handleGreetingPress}
      activeOpacity={0.8}
    >
      {/* Avatar/Icon */}
      {/* Avatar/Icon */}
      <View style={[
        styles.avatarContainer,
        isAuthenticated && !user?.avatar && styles.avatarContainerActive
      ]}>
        {isAuthenticated && user?.avatar ? (
          <Image
            source={{ uri: `${API_BASE_URL}${user.avatar}` }}
            style={styles.avatarImage}
          />
        ) : (
          <Ionicons
            name={isAuthenticated ? "person" : "person-outline"}
            size={16}
            color={isAuthenticated ? "#FFFFFF" : "#5B9EE1"}
          />
        )}
      </View>

      {/* Text Content */}
      <View style={styles.greetingTextContainer}>
        {isAuthenticated ? (
          // Đã đăng nhập: Hiển thị lời chào + tên
          <>
            <Text style={styles.greetingLabel}>{greeting}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {truncatedName}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              </View>
            </View>
          </>
        ) : (
          // Chưa đăng nhập: Hiển thị prompt đăng nhập
          <>
            <Text style={styles.greetingLabel}>{TEXTS.welcomeLabel}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.storeName}>{TEXTS.storeName}</Text>
              <Text style={styles.loginPrompt}>{TEXTS.loginPrompt}</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRightIcons = () => (
    <View style={styles.rightIcons}>
      {/* Notification Button with Badge */}
      <TouchableOpacity
        style={[styles.iconButton, styles.notificationButton]}
        onPress={handleNotificationPress}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={22} color="#0F172A" />
        {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {notificationCount > 9 ? "9+" : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Cart Button with Badge */}
      <TouchableOpacity
        style={[styles.iconButton, styles.cartButton]}
        onPress={handleCartPress}
        activeOpacity={0.7}
      >
        <Ionicons name="bag-outline" size={22} color="#0F172A" />
        {cartItemCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // =================== MAIN RENDER =====================

  return (
    <View style={styles.container}>
      {renderGreetingSection()}
      {renderRightIcons()}
    </View>
  );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  // Icon Button
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cartButton: {
    marginLeft: 10,
    position: "relative" as const,
  },
  notificationButton: {
    position: "relative" as const,
  },

  // Notification Badge
  notificationBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },

  // Cart Badge
  cartBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },

  // Greeting Section
  greetingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    paddingVertical: 4,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarContainerActive: {
    backgroundColor: "#5B9EE1",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },

  // Greeting Text
  greetingTextContainer: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    maxWidth: 120,
  },
  verifiedBadge: {
    marginLeft: 2,
  },

  // Store Name (khi chưa đăng nhập)
  storeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  loginPrompt: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5B9EE1",
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#EBF4FF",
    borderRadius: 6,
    overflow: "hidden",
  },

  // Right Icons
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
});
