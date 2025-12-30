// app/account/edit-profile.tsx
/**
 * Edit Profile Screen
 * ==================
 * Cho phép user chỉnh sửa thông tin cá nhân và lưu về database
 */

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile } from "../../services/api";

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, refreshUser, isAuthenticated } = useAuth();

    // Form states - Load từ user context
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);

    // UI states
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load user data khi component mount
    useEffect(() => {
        if (user) {
            setName(user.name || user.fullName || user.username || "");
            setEmail(user.email || "");
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [user]);

    // Redirect nếu chưa đăng nhập
    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            Alert.alert(
                "Chưa đăng nhập",
                "Vui lòng đăng nhập để chỉnh sửa hồ sơ",
                [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
            );
        }
    }, [isAuthenticated, isLoading]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Cần cấp quyền",
                "Vui lòng cấp quyền truy cập thư viện ảnh để thay đổi avatar."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatar(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Cần cấp quyền",
                "Vui lòng cấp quyền camera để chụp ảnh."
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatar(result.assets[0].uri);
        }
    };

    const showImageOptions = () => {
        Alert.alert("Đổi Avatar", "Chọn một tùy chọn", [
            { text: "Chụp ảnh", onPress: takePhoto },
            { text: "Chọn từ thư viện", onPress: pickImage },
            { text: "Hủy", style: "cancel" },
        ]);
    };

    const handleSave = async () => {
        // Validate inputs
        if (!name.trim()) {
            Alert.alert("Lỗi", "Tên không được để trống");
            return;
        }
        if (!email.trim() || !email.includes("@")) {
            Alert.alert("Lỗi", "Vui lòng nhập email hợp lệ");
            return;
        }

        // Kiểm tra user id
        if (!user?.id) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
            return;
        }

        setIsSaving(true);
        try {
            // Gọi API update profile
            await updateUserProfile(user.id, {
                name: name.trim(),
                email: email.trim(),
            });

            // Refresh user data từ server
            await refreshUser();

            Alert.alert("Thành công", "Cập nhật hồ sơ thành công!", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error: any) {
            console.error("Update profile error:", error);
            const errorMessage = error.response?.data?.message ||
                error.message ||
                "Có lỗi xảy ra khi cập nhật hồ sơ";
            Alert.alert("Lỗi", errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B9EE1" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    // Chưa đăng nhập
    if (!isAuthenticated) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="person-outline" size={60} color="#94A3B8" />
                <Text style={styles.loadingText}>Vui lòng đăng nhập</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={showImageOptions}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatar} />
                        ) : (
                            <Image
                                source={require("../../assets/images/home/user.png")}
                                style={styles.avatar}
                            />
                        )}
                        <View style={styles.editAvatarBtn}>
                            <Ionicons name="camera" size={18} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>Nhấn để thay đổi ảnh</Text>
                </View>

                {/* User ID Badge */}
                {user?.id && (
                    <View style={styles.userIdContainer}>
                        <View style={styles.userIdBadge}>
                            <Ionicons name="finger-print-outline" size={16} color="#5B9EE1" />
                            <Text style={styles.userIdText}>ID: {user.id}</Text>
                        </View>
                    </View>
                )}

                {/* Form */}
                <View style={styles.formCard}>
                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ và tên</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Nhập họ và tên"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ Email</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Nhập email của bạn"
                                placeholderTextColor="#94A3B8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Role (Read-only) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vai trò</Text>
                        <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                            <Ionicons name="shield-outline" size={20} color="#94A3B8" />
                            <Text style={styles.readOnlyText}>
                                {user?.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                            </Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>{user?.role || "USER"}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Info Note */}
                <View style={styles.infoNote}>
                    <Ionicons name="information-circle-outline" size={18} color="#5B9EE1" />
                    <Text style={styles.infoNoteText}>
                        Thông tin sẽ được cập nhật trực tiếp vào hệ thống
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <ActivityIndicator size="small" color="#FFF" />
                            <Text style={styles.saveText}>Đang lưu...</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />
                            <Text style={styles.saveText}>Lưu thay đổi</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingTop: 50,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: "#64748B",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: 16,
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#E8ECEF",
    },
    editAvatarBtn: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#5B9EE1",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FFFFFF",
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.3,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 3,
            },
        }),
    },
    changePhotoText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748B",
    },
    userIdContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    userIdBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EBF4FF",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    userIdText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#5B9EE1",
    },
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 3,
            },
        }),
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: "#F8FAFC",
        gap: 12,
    },
    readOnlyInput: {
        backgroundColor: "#F1F5F9",
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#0F172A",
    },
    readOnlyText: {
        flex: 1,
        fontSize: 15,
        color: "#64748B",
    },
    roleBadge: {
        backgroundColor: "#5B9EE1",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FFF",
    },
    infoNote: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EBF4FF",
        padding: 14,
        borderRadius: 12,
        marginTop: 16,
        gap: 10,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 13,
        color: "#5B9EE1",
    },
    saveBtn: {
        flexDirection: "row",
        backgroundColor: "#5B9EE1",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 24,
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 5,
            },
        }),
    },
    saveBtnDisabled: {
        opacity: 0.7,
    },
    saveText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
