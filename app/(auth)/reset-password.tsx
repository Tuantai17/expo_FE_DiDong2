import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScaledSize,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
} from 'react-native';
import { ENDPOINTS } from '../../config/api.config';

export default function ResetPasswordScreen(): React.JSX.Element {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;
    const otp = params.otp as string;

    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
            setDimensions(window);
        });
        return () => subscription?.remove();
    }, []);

    const handleResetPassword = async (): Promise<void> => {
        // Validate
        if (!newPassword.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(ENDPOINTS.resetPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    otp: otp,
                    newPassword: newPassword,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowSuccessModal(true);
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể đặt lại mật khẩu');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessConfirm = () => {
        setShowSuccessModal(false);
        // Chuyển về trang login
        router.replace('/(auth)/login');
    };

    const { width, height } = dimensions;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="dark" />
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingHorizontal: width * 0.06 }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={[styles.backButton, { marginTop: height * 0.06 }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color="#1A2530" />
                </TouchableOpacity>

                {/* Header */}
                <View style={[styles.header, { marginBottom: height * 0.04 }]}>
                    <Text style={[styles.title, { fontSize: width * 0.07 }]}>
                        Đặt lại mật khẩu
                    </Text>
                    <Text style={[styles.subtitle, { fontSize: width * 0.038 }]}>
                        Tạo mật khẩu mới cho tài khoản của bạn
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* New Password */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { fontSize: width * 0.035 }]}>
                            Mật khẩu mới
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[
                                    styles.input,
                                    { paddingVertical: height * 0.018, fontSize: width * 0.038 }
                                ]}
                                placeholder="Nhập mật khẩu mới"
                                placeholderTextColor="#B0B0B0"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                <Ionicons
                                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color="#778899"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { fontSize: width * 0.035 }]}>
                            Xác nhận mật khẩu
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[
                                    styles.input,
                                    { paddingVertical: height * 0.018, fontSize: width * 0.038 }
                                ]}
                                placeholder="Nhập lại mật khẩu mới"
                                placeholderTextColor="#B0B0B0"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color="#778899"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Password Requirements */}
                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementTitle}>Yêu cầu mật khẩu:</Text>
                        <View style={styles.requirementItem}>
                            <Ionicons
                                name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={newPassword.length >= 6 ? '#4CAF50' : '#B0B0B0'}
                            />
                            <Text style={[
                                styles.requirementText,
                                newPassword.length >= 6 && styles.requirementTextValid
                            ]}>
                                Ít nhất 6 ký tự
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Ionicons
                                name={newPassword === confirmPassword && confirmPassword.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={newPassword === confirmPassword && confirmPassword.length > 0 ? '#4CAF50' : '#B0B0B0'}
                            />
                            <Text style={[
                                styles.requirementText,
                                newPassword === confirmPassword && confirmPassword.length > 0 && styles.requirementTextValid
                            ]}>
                                Mật khẩu xác nhận khớp
                            </Text>
                        </View>
                    </View>

                    {/* Reset Button */}
                    <TouchableOpacity
                        style={[
                            styles.resetButton,
                            { paddingVertical: height * 0.02, marginTop: height * 0.02 },
                            isLoading && styles.buttonDisabled
                        ]}
                        onPress={handleResetPassword}
                        activeOpacity={0.8}
                        disabled={isLoading}
                    >
                        <Text style={[styles.resetButtonText, { fontSize: width * 0.04 }]}>
                            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                        </View>
                        <Text style={styles.modalTitle}>Thành công!</Text>
                        <Text style={styles.modalMessage}>
                            Mật khẩu của bạn đã được đặt lại thành công.{'\n'}
                            Vui lòng đăng nhập với mật khẩu mới.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleSuccessConfirm}
                        >
                            <Text style={styles.modalButtonText}>Đăng nhập ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        marginBottom: 10,
        justifyContent: 'center',
    },
    header: {},
    title: {
        fontWeight: 'bold',
        color: '#1A2530',
        marginBottom: 12,
    },
    subtitle: {
        color: '#778899',
        fontWeight: '400',
        lineHeight: 22,
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontWeight: '500',
        color: '#1A2530',
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8EAED',
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        color: '#1A2530',
    },
    eyeButton: {
        padding: 12,
    },
    requirementsContainer: {
        backgroundColor: '#F7F8FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    requirementTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A2530',
        marginBottom: 10,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    requirementText: {
        fontSize: 13,
        color: '#778899',
        marginLeft: 8,
    },
    requirementTextValid: {
        color: '#4CAF50',
    },
    resetButton: {
        backgroundColor: '#5B9EE1',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#5B9EE1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    resetButtonText: {
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    // Modal styles
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
    },
    successIconContainer: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A2530',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 15,
        color: '#778899',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: '#5B9EE1',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
