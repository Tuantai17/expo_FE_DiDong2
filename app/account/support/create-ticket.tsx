/**
 * Create Ticket Screen - Tạo yêu cầu hỗ trợ
 * ==========================================
 * Hỗ trợ gửi 1-5 hình ảnh
 */

import { useAuth } from '@/context/AuthContext';
import { createTicket, PRIORITY_COLORS, PRIORITY_LABELS, TicketPriority } from '@/services/supportService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const MAX_IMAGES = 5;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Toast Component
const Toast = ({ visible, message, type = 'success', onHide }: { visible: boolean; message: string; type?: 'success' | 'error'; onHide: () => void }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
                ]).start(() => onHide());
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[
            styles.toast,
            type === 'error' && styles.toastError,
            { opacity: fadeAnim, transform: [{ translateY }] }
        ]}>
            <Ionicons 
                name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                size={24} 
                color="#fff" 
            />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

const CreateTicketScreen = () => {
    const router = useRouter();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const { user } = useAuth();

    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
    const [loading, setLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    
    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

    // Web file input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const priorityOptions: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    const subjectSuggestions = [
        'Câu hỏi về đơn hàng',
        'Vấn đề thanh toán',
        'Đổi/trả sản phẩm',
        'Sản phẩm bị lỗi',
        'Thắc mắc về sản phẩm',
        'Góp ý dịch vụ',
    ];

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ visible: true, message, type });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    // Handle image selection for web (multiple files)
    const handleWebFileChange = (event: any) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = MAX_IMAGES - selectedImages.length;
        const filesToProcess = Math.min(files.length, remainingSlots);

        if (files.length > remainingSlots) {
            showToast(`Chỉ có thể thêm ${remainingSlots} ảnh nữa (tối đa ${MAX_IMAGES} ảnh)`, 'error');
        }

        for (let i = 0; i < filesToProcess; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImages(prev => {
                    if (prev.length >= MAX_IMAGES) return prev;
                    return [...prev, reader.result as string];
                });
            };
            reader.readAsDataURL(file);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Pick images from library (native)
    const pickImagesNative = async () => {
        if (selectedImages.length >= MAX_IMAGES) {
            showToast(`Đã đạt giới hạn ${MAX_IMAGES} ảnh`, 'error');
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Cần cấp quyền truy cập thư viện ảnh', 'error');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES - selectedImages.length,
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            const newImages = result.assets.map(asset => asset.uri);
            setSelectedImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
        }
    };

    // Take photo (native only)
    const takePhotoNative = async () => {
        if (selectedImages.length >= MAX_IMAGES) {
            showToast(`Đã đạt giới hạn ${MAX_IMAGES} ảnh`, 'error');
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showToast('Cần cấp quyền truy cập camera', 'error');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImages(prev => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES));
        }
    };

    const showImageOptions = () => {
        if (selectedImages.length >= MAX_IMAGES) {
            showToast(`Đã đạt giới hạn ${MAX_IMAGES} ảnh`, 'error');
            return;
        }

        if (Platform.OS === 'web') {
            fileInputRef.current?.click();
        } else {
            Alert.alert(
                'Đính kèm hình ảnh',
                `Chọn nguồn ảnh (${selectedImages.length}/${MAX_IMAGES})`,
                [
                    { text: 'Chụp ảnh', onPress: takePhotoNative },
                    { text: 'Chọn từ thư viện', onPress: pickImagesNative },
                    { text: 'Hủy', style: 'cancel' },
                ]
            );
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!subject.trim()) {
            showToast('Vui lòng nhập tiêu đề yêu cầu', 'error');
            return;
        }
        if (!content.trim()) {
            showToast('Vui lòng nhập nội dung chi tiết', 'error');
            return;
        }
        if (content.trim().length < 10) {
            showToast('Nội dung phải có ít nhất 10 ký tự', 'error');
            return;
        }
        if (!user?.id) {
            showToast('Vui lòng đăng nhập để gửi yêu cầu', 'error');
            return;
        }

        setLoading(true);
        try {
            // Pass images array to createTicket - it will handle upload
            await createTicket(
                user.id, 
                {
                    subject: subject.trim(),
                    content: content.trim(),
                    priority,
                    orderId: orderId ? parseInt(orderId) : undefined,
                },
                selectedImages.length > 0 ? selectedImages : undefined
            );

            // Show success toast
            showToast('🎉 Yêu cầu hỗ trợ đã được gửi thành công!', 'success');

            // Navigate after delay
            setTimeout(() => {
                router.replace('/account/support/ticket-list' as any);
            }, 1500);

        } catch (error: any) {
            console.error('Error creating ticket:', error);
            showToast(error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Tạo yêu cầu hỗ trợ',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.headerButton}>Gửi</Text>
                            )}
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Toast Notification */}
            <Toast 
                visible={toast.visible} 
                message={toast.message} 
                type={toast.type}
                onHide={hideToast}
            />

            {/* Hidden file input for web (multiple) */}
            {Platform.OS === 'web' && (
                <input
                    ref={fileInputRef as any}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleWebFileChange}
                    style={{ display: 'none' }}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Order Info */}
                    {orderId && (
                        <View style={styles.orderInfo}>
                            <Ionicons name="receipt-outline" size={20} color="#10b981" />
                            <Text style={styles.orderInfoText}>
                                Liên quan đến đơn hàng #{orderId}
                            </Text>
                        </View>
                    )}

                    {/* Subject */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tiêu đề yêu cầu *</Text>
                        <TextInput
                            style={styles.input}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder="Nhập tiêu đề yêu cầu..."
                            placeholderTextColor="#9ca3af"
                            maxLength={100}
                        />
                        <Text style={styles.charCount}>{subject.length}/100</Text>
                    </View>

                    {/* Subject Suggestions */}
                    <View style={styles.suggestions}>
                        <Text style={styles.suggestionsLabel}>Gợi ý:</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.suggestionsContent}
                        >
                            {subjectSuggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.suggestionChip,
                                        subject === suggestion && styles.suggestionChipActive,
                                    ]}
                                    onPress={() => setSubject(suggestion)}
                                >
                                    <Text
                                        style={[
                                            styles.suggestionText,
                                            subject === suggestion && styles.suggestionTextActive,
                                        ]}
                                    >
                                        {suggestion}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Priority */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Mức độ ưu tiên</Text>
                        <View style={styles.priorityOptions}>
                            {priorityOptions.map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.priorityOption,
                                        priority === p && {
                                            backgroundColor: PRIORITY_COLORS[p] + '20',
                                            borderColor: PRIORITY_COLORS[p],
                                        },
                                    ]}
                                    onPress={() => setPriority(p)}
                                >
                                    <View
                                        style={[
                                            styles.priorityDot,
                                            { backgroundColor: PRIORITY_COLORS[p] },
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.priorityText,
                                            priority === p && { color: PRIORITY_COLORS[p] },
                                        ]}
                                    >
                                        {PRIORITY_LABELS[p]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nội dung chi tiết *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={content}
                            onChangeText={setContent}
                            placeholder="Mô tả chi tiết vấn đề của bạn..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={8}
                            textAlignVertical="top"
                            maxLength={2000}
                        />
                        <Text style={styles.charCount}>{content.length}/2000</Text>
                    </View>

                    {/* Image Attachment - Multiple Images */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Đính kèm hình ảnh</Text>
                            <Text style={styles.imageCount}>({selectedImages.length}/{MAX_IMAGES})</Text>
                        </View>
                        
                        {/* Image Grid */}
                        <View style={styles.imageGrid}>
                            {selectedImages.map((uri, index) => (
                                <View key={index} style={styles.imageItem}>
                                    <Image source={{ uri }} style={styles.imageThumbnail} />
                                    <TouchableOpacity 
                                        style={styles.removeImageBtn} 
                                        onPress={() => removeImage(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            
                            {/* Add Image Button */}
                            {selectedImages.length < MAX_IMAGES && (
                                <TouchableOpacity style={styles.addImageBtn} onPress={showImageOptions}>
                                    <Ionicons name="add" size={32} color="#6b7280" />
                                    <Text style={styles.addImageText}>Thêm ảnh</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <Text style={styles.imageHint}>
                            {Platform.OS === 'web' 
                                ? 'Nhấn để chọn ảnh từ máy tính (tối đa 5 ảnh)'
                                : 'Chụp ảnh hoặc chọn từ thư viện (tối đa 5 ảnh)'
                            }
                        </Text>
                    </View>

                    {/* Tips */}
                    <View style={styles.tips}>
                        <Ionicons name="information-circle" size={20} color="#3b82f6" />
                        <Text style={styles.tipsText}>
                            Mô tả càng chi tiết, chúng tôi càng có thể hỗ trợ bạn nhanh hơn.
                            Đính kèm hình ảnh nếu cần minh họa vấn đề.
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    // Toast styles
    toast: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 16,
        right: 16,
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    toastError: {
        backgroundColor: '#ef4444',
    },
    toastText: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    headerButton: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    orderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    orderInfoText: {
        color: '#166534',
        fontSize: 14,
        fontWeight: '500',
    },
    formGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    imageCount: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1f2937',
    },
    textArea: {
        minHeight: 160,
        paddingTop: 14,
    },
    charCount: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'right',
        marginTop: 4,
    },
    suggestions: {
        marginBottom: 20,
    },
    suggestionsLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
    },
    suggestionsContent: {
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    suggestionChipActive: {
        backgroundColor: '#dcfce7',
        borderColor: '#10b981',
    },
    suggestionText: {
        fontSize: 13,
        color: '#64748b',
    },
    suggestionTextActive: {
        color: '#059669',
        fontWeight: '500',
    },
    priorityOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    priorityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
        gap: 6,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    priorityText: {
        fontSize: 13,
        color: '#6b7280',
    },
    // Image grid styles
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    imageItem: {
        position: 'relative',
        width: (SCREEN_WIDTH - 32 - 24) / 3, // 3 columns with gaps
        height: (SCREEN_WIDTH - 32 - 24) / 3,
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    addImageBtn: {
        width: (SCREEN_WIDTH - 32 - 24) / 3,
        height: (SCREEN_WIDTH - 32 - 24) / 3,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    addImageText: {
        fontSize: 12,
        color: '#6b7280',
    },
    imageHint: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
    },
    tips: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginBottom: 24,
    },
    tipsText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 18,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 24,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreateTicketScreen;
