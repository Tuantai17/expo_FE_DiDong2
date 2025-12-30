import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
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

export default function VerifyOtpScreen(): React.JSX.Element {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(300); // 5 phút
    const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
            setDimensions(window);
        });
        return () => subscription?.remove();
    }, []);

    // Đếm ngược thời gian
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            value = value[value.length - 1];
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Tự động chuyển sang ô tiếp theo
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (): Promise<void> => {
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            Alert.alert('Lỗi', 'Vui lòng nhập đủ 6 số OTP');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(ENDPOINTS.verifyOtp, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    otp: otpString,
                }),
            });

            const data = await response.json();

            if (data.valid) {
                setShowSuccessModal(true);
            } else {
                Alert.alert('Lỗi', data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async (): Promise<void> => {
        if (countdown > 0) return;

        setIsLoading(true);

        try {
            const response = await fetch(ENDPOINTS.forgotPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setCountdown(300);
                setOtp(['', '', '', '', '', '']);
                Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
            } else {
                Alert.alert('Lỗi', data.message);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể gửi lại mã OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessConfirm = () => {
        setShowSuccessModal(false);
        router.push({
            pathname: '/(auth)/reset-password',
            params: { email, otp: otp.join('') }
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
                <View style={[styles.header, { marginBottom: height * 0.03 }]}>
                    <Text style={[styles.title, { fontSize: width * 0.07 }]}>
                        Xác thực OTP
                    </Text>
                    <Text style={[styles.subtitle, { fontSize: width * 0.038 }]}>
                        Nhập mã OTP 6 số đã được gửi đến{'\n'}
                        <Text style={styles.emailText}>{email}</Text>
                    </Text>
                </View>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.otpInput,
                                { fontSize: width * 0.06 },
                                digit ? styles.otpInputFilled : {}
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            editable={!isLoading}
                        />
                    ))}
                </View>

                {/* Countdown */}
                <View style={styles.countdownContainer}>
                    <Text style={styles.countdownText}>
                        Mã OTP hết hạn sau: <Text style={styles.countdownTime}>{formatTime(countdown)}</Text>
                    </Text>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                    style={[
                        styles.verifyButton,
                        { paddingVertical: height * 0.02 },
                        isLoading && styles.buttonDisabled
                    ]}
                    onPress={handleVerify}
                    activeOpacity={0.8}
                    disabled={isLoading}
                >
                    <Text style={[styles.verifyButtonText, { fontSize: width * 0.04 }]}>
                        {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
                    </Text>
                </TouchableOpacity>

                {/* Resend OTP */}
                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Không nhận được mã? </Text>
                    <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={countdown > 0 || isLoading}
                    >
                        <Text style={[
                            styles.resendLink,
                            countdown > 0 && styles.resendLinkDisabled
                        ]}>
                            Gửi lại
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
                        <Text style={styles.modalTitle}>Xác thực thành công!</Text>
                        <Text style={styles.modalMessage}>
                            Mã OTP đã được xác nhận.{'\n'}
                            Tiếp tục đặt mật khẩu mới.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleSuccessConfirm}
                        >
                            <Text style={styles.modalButtonText}>Tiếp tục</Text>
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
    emailText: {
        color: '#5B9EE1',
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    otpInput: {
        width: 50,
        height: 55,
        borderWidth: 1,
        borderColor: '#E8EAED',
        borderRadius: 12,
        textAlign: 'center',
        backgroundColor: '#F7F8FA',
        color: '#1A2530',
        fontWeight: 'bold',
    },
    otpInputFilled: {
        borderColor: '#5B9EE1',
        backgroundColor: '#EBF5FF',
    },
    countdownContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    countdownText: {
        color: '#778899',
        fontSize: 14,
    },
    countdownTime: {
        color: '#5B9EE1',
        fontWeight: 'bold',
    },
    verifyButton: {
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
    verifyButtonText: {
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    resendText: {
        color: '#778899',
        fontSize: 14,
    },
    resendLink: {
        color: '#5B9EE1',
        fontSize: 14,
        fontWeight: '600',
    },
    resendLinkDisabled: {
        color: '#B0B0B0',
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
