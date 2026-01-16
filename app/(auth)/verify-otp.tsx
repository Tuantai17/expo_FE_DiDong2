import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScaledSize,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ENDPOINTS } from '../../config/api.config';

export default function VerifyOtpScreen(): React.JSX.Element {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    // State cho OTP - lưu trữ chuỗi 6 số
    const [otpValue, setOtpValue] = useState<string>('');
    const hiddenInputRef = useRef<TextInput | null>(null);
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(300); // 5 phút
    const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));
    const [showSuccessModal, setShowSuccessModal] = useState(false);

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

    const handleOtpInputChange = (value: string) => {
        // Chỉ cho phép số và tối đa 6 ký tự
        const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
        setOtpValue(numericValue);
    };

    const handleBoxPress = () => {
        // Focus vào hidden input khi nhấn vào các ô
        hiddenInputRef.current?.focus();
    };

    // Chuyển đổi otpValue thành mảng để hiển thị
    const getDigitAtIndex = (index: number): string => {
        return otpValue[index] || '';
    };

    const handleVerify = async (): Promise<void> => {
        if (otpValue.length !== 6) {
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
                    otp: otpValue,
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
                setOtpValue('');
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
            params: { email, otp: otpValue }
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

                {/* OTP Input - Hidden Input + Display Boxes */}
                <View style={styles.otpContainer}>
                    {/* Input ẩn để hứng sự kiện bàn phím */}
                    <TextInput
                        ref={hiddenInputRef}
                        style={styles.hiddenInput}
                        value={otpValue}
                        onChangeText={handleOtpInputChange}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus={true}
                        caretHidden={true}
                        contextMenuHidden={true}
                        selectTextOnFocus={false}
                        editable={!isLoading}
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                    />

                    {/* Các ô hiển thị số */}
                    <View style={styles.otpBoxesContainer}>
                        {Array(6).fill(0).map((_, index) => {
                            const digit = getDigitAtIndex(index);
                            const isFocused = index === otpValue.length;
                            const isFilled = digit !== '';
                            
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.otpBox,
                                        isFilled ? styles.otpBoxFilled : {},
                                        isFocused ? styles.otpBoxFocused : {}
                                    ]}
                                    onPress={handleBoxPress}
                                    activeOpacity={1}
                                >
                                    <Text style={[
                                        styles.otpText,
                                        { fontSize: width * 0.06 }
                                    ]}>
                                        {digit}
                                    </Text>
                                    {/* Cursor giả lập nếu cần */}
                                    {isFocused && (
                                        <View style={styles.fakeCursor} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
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
        marginBottom: 30,
    },
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
    otpBoxesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    otpBox: {
        width: 50,
        height: 55,
        borderWidth: 1,
        borderColor: '#E8EAED',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F8FA',
    },
    otpBoxFilled: {
        backgroundColor: '#EBF5FF',
        borderColor: '#5B9EE1',
    },
    otpBoxFocused: {
        borderColor: '#5B9EE1',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
    },
    otpText: {
        color: '#1A2530',
        fontWeight: 'bold',
    },
    fakeCursor: {
        position: 'absolute',
        width: 2,
        height: 24,
        backgroundColor: '#5B9EE1',
        borderRadius: 1,
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
