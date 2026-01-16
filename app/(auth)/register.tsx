import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    Image,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ENDPOINTS } from '../../config/api.config';

// ========================================
// COMPONENT CHÍNH
// ========================================
export default function SignupScreen() {
    const router = useRouter();

    // State quản lý form
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // ========================================
    // XỬ LÝ ĐĂNG KÝ
    // ========================================
    const handleRegister = async () => {
        const { username, email, phone, password, confirmPassword } = formData;

        // Validate input - Kiểm tra tất cả các trường bắt buộc
        if (!username.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin!");
            return;
        }

        // Validate name length - Tên phải có ít nhất 2 ký tự
        if (username.trim().length < 2) {
            Alert.alert("Thông báo", "Tên phải có ít nhất 2 ký tự!");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Thông báo", "Email không hợp lệ!");
            return;
        }

        // Validate phone number - Số điện thoại Việt Nam (10-11 số)
        const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            Alert.alert("Thông báo", "Số điện thoại không hợp lệ!\nVui lòng nhập số điện thoại Việt Nam (VD: 0901234567)");
            return;
        }

        // Validate password length
        if (password.length < 6) {
            Alert.alert("Thông báo", "Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }

        // Validate password match - Kiểm tra mật khẩu xác nhận
        if (password !== confirmPassword) {
            Alert.alert("Thông báo", "Mật khẩu xác nhận không khớp!");
            return;
        }

        setIsLoading(true);

        try {
            console.log("📤 Đang gửi request tới:", ENDPOINTS.register);

            const response = await fetch(ENDPOINTS.register, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: username,
                    email: email,
                    phone: phone,
                    password: password,
                }),
            });

            console.log("📥 Response status:", response.status);

            // Parse response body
            const data = await response.json();
            console.log("📦 Response data:", data);

            if (response.ok) {
                // Đăng ký thành công - Hiển thị modal thông báo
                console.log("✅ Đăng ký thành công, hiển thị modal...");

                // Reset form ngay lập tức
                setFormData({ username: '', email: '', phone: '', password: '', confirmPassword: '' });

                // Hiển thị Success Modal
                setShowSuccessModal(true);

                return; // Dừng xử lý ở đây
            } else {
                // Đăng ký thất bại - hiển thị lỗi từ server
                const errorMessage = data.message || "Đăng ký thất bại. Vui lòng thử lại.";
                Alert.alert("❌ Lỗi", errorMessage);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("🔥 Network Error:", errorMessage);
            Alert.alert(
                "⚠️ Lỗi kết nối",
                "Không thể kết nối đến máy chủ.\nVui lòng kiểm tra:\n• Backend đang chạy\n• IP address đúng\n• Cùng mạng WiFi"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================
    // XỬ LÝ ĐĂNG NHẬP GOOGLE (Placeholder)
    // ========================================
    const handleGoogleSignIn = () => {
        Alert.alert("Thông báo", "Tính năng đăng nhập Google đang được phát triển!");
    };

    // ========================================
    // XỬ LÝ KHI NHẤN NÚT ĐĂNG NHẬP SAU KHI ĐĂNG KÝ THÀNH CÔNG
    // ========================================
    const handleSuccessConfirm = () => {
        console.log("🚀 Chuyển sang trang login...");
        setShowSuccessModal(false);
        router.replace("/(auth)/login");
    };

    // ========================================
    // CẬP NHẬT FORM DATA
    // ========================================
    const updateFormField = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // ========================================
    // RENDER UI
    // ========================================
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        disabled={isLoading}
                    >
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>

                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Let's Create Account Together</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        {/* Your Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Your Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Alisson Becker"
                                placeholderTextColor="#A0A0A0"
                                value={formData.username}
                                onChangeText={(text) => updateFormField('username', text)}
                                editable={!isLoading}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="alissonbecker@gmail.com"
                                placeholderTextColor="#A0A0A0"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => updateFormField('email', text)}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Phone Number Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0901234567"
                                placeholderTextColor="#A0A0A0"
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(text) => updateFormField('phone', text)}
                                editable={!isLoading}
                                maxLength={11}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="••••••••"
                                    placeholderTextColor="#A0A0A0"
                                    secureTextEntry={!showPassword}
                                    value={formData.password}
                                    onChangeText={(text) => updateFormField('password', text)}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={22}
                                        color="#A0A0A0"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="••••••••"
                                    placeholderTextColor="#A0A0A0"
                                    secureTextEntry={!showConfirmPassword}
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => updateFormField('confirmPassword', text)}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                        size={22}
                                        color="#A0A0A0"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={[styles.signInBtn, isLoading && styles.signInBtnDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.signInBtnText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Sign In Button */}
                    <TouchableOpacity
                        style={styles.googleBtn}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        <Image
                            source={{ uri: 'https://www.google.com/favicon.ico' }}
                            style={styles.googleIcon}
                        />
                        <Text style={styles.googleBtnText}>Sign in with google</Text>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginLinkText}>Already Have An Account? </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/login")}
                            disabled={isLoading}
                        >
                            <Text style={styles.loginLinkHighlight}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => { }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Success Icon */}
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                        </View>

                        {/* Title */}
                        <Text style={styles.modalTitle}>Đăng ký thành công!</Text>

                        {/* Message */}
                        <Text style={styles.modalMessage}>
                            Tài khoản của bạn đã được tạo thành công.{'\n'}
                            Vui lòng đăng nhập để tiếp tục.
                        </Text>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleSuccessConfirm}
                        >
                            <Text style={styles.modalButtonText}>Đăng nhập ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
    // Container
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },

    // Back Button
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },

    // Header
    headerSection: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#808080',
    },

    // Form
    formSection: {
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#808080',
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        color: '#1A1A1A',
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        paddingVertical: 12,
        paddingHorizontal: 0,
    },
    eyeButton: {
        padding: 8,
    },

    // Sign In Button
    signInBtn: {
        backgroundColor: '#5DADE2',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#5DADE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    signInBtnDisabled: {
        opacity: 0.7,
    },
    signInBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // Divider
    dividerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#E8E8E8',
    },

    // Google Button
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        backgroundColor: '#FFFFFF',
        marginBottom: 30,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleBtnText: {
        fontSize: 15,
        color: '#1A1A1A',
        fontWeight: '500',
    },

    // Login Link
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginLinkText: {
        fontSize: 14,
        color: '#808080',
    },
    loginLinkHighlight: {
        fontSize: 14,
        color: '#5DADE2',
        fontWeight: '600',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    successIconContainer: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: '#5DADE2',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#5DADE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});