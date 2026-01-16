/**
 * Support Home Screen - Trang chủ Trợ giúp & Hỗ trợ
 * ==================================================
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SupportHomeScreen = () => {
    const router = useRouter();

    const menuItems = [
        {
            id: 'create',
            title: 'Tạo yêu cầu hỗ trợ',
            description: 'Gửi câu hỏi hoặc báo cáo vấn đề',
            icon: 'create-outline',
            color: '#10b981',
            route: '/account/support/create-ticket',
        },
        {
            id: 'history',
            title: 'Lịch sử yêu cầu',
            description: 'Xem các yêu cầu đã gửi',
            icon: 'list-outline',
            color: '#3b82f6',
            route: '/account/support/ticket-list',
        },
        {
            id: 'notifications',
            title: 'Thông báo hỗ trợ',
            description: 'Xem phản hồi từ bộ phận hỗ trợ',
            icon: 'notifications-outline',
            color: '#f59e0b',
            route: '/account/support/notifications',
        },
    ];

    const faqItems = [
        {
            question: 'Làm sao để đổi trả sản phẩm?',
            answer: 'Bạn có thể đổi trả trong vòng 7 ngày kể từ ngày nhận hàng',
        },
        {
            question: 'Thời gian giao hàng là bao lâu?',
            answer: 'Thông thường từ 3-5 ngày làm việc tùy khu vực',
        },
        {
            question: 'Làm sao để theo dõi đơn hàng?',
            answer: 'Vào mục "Đơn hàng của tôi" để xem chi tiết trạng thái',
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Trợ giúp & Hỗ trợ',
                    headerStyle: { backgroundColor: '#10b981' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '600' },
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Banner */}
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.headerBanner}
                >
                    <Ionicons name="headset" size={48} color="#fff" />
                    <Text style={styles.headerTitle}>Chúng tôi luôn sẵn sàng hỗ trợ bạn</Text>
                    <Text style={styles.headerSubtitle}>
                        Đội ngũ hỗ trợ sẽ phản hồi trong vòng 24h
                    </Text>
                </LinearGradient>

                {/* Menu Options */}
                <View style={styles.menuSection}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={28}
                                    color={item.color}
                                />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuDescription}>{item.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAQ Section */}
                <View style={styles.faqSection}>
                    <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
                    {faqItems.map((item, index) => (
                        <View key={index} style={styles.faqItem}>
                            <View style={styles.faqQuestion}>
                                <Ionicons name="help-circle" size={20} color="#10b981" />
                                <Text style={styles.faqQuestionText}>{item.question}</Text>
                            </View>
                            <Text style={styles.faqAnswer}>{item.answer}</Text>
                        </View>
                    ))}
                </View>

                {/* Contact Info */}
                <View style={styles.contactSection}>
                    <Text style={styles.sectionTitle}>Liên hệ khác</Text>
                    <View style={styles.contactItem}>
                        <Ionicons name="call-outline" size={20} color="#6b7280" />
                        <Text style={styles.contactText}>Hotline: 1900 1234</Text>
                    </View>
                    <View style={styles.contactItem}>
                        <Ionicons name="mail-outline" size={20} color="#6b7280" />
                        <Text style={styles.contactText}>Email: support@shoeshop.vn</Text>
                    </View>
                    <View style={styles.contactItem}>
                        <Ionicons name="time-outline" size={20} color="#6b7280" />
                        <Text style={styles.contactText}>Giờ làm việc: 8:00 - 22:00</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerBanner: {
        padding: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginTop: 12,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        textAlign: 'center',
    },
    menuSection: {
        padding: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuContent: {
        flex: 1,
        marginLeft: 12,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    menuDescription: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    faqSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    faqItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    faqQuestionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    faqAnswer: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 8,
        marginLeft: 28,
    },
    contactSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    contactText: {
        fontSize: 14,
        color: '#4b5563',
    },
});

export default SupportHomeScreen;
