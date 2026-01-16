// context/FavoriteContext.tsx
/**
 * FavoriteContext - Quản lý danh sách yêu thích
 * =============================================
 * Lưu trữ sản phẩm yêu thích vào AsyncStorage THEO TỪNG USER
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

// =================== TYPES =====================

export type FavoriteItem = {
    id: string;
    tag: string;
    name: string;
    price: string;
    image: any;
    addedAt?: number; // Timestamp khi thêm vào
};

type FavoriteContextType = {
    favorites: FavoriteItem[];
    favoritesCount: number;
    addToFavorite: (item: FavoriteItem) => void;
    removeFromFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
    toggleFavorite: (item: FavoriteItem) => void;
    clearAllFavorites: () => void;
    isLoading: boolean;
};

// =================== STORAGE KEY =====================

// Tạo storage key RIÊNG CHO TỪNG USER
const getFavoritesStorageKey = (userId: number | string | undefined): string => {
    if (userId) {
        return `user_favorites_${userId}`;
    }
    // Fallback cho user chưa đăng nhập (guest)
    return "user_favorites_guest";
};

// Key cũ không phân biệt user - cần clear khi migration
const OLD_FAVORITES_KEY = "user_favorites";

// =================== CONTEXT =====================

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

// =================== PROVIDER =====================

export function FavoriteProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Sử dụng ref để track user ID và tránh race conditions
    const currentUserIdRef = useRef<number | string | undefined>(undefined);
    const isInitializedRef = useRef(false);

    // Lấy storage key dựa trên user hiện tại
    const getStorageKey = useCallback(() => {
        return getFavoritesStorageKey(user?.id);
    }, [user?.id]);

    // =================== STORAGE FUNCTIONS =====================

    const loadFavorites = useCallback(async (userId: number | string | undefined) => {
        const storageKey = getFavoritesStorageKey(userId);
        setIsLoading(true);
        
        try {
            console.log("📚 Loading favorites for key:", storageKey);
            
            const storedFavorites = await AsyncStorage.getItem(storageKey);
            if (storedFavorites) {
                const parsed = JSON.parse(storedFavorites);
                setFavorites(parsed);
                console.log("❤️ Loaded", parsed.length, "favorites for user:", userId || "guest");
            } else {
                // Không có favorites cho user này
                setFavorites([]);
                console.log("❤️ No favorites found for user:", userId || "guest");
            }
        } catch (error) {
            console.log("Error loading favorites:", error);
            setFavorites([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveFavorites = useCallback(async (items: FavoriteItem[], userId: number | string | undefined) => {
        const storageKey = getFavoritesStorageKey(userId);
        
        try {
            await AsyncStorage.setItem(storageKey, JSON.stringify(items));
            console.log("💾 Saved", items.length, "favorites for user:", userId || "guest");
        } catch (error) {
            console.log("Error saving favorites:", error);
        }
    }, []);

    // =================== USER CHANGE DETECTION =====================

    // Theo dõi khi user thay đổi
    useEffect(() => {
        const newUserId = user?.id;
        const previousUserId = currentUserIdRef.current;
        
        // User đã thay đổi
        if (newUserId !== previousUserId) {
            console.log("👤 User changed:", previousUserId, "→", newUserId);
            
            // Cập nhật ref ngay lập tức
            currentUserIdRef.current = newUserId;
            
            // Load favorites cho user mới
            loadFavorites(newUserId);
            
            isInitializedRef.current = true;
        }
    }, [user?.id, loadFavorites]);

    // Load lần đầu khi khởi động + Clear dữ liệu cũ
    useEffect(() => {
        const initializeFavorites = async () => {
            if (!isInitializedRef.current) {
                console.log("🚀 Initial favorites load for user:", user?.id || "guest");
                
                // Clear dữ liệu cũ không phân biệt user (migration)
                try {
                    const oldData = await AsyncStorage.getItem(OLD_FAVORITES_KEY);
                    if (oldData) {
                        console.log("🗑️ Clearing old shared favorites data");
                        await AsyncStorage.removeItem(OLD_FAVORITES_KEY);
                    }
                } catch (error) {
                    console.log("Error clearing old favorites:", error);
                }
                
                currentUserIdRef.current = user?.id;
                await loadFavorites(user?.id);
                isInitializedRef.current = true;
            }
        };
        
        initializeFavorites();
    }, [user?.id, loadFavorites]);

    // =================== ACTION FUNCTIONS =====================

    const addToFavorite = useCallback((item: FavoriteItem) => {
        const currentUserId = currentUserIdRef.current;
        
        setFavorites((prev) => {
            // Kiểm tra nếu đã tồn tại
            const exists = prev.find((p) => p.id === item.id);
            if (exists) return prev;

            // Thêm timestamp
            const newItem: FavoriteItem = {
                ...item,
                addedAt: Date.now(),
            };
            
            const newFavorites = [...prev, newItem];
            console.log("➕ Added to favorites:", item.name, "for user:", currentUserId || "guest");
            
            // Save ngay lập tức
            saveFavorites(newFavorites, currentUserId);
            
            return newFavorites;
        });
    }, [saveFavorites]);

    const removeFromFavorite = useCallback((id: string) => {
        const currentUserId = currentUserIdRef.current;
        
        setFavorites((prev) => {
            const item = prev.find((i) => i.id === id);
            if (item) {
                console.log("➖ Removed from favorites:", item.name, "for user:", currentUserId || "guest");
            }
            
            const newFavorites = prev.filter((item) => item.id !== id);
            
            // Save ngay lập tức
            saveFavorites(newFavorites, currentUserId);
            
            return newFavorites;
        });
    }, [saveFavorites]);

    const isFavorite = useCallback((id: string) => {
        return favorites.some((item) => item.id === id);
    }, [favorites]);

    const toggleFavorite = useCallback((item: FavoriteItem) => {
        if (isFavorite(item.id)) {
            removeFromFavorite(item.id);
        } else {
            addToFavorite(item);
        }
    }, [isFavorite, removeFromFavorite, addToFavorite]);

    const clearAllFavorites = useCallback(async () => {
        const currentUserId = currentUserIdRef.current;
        const storageKey = getFavoritesStorageKey(currentUserId);
        
        setFavorites([]);
        try {
            await AsyncStorage.removeItem(storageKey);
            console.log("🗑️ Cleared all favorites for user:", currentUserId || "guest");
        } catch (error) {
            console.log("Error clearing favorites:", error);
        }
    }, []);

    // =================== CONTEXT VALUE =====================

    const value: FavoriteContextType = {
        favorites,
        favoritesCount: favorites.length,
        addToFavorite,
        removeFromFavorite,
        isFavorite,
        toggleFavorite,
        clearAllFavorites,
        isLoading,
    };

    return (
        <FavoriteContext.Provider value={value}>
            {children}
        </FavoriteContext.Provider>
    );
}

// =================== HOOK =====================

export function useFavorite() {
    const ctx = useContext(FavoriteContext);
    if (!ctx) throw new Error("useFavorite must be used inside FavoriteProvider");
    return ctx;
}
