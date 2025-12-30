/**
 * AuthContext - Global Authentication State Management
 * =====================================================
 * Manages login state, token, and user info across the app
 */

import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    STORAGE_KEYS,
    User,
    clearAuthData,
    getMeApi,
    getStoredUser,
    getToken,
    loginApi,
    registerApi,
    saveAuthData,
    storage,
} from "../services/api";

// =================== TYPES =====================

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<AuthResponse>;
    register: (data: RegisterRequest) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

// =================== CONTEXT =====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =================== PROVIDER =====================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // =================== INITIALIZATION =====================

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const storedToken = await getToken();
            const storedUser = await getStoredUser();

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(storedUser);

                // Optionally refresh user data from server
                try {
                    const freshUser = await getMeApi();
                    setUser(freshUser);
                } catch (error) {
                    // Token might be expired, clear auth data
                    console.log("Token expired, clearing auth data");
                    await clearAuthData();
                    setToken(null);
                    setUser(null);
                }
            }
        } catch (error) {
            console.log("Error initializing auth:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // =================== AUTH METHODS =====================

    const login = async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await loginApi(data);

        // Save to storage
        await saveAuthData(response);

        // Update state
        setToken(response.token);
        setUser(response.user);

        return response;
    };

    const register = async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await registerApi(data);

        // Save to storage
        await saveAuthData(response);

        // Update state
        setToken(response.token);
        setUser(response.user);

        return response;
    };

    const logout = async (): Promise<void> => {
        await clearAuthData();
        setToken(null);
        setUser(null);
    };

    const refreshUser = async (): Promise<void> => {
        try {
            const freshUser = await getMeApi();
            setUser(freshUser);
            // Cập nhật user trong storage để đồng bộ
            await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser));
        } catch (error) {
            console.log("Error refreshing user:", error);
        }
    };

    // =================== CONTEXT VALUE =====================

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =================== HOOK =====================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
