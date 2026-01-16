/**
 * Ticket Detail Screen - Chi tiết yêu cầu hỗ trợ
 * Hỗ trợ gửi 1-5 hình ảnh trong tin nhắn
 */

import { useAuth } from '@/context/AuthContext';
import {
    getAttachmentUrl,
    getTicketDetail,
    PRIORITY_COLORS, PRIORITY_LABELS,
    sendMessage,
    STATUS_COLORS, STATUS_LABELS,
    SupportMessage,
    TicketDetail,
} from '@/services/supportService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated, Dimensions,
    Image,
    KeyboardAvoidingView, Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput, TouchableOpacity,
    View
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
            <Ionicons name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={24} color="#fff" />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

const TicketDetailScreen = () => {
    const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ visible: true, message, type });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    const fetchTicketDetail = async () => {
        if (!ticketId || !user?.id) return;
        try {
            const data = await getTicketDetail(parseInt(ticketId), user.id);
            setTicket(data);
        } catch (error: any) {
            showToast(error.message || 'Không thể tải thông tin yêu cầu', 'error');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTicketDetail(); }, [ticketId, user?.id]);

    useEffect(() => {
        if (ticket?.messages?.length) {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [ticket?.messages?.length]);

    // Handle image selection for web (multiple files)
    const handleWebFileChange = (event: any) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = MAX_IMAGES - selectedImages.length;
        const filesToProcess = Math.min(files.length, remainingSlots);

        if (files.length > remainingSlots) {
            showToast(`Chỉ có thể thêm ${remainingSlots} ảnh nữa`, 'error');
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

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const pickImages = async () => {
        if (selectedImages.length >= MAX_IMAGES) {
            showToast(`Đã đạt giới hạn ${MAX_IMAGES} ảnh`, 'error');
            return;
        }

        if (Platform.OS === 'web') {
            fileInputRef.current?.click();
        } else {
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
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !ticketId || !user?.id) return;
        if (ticket?.status === 'CLOSED') {
            showToast('Không thể gửi tin nhắn vào yêu cầu đã đóng', 'error');
            return;
        }
        setSending(true);
        try {
            // Pass images array to sendMessage - it will handle upload
            await sendMessage(
                parseInt(ticketId), 
                user.id, 
                { content: newMessage.trim() },
                selectedImages.length > 0 ? selectedImages : undefined
            );
            setNewMessage('');
            setSelectedImages([]);
            showToast('Đã gửi tin nhắn', 'success');
            await fetchTicketDetail();
        } catch (error: any) {
            showToast(error.message || 'Không thể gửi tin nhắn', 'error');
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return `Hôm nay, ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = (message: SupportMessage) => {
        const isUser = message.sender_role === 'USER';
        
        // Parse multiple attachment URLs (comma-separated)
        const attachmentUrls: string[] = [];
        if (message.attachment_url) {
            const urls = message.attachment_url.split(',').map(url => url.trim()).filter(Boolean);
            urls.forEach(url => {
                const fullUrl = getAttachmentUrl(url);
                if (fullUrl) attachmentUrls.push(fullUrl);
            });
        }

        return (
            <View key={message.id} style={[styles.msgRow, isUser && styles.msgRowRight]}>
                {!isUser && (
                    <View style={styles.avatar}>
                        <Ionicons name="headset" size={16} color="#fff" />
                    </View>
                )}
                <View style={{ flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.adminBubble]}>
                        {/* Display multiple images */}
                        {attachmentUrls.length > 0 && (
                            <View style={styles.msgImagesContainer}>
                                {attachmentUrls.map((url, index) => (
                                    <Image 
                                        key={index} 
                                        source={{ uri: url }} 
                                        style={[
                                            styles.msgImage,
                                            attachmentUrls.length > 1 && { width: 140, height: 100 }
                                        ]} 
                                        resizeMode="cover" 
                                    />
                                ))}
                            </View>
                        )}
                        <Text style={[styles.msgText, isUser && { color: '#fff' }]}>{message.content}</Text>
                    </View>
                    <Text style={styles.msgTime}>{formatDate(message.created_at)}</Text>
                </View>
                {isUser && (
                    <View style={[styles.avatar, { backgroundColor: '#3b82f6' }]}>
                        <Ionicons name="person" size={16} color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10b981" /></View>;
    if (!ticket) return <View style={styles.center}><Text>Không tìm thấy yêu cầu</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: ticket.ticket_code }} />
            
            {/* Toast Notification */}
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
            
            {/* Hidden file input for web */}
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

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
                {/* Header Info */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text style={styles.subject} numberOfLines={2}>{ticket.subject}</Text>
                        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[ticket.status] + '20' }]}>
                            <Text style={[styles.badgeText, { color: STATUS_COLORS[ticket.status] }]}>{STATUS_LABELS[ticket.status]}</Text>
                        </View>
                    </View>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="flag" size={14} color={PRIORITY_COLORS[ticket.priority]} />
                            <Text style={[styles.metaText, { color: PRIORITY_COLORS[ticket.priority] }]}>{PRIORITY_LABELS[ticket.priority]}</Text>
                        </View>
                        {ticket.assigned_admin_name && (
                            <View style={styles.metaItem}>
                                <Ionicons name="person" size={14} color="#6b7280" />
                                <Text style={styles.metaText}>Phụ trách: {ticket.assigned_admin_name}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Messages */}
                <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={styles.messages}>
                    {ticket.messages.length === 0 ? (
                        <View style={styles.emptyMessages}>
                            <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
                        </View>
                    ) : (
                        ticket.messages.map(msg => renderMessage(msg))
                    )}
                </ScrollView>

                {/* Input Area */}
                {ticket.status !== 'CLOSED' ? (
                    <View style={styles.inputContainer}>
                        {/* Image Previews */}
                        {selectedImages.length > 0 && (
                            <View style={styles.imagePreviewRow}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                    {selectedImages.map((uri, index) => (
                                        <View key={index} style={styles.previewItem}>
                                            <Image source={{ uri }} style={styles.previewThumb} />
                                            <TouchableOpacity style={styles.removePreviewBtn} onPress={() => removeImage(index)}>
                                                <Ionicons name="close-circle" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                                <Text style={styles.imageCountText}>{selectedImages.length}/{MAX_IMAGES}</Text>
                            </View>
                        )}
                        <View style={styles.inputRow}>
                            <TouchableOpacity style={styles.attachBtn} onPress={pickImages}>
                                <Ionicons name="image-outline" size={24} color={selectedImages.length >= MAX_IMAGES ? '#d1d5db' : '#6b7280'} />
                            </TouchableOpacity>
                            <TextInput 
                                style={styles.input} 
                                value={newMessage} 
                                onChangeText={setNewMessage} 
                                placeholder="Nhập tin nhắn..." 
                                placeholderTextColor="#9ca3af"
                                multiline 
                            />
                            <TouchableOpacity 
                                style={[styles.sendBtn, !newMessage.trim() && { opacity: 0.5 }]} 
                                onPress={handleSendMessage} 
                                disabled={!newMessage.trim() || sending}
                            >
                                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.closedBar}>
                        <Ionicons name="lock-closed" size={18} color="#6b7280" />
                        <Text style={{ color: '#6b7280', marginLeft: 8 }}>Yêu cầu đã đóng</Text>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    // Toast
    toast: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 16, right: 16,
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
    toastError: { backgroundColor: '#ef4444' },
    toastText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },
    // Header
    header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
    subject: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1f2937' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    metaRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#6b7280' },
    // Messages
    messages: { padding: 16, paddingBottom: 8 },
    emptyMessages: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { color: '#9ca3af', marginTop: 12 },
    msgRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
    msgRowRight: { flexDirection: 'row-reverse' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
    msgBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
    userBubble: { backgroundColor: '#10b981', borderBottomRightRadius: 4 },
    adminBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderBottomLeftRadius: 4 },
    msgText: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
    msgImagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    msgImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8 },
    msgTime: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
    // Input
    inputContainer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12 },
    imagePreviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    previewItem: { position: 'relative' },
    previewThumb: { width: 56, height: 56, borderRadius: 8 },
    removePreviewBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 10 },
    imageCountText: { fontSize: 12, color: '#6b7280' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    attachBtn: { padding: 8 },
    input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 14 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
    closedBar: { flexDirection: 'row', padding: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
});

export default TicketDetailScreen;
