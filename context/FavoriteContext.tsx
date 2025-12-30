// context/FavoriteContext.tsx
/**
 * FavoriteContext - Quản lý danh sách yêu thích
 * =============================================
 * Lưu trữ sản phẩm yêu thích vào AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

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

const FAVORITES_STORAGE_KEY = "user_favorites";

// =================== CONTEXT =====================

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

// =================== PROVIDER =====================

export function FavoriteProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load favorites từ AsyncStorage khi khởi động
    useEffect(() => {
        loadFavorites();
    }, []);

    // Lưu favorites vào AsyncStorage khi thay đổi
    useEffect(() => {
        if (!isLoading) {
            saveFavorites(favorites);
        }
    }, [favorites, isLoading]);

    // =================== STORAGE FUNCTIONS =====================

    const loadFavorites = async () => {
        try {
            const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
            if (storedFavorites) {
                const parsed = JSON.parse(storedFavorites);
                setFavorites(parsed);
            }
        } catch (error) {
            console.log("Error loading favorites:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveFavorites = async (items: FavoriteItem[]) => {
        try {
            await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.log("Error saving favorites:", error);
        }
    };

    // =================== ACTION FUNCTIONS =====================

    const addToFavorite = (item: FavoriteItem) => {
        setFavorites((prev) => {
            // Kiểm tra nếu đã tồn tại
            const exists = prev.find((p) => p.id === item.id);
            if (exists) return prev;

            // Thêm timestamp
            const newItem: FavoriteItem = {
                ...item,
                addedAt: Date.now(),
            };
            return [...prev, newItem];
        });
    };

    const removeFromFavorite = (id: string) => {
        setFavorites((prev) => prev.filter((item) => item.id !== id));
    };

    const isFavorite = (id: string) => {
        return favorites.some((item) => item.id === id);
    };

    const toggleFavorite = (item: FavoriteItem) => {
        if (isFavorite(item.id)) {
            removeFromFavorite(item.id);
        } else {
            addToFavorite(item);
        }
    };

    const clearAllFavorites = async () => {
        setFavorites([]);
        try {
            await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
        } catch (error) {
            console.log("Error clearing favorites:", error);
        }
    };

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
