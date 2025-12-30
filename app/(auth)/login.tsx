/**
 * Login Screen
 * =============
 * User authentication with form validation and API integration
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
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
import { LoginRequest } from "../../services/api";
import { showAlert, showErrorAlert, showSuccessAlert } from "../../utils/alert";

// =================== TYPES =====================

interface FormData {
    email: string;
    password: string;
}

interface FormErrors {
    email?: string;
    password?: string;
}

// =================== COMPONENT =====================

export default function LoginScreen(): React.JSX.Element {
    const router = useRouter();
    const { login } = useAuth();

    // Form state
    const [form, setForm] = useState<FormData>({
        email: "",
        password: "",
    });

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // =================== VALIDATION =====================

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Email validation
        if (!form.email.trim()) {
            newErrors.email = "Vui lòng nhập email";
        }

        // Password validation
        if (!form.password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // =================== HANDLERS =====================

    const handleLogin = async (): Promise<void> => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Prepare login request
            const requestData: LoginRequest = {
                email: form.email.trim().toLowerCase(),
                password: form.password,
            };

            // Call login via AuthContext (this saves auth data automatically)
            const response = await login(requestData);

            // Show success message and navigate
            showSuccessAlert(
                "✅ Đăng nhập thành công!",
                `Chào mừng ${response.user.username || response.user.email} quay trở lại!`,
                () => {
                    // Navigate based on role
                    if (response.user.role === "ADMIN") {
                        router.replace("/(admin)" as any);
                    } else {
                        router.replace("/(main)");
                    }
                }
            );
        } catch (error: any) {
            console.log("Login error:", error.response?.data || error.message);

            let message = "Đăng nhập thất bại. Vui lòng thử lại.";

            const status = error.response?.status;
            if (status === 401) {
                message = "Email hoặc mật khẩu không đúng";
            } else if (status === 404) {
                message = "Tài khoản không tồn tại";
            } else if (status === 403) {
                message = "Tài khoản đã bị khóa";
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            }

            showErrorAlert("❌ Lỗi đăng nhập", message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = (): void => {
        showAlert("Thông báo", "Tính năng đang được phát triển");
    };

    const handleForgotPassword = (): void => {
        router.push("/(auth)/forgot-password" as any);
    };

    const updateForm = (field: keyof FormData, value: string): void => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    // =================== RENDER =====================

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar style="dark" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color="#1A2530" />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Xin chào!</Text>
                    <Text style={styles.subtitle}>Đăng nhập để tiếp tục mua sắm</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="example@gmail.com"
                            placeholderTextColor="#B0B0B0"
                            value={form.email}
                            onChangeText={(v) => updateForm("email", v)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <View
                            style={[
                                styles.passwordContainer,
                                errors.password && styles.inputError,
                            ]}
                        >
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="••••••••"
                                placeholderTextColor="#B0B0B0"
                                value={form.password}
                                onChangeText={(v) => updateForm("password", v)}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={22}
                                    color="#707B81"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.password && (
                            <Text style={styles.errorText}>{errors.password}</Text>
                        )}

                        {/* Forgot Password */}
                        <TouchableOpacity
                            style={styles.forgotButton}
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Đăng Nhập</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>Hoặc</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Sign In */}
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        activeOpacity={0.8}
                        disabled={loading}
                    >
                        <Image
                            source={require("../../assets/images/onboard/google.png")}
                            style={styles.googleIcon}
                        />
                        <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={styles.signUpContainer}>
                        <Text style={styles.signUpText}>Chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                            <Text style={styles.signUpLink}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        marginTop: 50,
        marginBottom: 10,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: "#F7F8FA",
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#1A2530",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#778899",
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A2530",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#F7F8FA",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: "#1A2530",
        borderWidth: 1,
        borderColor: "#E8EAED",
    },
    inputError: {
        borderColor: "#EF4444",
        backgroundColor: "#FEF2F2",
    },
    errorText: {
        color: "#EF4444",
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F7F8FA",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E8EAED",
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: "#1A2530",
    },
    eyeButton: {
        padding: 14,
    },
    forgotButton: {
        alignSelf: "flex-end",
        marginTop: 12,
    },
    forgotText: {
        fontSize: 13,
        color: "#5B9EE1",
        fontWeight: "500",
    },
    loginButton: {
        backgroundColor: "#5B9EE1",
        borderRadius: 25,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
        ...Platform.select({
            ios: {
                shadowColor: "#5B9EE1",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
            },
            web: {
                boxShadow: "0px 4px 8px rgba(91, 158, 225, 0.3)",
            } as any,
        }),
    },
    buttonDisabled: {
        backgroundColor: "#A0C4E8",
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 28,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E8EAED",
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 13,
        color: "#778899",
    },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 25,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "#E8EAED",
    },
    googleIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#1A2530",
        marginLeft: 10,
    },
    signUpContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 28,
    },
    signUpText: {
        fontSize: 14,
        color: "#778899",
    },
    signUpLink: {
        fontSize: 14,
        fontWeight: "600",
        color: "#5B9EE1",
    },
});
