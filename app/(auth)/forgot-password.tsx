import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function ForgotPasswordScreen(): React.JSX.Element {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
            setDimensions(window);
        });

        return () => subscription?.remove();
    }, []);

    const handleContinue = async (): Promise<void> => {
        // Validate email
        if (!email.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email hợp lệ');
            return;
        }

        setIsLoading(true);

        try {
            console.log('📤 Đang gửi yêu cầu OTP đến:', ENDPOINTS.forgotPassword);

            const response = await fetch(ENDPOINTS.forgotPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            console.log('📥 Response status:', response.status);

            const data = await response.json();
            console.log('📦 Response data:', data);

            if (data.success) {
                // Hiển thị modal thành công
                setShowSuccessModal(true);
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể gửi mã OTP');
            }
        } catch (error: any) {
            console.error('🔥 Forgot password error:', error);
            Alert.alert(
                'Lỗi kết nối',
                'Không thể kết nối đến máy chủ.\nVui lòng kiểm tra:\n• Backend đang chạy\n• Kết nối mạng'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessConfirm = () => {
        setShowSuccessModal(false);
        // Chuyển sang màn hình nhập OTP
        router.push({
            pathname: '/(auth)/verify-otp',
            params: { email: email.trim() }
        });
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
                <View style={[styles.header, { marginBottom: height * 0.05 }]}>
                    <Text style={[styles.title, { fontSize: width * 0.07 }]}>
                        Quên mật khẩu
                    </Text>
                    <Text style={[styles.subtitle, { fontSize: width * 0.038 }]}>
                        Nhập địa chỉ email của bạn để nhận{'\n'}mã xác thực OTP
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { fontSize: width * 0.035 }]}>
                            Địa chỉ Email
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    paddingVertical: height * 0.02,
                                    fontSize: width * 0.038,
                                }
                            ]}
                            placeholder="example@gmail.com"
                            placeholderTextColor="#B0B0B0"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#5B9EE1" />
                        <Text style={styles.infoText}>
                            Mã OTP sẽ được gửi đến email của bạn và có hiệu lực trong 5 phút.
                        </Text>
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            {
                                paddingVertical: height * 0.02,
                                marginTop: height * 0.02,
                            },
                            isLoading && styles.buttonDisabled
                        ]}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                        disabled={isLoading}
                    >
                        <Text style={[styles.continueButtonText, { fontSize: width * 0.04 }]}>
                            {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </Text>
                    </TouchableOpacity>

                    {/* Back to Login */}
                    <TouchableOpacity
                        style={styles.backToLogin}
                        onPress={() => router.push('/(auth)/login')}
                        disabled={isLoading}
                    >
                        <Text style={styles.backToLoginText}>
                            Quay lại <Text style={styles.backToLoginLink}>Đăng nhập</Text>
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
                        {/* Email Icon */}
                        <View style={styles.emailIconContainer}>
                            <Ionicons name="mail-outline" size={60} color="#5B9EE1" />
                        </View>

                        <Text style={styles.modalTitle}>Kiểm tra email!</Text>
                        <Text style={styles.modalMessage}>
                            Mã OTP đã được gửi đến{'\n'}
                            <Text style={styles.modalEmail}>{email}</Text>
                        </Text>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleSuccessConfirm}
                        >
                            <Text style={styles.modalButtonText}>Nhập mã OTP</Text>
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
    input: {
        backgroundColor: '#F7F8FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        color: '#1A2530',
        borderWidth: 1,
        borderColor: '#E8EAED',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EBF5FF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        color: '#5B9EE1',
        fontSize: 13,
        lineHeight: 18,
    },
    continueButton: {
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
    continueButtonText: {
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    backToLogin: {
        marginTop: 24,
        alignItems: 'center',
    },
    backToLoginText: {
        color: '#778899',
        fontSize: 14,
    },
    backToLoginLink: {
        color: '#5B9EE1',
        fontWeight: '600',
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
    emailIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
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
    modalEmail: {
        color: '#5B9EE1',
        fontWeight: '600',
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
