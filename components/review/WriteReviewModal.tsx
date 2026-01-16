/**
 * WriteReviewModal - Modal viết đánh giá sản phẩm
 * Hỗ trợ chọn và upload tối đa 5 ảnh
 * Fixed: Deprecation warnings & web upload handling
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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
} from 'react-native';
import { api, storage, STORAGE_KEYS } from '../../services/api';
import { CreateReviewRequest, reviewService } from '../../services/reviewService';
import StarRating from './StarRating';

interface WriteReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    productId: number;
    orderId: number;
    orderItemId: number;
    productName?: string;
    productImage?: string;
}

interface ImageItem {
    uri: string;
    uploading: boolean;
    uploaded: boolean;
    fileName?: string;
}

export function WriteReviewModal({
    visible,
    onClose,
    onSuccess,
    productId,
    orderId,
    orderItemId,
    productName,
    productImage,
}: WriteReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [images, setImages] = useState<ImageItem[]>([]);

    const MAX_IMAGES = 5;

    const resetForm = () => {
        setRating(5);
        setComment('');
        setImages([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Pick images from gallery
    const pickImages = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert('Giới hạn', `Chỉ có thể đăng tối đa ${MAX_IMAGES} ảnh`);
            return;
        }

        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (!permissionResult.granted) {
                Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập thư viện ảnh');
                return;
            }

            // Use new MediaType API instead of deprecated MediaTypeOptions
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: MAX_IMAGES - images.length,
            });

            if (!result.canceled && result.assets) {
                const newImages: ImageItem[] = result.assets.map(asset => ({
                    uri: asset.uri,
                    uploading: false,
                    uploaded: false,
                }));
                setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
            }
        } catch (error) {
            console.error('Error picking images:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    // Take photo from camera
    const takePhoto = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert('Giới hạn', `Chỉ có thể đăng tối đa ${MAX_IMAGES} ảnh`);
            return;
        }

        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            
            if (!permissionResult.granted) {
                Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập camera');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const newImage: ImageItem = {
                    uri: result.assets[0].uri,
                    uploading: false,
                    uploaded: false,
                };
                setImages(prev => [...prev, newImage].slice(0, MAX_IMAGES));
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Lỗi', 'Không thể chụp ảnh');
        }
    };

    // Remove image
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // Upload a single image - handling both web and native
    const uploadImage = async (image: ImageItem, index: number): Promise<string | null> => {
        try {
            // Update uploading state
            setImages(prev => prev.map((img, i) => 
                i === index ? { ...img, uploading: true } : img
            ));

            const formData = new FormData();
            
            if (Platform.OS === 'web') {
                // For web: fetch blob and append
                const response = await fetch(image.uri);
                const blob = await response.blob();
                const filename = `image_${Date.now()}.jpg`;
                formData.append('file', blob, filename);
            } else {
                // For native (iOS/Android)
                const filename = image.uri.split('/').pop() || 'image.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('file', {
                    uri: image.uri,
                    name: filename,
                    type,
                } as any);
            }

            const uploadResponse = await api.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadedFileName = typeof uploadResponse.data === 'string' 
                ? uploadResponse.data 
                : uploadResponse.data.fileName || uploadResponse.data;

            // Update state with uploaded filename
            setImages(prev => prev.map((img, i) => 
                i === index ? { ...img, uploading: false, uploaded: true, fileName: uploadedFileName } : img
            ));

            return uploadedFileName;
        } catch (error) {
            console.error('Error uploading image:', error);
            setImages(prev => prev.map((img, i) => 
                i === index ? { ...img, uploading: false } : img
            ));
            return null;
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn số sao');
            return;
        }

        setSubmitting(true);

        try {
            // Check authentication first
            const token = await storage.getItem(STORAGE_KEYS.TOKEN);
            console.log('🔑 Token check:', token ? 'Token exists' : 'No token!');
            
            if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để đánh giá sản phẩm');
                setSubmitting(false);
                return;
            }

            // Upload all images first
            const uploadedImageNames: string[] = [];
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                if (!img.uploaded) {
                    const fileName = await uploadImage(img, i);
                    if (fileName) {
                        uploadedImageNames.push(fileName);
                    }
                } else if (img.fileName) {
                    uploadedImageNames.push(img.fileName);
                }
            }

            const request: CreateReviewRequest = {
                productId,
                orderId,
                orderItemId,
                rating,
                comment: comment.trim() || undefined,
                images: uploadedImageNames.length > 0 ? uploadedImageNames : undefined,
            };

            console.log('📤 Submitting review:', request);
            const result = await reviewService.createReview(request);
            console.log('📦 Review result:', result);

            if (result.success) {
                Alert.alert(
                    'Thành công',
                    'Đánh giá của bạn đã được gửi!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                resetForm();
                                onClose();
                                if (onSuccess) onSuccess();
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Lỗi', result.message || 'Không thể gửi đánh giá');
            }
        } catch (err: any) {
            console.error('Error submitting review:', err);
            const message = err.response?.data?.message || err.message || 'Đã có lỗi xảy ra';
            Alert.alert('Lỗi', message);
        } finally {
            setSubmitting(false);
        }
    };

    const ratingLabels: { [key: number]: string } = {
        1: 'Rất tệ',
        2: 'Tệ',
        3: 'Bình thường',
        4: 'Tốt',
        5: 'Tuyệt vời',
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Viết đánh giá</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#0F172A" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Product Info */}
                        <View style={styles.productInfo}>
                            {productImage && (
                                <Image
                                    source={{ uri: productImage }}
                                    style={styles.productImage}
                                />
                            )}
                            <Text style={styles.productName} numberOfLines={2}>
                                {productName || 'Sản phẩm'}
                            </Text>
                        </View>

                        {/* Rating Section */}
                        <View style={styles.ratingSection}>
                            <Text style={styles.ratingLabel}>Chất lượng sản phẩm</Text>
                            <View style={styles.starsContainer}>
                                <StarRating
                                    rating={rating}
                                    size={40}
                                    editable
                                    onRatingChange={setRating}
                                />
                            </View>
                            <Text style={styles.ratingText}>
                                {ratingLabels[rating] || 'Chọn số sao'}
                            </Text>
                        </View>

                        {/* Comment Section */}
                        <View style={styles.commentSection}>
                            <Text style={styles.commentLabel}>
                                Nhận xét của bạn (tùy chọn)
                            </Text>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                value={comment}
                                onChangeText={setComment}
                                maxLength={2000}
                            />
                            <Text style={styles.characterCount}>
                                {comment.length}/2000
                            </Text>
                        </View>

                        {/* Image Section */}
                        <View style={styles.imageSection}>
                            <Text style={styles.imageLabel}>
                                Thêm hình ảnh ({images.length}/{MAX_IMAGES})
                            </Text>
                            
                            <View style={styles.imageGrid}>
                                {/* Preview uploaded images */}
                                {images.map((img, index) => (
                                    <View key={index} style={styles.imagePreviewContainer}>
                                        <Image
                                            source={{ uri: img.uri }}
                                            style={styles.imagePreview}
                                        />
                                        {img.uploading && (
                                            <View style={styles.imageUploadingOverlay}>
                                                <ActivityIndicator color="#FFFFFF" />
                                            </View>
                                        )}
                                        {img.uploaded && (
                                            <View style={styles.imageUploadedBadge}>
                                                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={styles.imageRemoveButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <Ionicons name="close" size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                
                                {/* Add image buttons */}
                                {images.length < MAX_IMAGES && (
                                    <View style={styles.addImageButtons}>
                                        <TouchableOpacity
                                            style={styles.addImageButton}
                                            onPress={pickImages}
                                        >
                                            <Ionicons name="images-outline" size={24} color="#5B9EE1" />
                                            <Text style={styles.addImageText}>Thư viện</Text>
                                        </TouchableOpacity>
                                        {Platform.OS !== 'web' && (
                                            <TouchableOpacity
                                                style={styles.addImageButton}
                                                onPress={takePhoto}
                                            >
                                                <Ionicons name="camera-outline" size={24} color="#5B9EE1" />
                                                <Text style={styles.addImageText}>Chụp ảnh</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Submit Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                submitting && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        padding: 16,
    },
    productInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    productName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#0F172A',
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 16,
    },
    starsContainer: {
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 14,
        color: '#FBBF24',
        fontWeight: '600',
    },
    commentSection: {
        marginBottom: 20,
    },
    commentLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 8,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#0F172A',
        minHeight: 100,
        backgroundColor: '#FFFFFF',
    },
    characterCount: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'right',
        marginTop: 4,
    },
    imageSection: {
        marginBottom: 20,
    },
    imageLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 12,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    imagePreviewContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    imageUploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageUploadedBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#16A34A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageRemoveButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImageButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    addImageButton: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    addImageText: {
        fontSize: 10,
        color: '#5B9EE1',
        marginTop: 4,
        fontWeight: '500',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    submitButton: {
        backgroundColor: '#5B9EE1',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default WriteReviewModal;
