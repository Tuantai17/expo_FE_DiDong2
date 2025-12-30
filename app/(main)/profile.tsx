/**
 * Profile Screen
 * ===============
 * User profile with real data from AuthContext
 * Shows user info, menu options, and logout
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Platform,
    ScaledSize,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFavorite } from '../../context/FavoriteContext';
import { showConfirmAlert } from '../../utils/alert';

interface MenuItem {
    id: number;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
}

export default function ProfileScreen(): React.JSX.Element {
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuth();
    const { favoritesCount } = useFavorite();

    const [dimensions, setDimensions] = useState<ScaledSize>(
        Dimensions.get('window')
    );

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({
            window,
        }: {
            window: ScaledSize;
        }) => {
            setDimensions(window);
        });

        return () => subscription?.remove();
    }, []);

    const { width, height } = dimensions;

    // Get user display info - Ưu tiên: name (từ backend) -> fullName -> username -> 'Khách'
    const userName = user?.name || user?.fullName || user?.username || 'Khách';
    const userEmail = user?.email || 'Chưa đăng nhập';
    const userPhone = user?.phoneNumber || '';
    const userAddress = user?.address || '';

    const menuItems: MenuItem[] = [
        {
            id: 1,
            icon: 'person-outline',
            title: 'Chỉnh sửa hồ sơ',
            subtitle: 'Cập nhật thông tin cá nhân',
            onPress: () => router.push('/account/edit-profile'),
        },
        {
            id: 2,
            icon: 'bag-outline',
            title: 'Đơn hàng của tôi',
            subtitle: 'Xem lịch sử đơn hàng',
            onPress: () => router.push('/account/my-orders'),
        },
        {
            id: 3,
            icon: 'location-outline',
            title: 'Địa chỉ giao hàng',
            subtitle: 'Quản lý địa chỉ nhận hàng',
            onPress: () => router.push('/account/address'),
        },
        {
            id: 4,
            icon: 'card-outline',
            title: 'Phương thức thanh toán',
            subtitle: 'Quản lý các cách thanh toán',
            onPress: () => console.log('Payment Methods'),
        },
        {
            id: 5,
            icon: 'heart-outline',
            title: 'Yêu thích',
            subtitle: 'Các sản phẩm yêu thích của bạn',
            onPress: () => router.push('/(main)/favorite'),
        },
        {
            id: 6,
            icon: 'notifications-outline',
            title: 'Thông báo',
            subtitle: 'Cài đặt thông báo',
            onPress: () => console.log('Notifications'),
        },
        {
            id: 7,
            icon: 'settings-outline',
            title: 'Cài đặt',
            subtitle: 'Tùy chỉnh ứng dụng',
            onPress: () => router.push('/account/settings'),
        },
        {
            id: 8,
            icon: 'help-circle-outline',
            title: 'Trợ giúp & Hỗ trợ',
            subtitle: 'Nhận hỗ trợ với tài khoản của bạn',
            onPress: () => console.log('Help'),
        },
    ];

    const handleLogout = (): void => {
        showConfirmAlert(
            "Đăng xuất",
            "Bạn có chắc muốn đăng xuất khỏi tài khoản?",
            async () => {
                await logout();
                router.replace('/(auth)/login');
            }
        );
    };

    const handleEditProfile = (): void => {
        router.push('/account/edit-profile');
    };

    const handleLogin = (): void => {
        router.push('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : 40 }]}>
                    <Text style={[styles.headerTitle, { fontSize: width * 0.065 }]}>
                        Hồ sơ
                    </Text>
                </View>

                {/* User Info Card */}
                <View style={[styles.userCard, { marginHorizontal: width * 0.05 }]}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={require('../../assets/images/home/user.png')}
                            style={[
                                styles.avatar,
                                { width: width * 0.22, height: width * 0.22 },
                            ]}
                        />
                        {isAuthenticated && (
                            <TouchableOpacity style={styles.editAvatarBtn}>
                                <Ionicons name="camera" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { fontSize: width * 0.055 }]}>
                            {userName}
                        </Text>
                        <Text style={[styles.userEmail, { fontSize: width * 0.035 }]}>
                            {userEmail}
                        </Text>
                        {userPhone ? (
                            <Text style={[styles.userPhone, { fontSize: width * 0.035 }]}>
                                {userPhone}
                            </Text>
                        ) : null}
                        {user?.id && (
                            <View style={styles.userIdBadge}>
                                <Text style={styles.userIdText}>ID: {user.id}</Text>
                            </View>
                        )}
                    </View>

                    {isAuthenticated ? (
                        <TouchableOpacity
                            style={styles.editProfileBtn}
                            onPress={handleEditProfile}
                        >
                            <Ionicons name="create-outline" size={20} color="#5B9EE1" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.loginBtn}
                            onPress={handleLogin}
                        >
                            <Text style={styles.loginBtnText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* User Stats (if logged in) */}
                {isAuthenticated && user?.id && (
                    <View style={[styles.statsCard, { marginHorizontal: width * 0.05 }]}>
                        <TouchableOpacity
                            style={styles.statItem}
                            onPress={() => router.push('/account/my-orders')}
                        >
                            <Ionicons name="bag-check-outline" size={22} color="#10B981" />
                            <Text style={styles.statLabel}>Đơn hàng</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <TouchableOpacity
                            style={styles.statItem}
                            onPress={() => router.push('/(main)/favorite')}
                        >
                            <View style={styles.statBadge}>
                                <Ionicons name="heart" size={22} color="#EF4444" />
                                {favoritesCount > 0 && (
                                    <View style={styles.statCountBadge}>
                                        <Text style={styles.statCountText}>{favoritesCount}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.statLabel}>Yêu thích</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <TouchableOpacity style={styles.statItem}>
                            <Ionicons name="star-outline" size={22} color="#F59E0B" />
                            <Text style={styles.statLabel}>Đánh giá</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Menu Items */}
                <View
                    style={[
                        styles.menuContainer,
                        { marginTop: height * 0.02, marginHorizontal: width * 0.05 },
                    ]}
                >
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, { paddingVertical: height * 0.018 }]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon} size={22} color="#5B9EE1" />
                            </View>

                            <View style={styles.menuTextContainer}>
                                <Text style={[styles.menuTitle, { fontSize: width * 0.038 }]}>
                                    {item.title}
                                </Text>
                                <Text
                                    style={[styles.menuSubtitle, { fontSize: width * 0.03 }]}
                                >
                                    {item.subtitle}
                                </Text>
                            </View>

                            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                {isAuthenticated && (
                    <TouchableOpacity
                        style={[
                            styles.logoutBtn,
                            {
                                marginHorizontal: width * 0.05,
                                marginTop: height * 0.025,
                                paddingVertical: height * 0.018,
                            },
                        ]}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                        <Text style={[styles.logoutText, { fontSize: width * 0.04 }]}>
                            Đăng xuất
                        </Text>
                    </TouchableOpacity>
                )}

                {/* App Version */}
                <Text
                    style={[
                        styles.versionText,
                        { fontSize: width * 0.03, marginTop: height * 0.02 },
                    ]}
                >
                    Phiên bản 1.0.0
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontWeight: '700',
        color: '#0F172A',
    },
    userCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#5B9EE1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        borderRadius: 50,
        backgroundColor: '#E8ECEF',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#5B9EE1',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    userInfo: {
        flex: 1,
        marginLeft: 14,
    },
    userName: {
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    userEmail: {
        color: '#64748B',
        marginBottom: 2,
    },
    userPhone: {
        color: '#64748B',
    },
    userIdBadge: {
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    userIdText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#5B9EE1',
    },
    editProfileBtn: {
        padding: 8,
    },
    loginBtn: {
        backgroundColor: '#5B9EE1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },
    statsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        marginTop: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E2E8F0',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    statBadge: {
        position: 'relative',
    },
    statCountBadge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: '#EF4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    statCountText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#EBF4FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    menuTitle: {
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 2,
    },
    menuSubtitle: {
        color: '#94A3B8',
    },
    logoutBtn: {
        backgroundColor: '#EF4444',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    logoutText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: '#94A3B8',
        marginBottom: 20,
    },
});
