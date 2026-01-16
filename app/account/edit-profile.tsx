// app/account/edit-profile.tsx
/**
 * Edit Profile Screen
 * ==================
 * Cho phép user chỉnh sửa tên, email, phone và avatar
 */

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../../config/api.config";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile, uploadAvatar } from "../../services/api";

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, refreshUser, isAuthenticated } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);

    // UI states
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Load user data khi component mount
    useEffect(() => {
        if (user) {
            setName(user.name || user.fullName || user.username || "");
            setEmail(user.email || "");
            setPhoneNumber(user.phoneNumber || "");
            // Set avatar URL nếu có
            if (user.avatar) {
                setAvatar(`${API_BASE_URL}${user.avatar}`);
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [user]);

    // Redirect nếu chưa đăng nhập
    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            if (Platform.OS === 'web') {
                setSuccessMessage("Vui lòng đăng nhập để chỉnh sửa hồ sơ");
                setTimeout(() => router.replace("/(auth)/login"), 1500);
            } else {
                Alert.alert(
                    "Chưa đăng nhập",
                    "Vui lòng đăng nhập để chỉnh sửa hồ sơ",
                    [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
                );
            }
        }
    }, [isAuthenticated, isLoading]);

    // Handle web file input
    const handleWebFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.id) return;

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatar(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await uploadAvatar(user.id, formData);
            
            // Cập nhật avatar URL mới
            setAvatar(`${API_BASE_URL}${response.avatar}`);
            
            // Refresh user data
            await refreshUser();

            // showSuccess("Cập nhật ảnh đại diện thành công!");
        } catch (error: any) {
            console.error("Upload avatar error:", error);
            showError(error.response?.data?.error || "Không thể upload ảnh");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const showSuccess = (message: string) => {
        if (Platform.OS === 'web') {
            setSuccessMessage(message);
            setShowSuccessModal(true);
        } else {
            Alert.alert("Thành công", message);
        }
    };

    const showError = (message: string) => {
        if (Platform.OS === 'web') {
            setSuccessMessage("❌ " + message);
            setShowSuccessModal(true);
        } else {
            Alert.alert("Lỗi", message);
        }
    };

    const pickImage = async () => {
        // On web, use file input
        if (Platform.OS === 'web') {
            fileInputRef.current?.click();
            return;
        }

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
            await uploadAvatarImage(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        // Camera not available on web
        if (Platform.OS === 'web') {
            fileInputRef.current?.click();
            return;
        }

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
            await uploadAvatarImage(result.assets[0]);
        }
    };

    const uploadAvatarImage = async (asset: ImagePicker.ImagePickerAsset) => {
        if (!user?.id) return;

        setIsUploadingAvatar(true);
        try {
            // Tạo FormData
            const formData = new FormData();
            const filename = asset.uri.split('/').pop() || 'avatar.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('file', {
                uri: asset.uri,
                name: filename,
                type: type,
            } as any);

            const response = await uploadAvatar(user.id, formData);
            
            // Cập nhật avatar URL mới
            setAvatar(`${API_BASE_URL}${response.avatar}`);
            
            // Refresh user data
            await refreshUser();

            // showSuccess("Cập nhật ảnh đại diện thành công!");
        } catch (error: any) {
            console.error("Upload avatar error:", error);
            showError(error.response?.data?.error || "Không thể upload ảnh");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const showImageOptions = () => {
        if (Platform.OS === 'web') {
            // On web, just use file input directly
            fileInputRef.current?.click();
        } else {
            Alert.alert("Đổi Ảnh đại diện", "Chọn một tùy chọn", [
                { text: "Chụp ảnh", onPress: takePhoto },
                { text: "Chọn từ thư viện", onPress: pickImage },
                { text: "Hủy", style: "cancel" },
            ]);
        }
    };

    const handleSave = async () => {
        // Validate inputs
        if (!name.trim()) {
            showError("Tên không được để trống");
            return;
        }
        if (!email.trim() || !email.includes("@")) {
            showError("Vui lòng nhập email hợp lệ");
            return;
        }

        // Kiểm tra user id
        if (!user?.id) {
            showError("Không tìm thấy thông tin người dùng");
            return;
        }

        setIsSaving(true);
        try {
            // Gọi API update profile
            await updateUserProfile(user.id, {
                name: name.trim(),
                email: email.trim(),
                phone: phoneNumber.trim() || undefined,
            });

            // Refresh user data từ server
            await refreshUser();

            // Show success modal - user will click OK to go back
            setSuccessMessage("✅ Cập nhật hồ sơ thành công!");
            setShowSuccessModal(true);
            
        } catch (error: any) {
            console.error("Update profile error:", error);
            const errorMessage = error.response?.data?.message ||
                error.message ||
                "Có lỗi xảy ra khi cập nhật hồ sơ";
            showError(errorMessage);
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
            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Ionicons 
                                name={successMessage.includes("❌") ? "close-circle" : "checkmark-circle"} 
                                size={60} 
                                color={successMessage.includes("❌") ? "#EF4444" : "#10B981"} 
                            />
                        </View>
                        <Text style={styles.modalTitle}>
                            {successMessage.includes("❌") ? "Thông báo" : "Thành công!"}
                        </Text>
                        <Text style={styles.modalMessage}>
                            {successMessage.replace("❌ ", "").replace("✅ ", "")}
                        </Text>
                        <TouchableOpacity 
                            style={[
                                styles.modalButton,
                                successMessage.includes("❌") ? styles.modalButtonError : styles.modalButtonSuccess
                            ]}
                            onPress={() => {
                                setShowSuccessModal(false);
                                if (!successMessage.includes("❌")) {
                                    router.back();
                                }
                            }}
                        >
                            <Text style={styles.modalButtonText}>
                                {successMessage.includes("❌") ? "Đóng" : "OK"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Hidden file input for web */}
            {Platform.OS === 'web' && (
                <input
                    ref={fileInputRef as any}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleWebFileSelect as any}
                />
            )}

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
                    <TouchableOpacity 
                        style={styles.avatarContainer} 
                        onPress={showImageOptions}
                        disabled={isUploadingAvatar}
                    >
                        {isUploadingAvatar ? (
                            <View style={[styles.avatar, styles.avatarLoading]}>
                                <ActivityIndicator size="large" color="#5B9EE1" />
                            </View>
                        ) : avatar ? (
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
                    <Text style={styles.changePhotoText}>
                        {isUploadingAvatar ? "Đang tải lên..." : "Nhấn để thay đổi ảnh"}
                    </Text>
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

                    {/* Phone Number Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.input}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#94A3B8"
                                keyboardType="phone-pad"
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
        cursor: "pointer",
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#E8ECEF",
    },
    avatarLoading: {
        justifyContent: "center",
        alignItems: "center",
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        width: "100%",
        maxWidth: 340,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
            },
            android: {
                elevation: 10,
            },
        }),
    },
    modalIconContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 15,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 22,
    },
    modalButton: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 32,
        marginTop: 20,
        minWidth: 120,
        alignItems: "center",
    },
    modalButtonSuccess: {
        backgroundColor: "#10B981",
    },
    modalButtonError: {
        backgroundColor: "#5B9EE1",
    },
    modalButtonText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "600",
    },
});
