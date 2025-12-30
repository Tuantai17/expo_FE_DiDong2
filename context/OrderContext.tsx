/**
 * Order Context - Quản lý đơn hàng
 * ==================================
 * Đồng bộ đơn hàng với backend API
 * Lưu local + gọi API để sync với server
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { MobileCheckoutRequest, Order, orderService, OrderStatus } from "../services/orderService";
import { useAuth } from "./AuthContext";

// =================== TYPES =====================

export type PaymentMethodType = "COD" | "MOMO" | "BANKING";

export type CreateOrderInput = {
    items: {
        productId: number;
        productName: string;
        productImage: string;
        size: string;
        quantity: number;
        price: number;
    }[];
    shippingInfo: {
        fullName: string;
        phone: string;
        address: string;
        note?: string;
    };
    paymentMethod: PaymentMethodType;
    subtotal: number;
    shippingFee: number;
    discount?: number;
    voucherCode?: string;
    total: number;
};

// =================== CONTEXT =====================

type OrderContextType = {
    orders: Order[];
    isLoading: boolean;
    createOrder: (input: CreateOrderInput) => Promise<Order>;
    getOrderById: (id: number) => Promise<Order | null>;
    cancelOrder: (orderId: number) => Promise<boolean>;
    refreshOrders: () => Promise<void>;
    getOrdersByStatus: (status: OrderStatus) => Order[];
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = "user_orders_cache";

// =================== PROVIDER =====================

export function OrderProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // =================== LOAD ORDERS FROM API =====================

    const refreshOrders = useCallback(async () => {
        if (!isAuthenticated || !user?.id) {
            setOrders([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await orderService.getByUserDetail(user.id);

            if (Array.isArray(response)) {
                // Sort by date descending
                const sortedOrders = response.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setOrders(sortedOrders);

                // Cache to local storage
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortedOrders));
            }
        } catch (error: any) {
            console.log("Error loading orders from API:", error.message);

            // Try to load from cache
            try {
                const cached = await AsyncStorage.getItem(STORAGE_KEY);
                if (cached) {
                    setOrders(JSON.parse(cached));
                }
            } catch (cacheError) {
                console.log("Error loading cached orders:", cacheError);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user?.id]);

    // Load orders when user logs in
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            refreshOrders();
        } else {
            setOrders([]);
        }
    }, [isAuthenticated, user?.id, refreshOrders]);

    // =================== CREATE ORDER =====================

    const createOrder = async (input: CreateOrderInput): Promise<Order> => {
        if (!user?.id) {
            throw new Error("Bạn cần đăng nhập để đặt hàng");
        }

        setIsLoading(true);
        try {
            const checkoutData: MobileCheckoutRequest = {
                userId: user.id,
                shippingName: input.shippingInfo.fullName,
                shippingPhone: input.shippingInfo.phone,
                shippingAddress: input.shippingInfo.address,
                paymentMethod: input.paymentMethod,
                note: input.shippingInfo.note,
                voucherCode: input.voucherCode,
                items: input.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    productImage: item.productImage,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                })),
                subtotal: input.subtotal,
                shippingFee: input.shippingFee,
                discount: input.discount || 0,
                totalAmount: input.total,
            };

            const newOrder = await orderService.mobileCheckout(checkoutData);

            console.log("✅ Order created:", newOrder);

            // Add to beginning of orders list
            setOrders(prev => [newOrder, ...prev]);

            // Update cache
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([newOrder, ...orders]));

            return newOrder;
        } catch (error: any) {
            console.error("❌ Error creating order:", error);
            throw new Error(error.response?.data?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    // =================== GET ORDER BY ID =====================

    const getOrderById = async (orderId: number): Promise<Order | null> => {
        // First check local cache
        const localOrder = orders.find(o => o.orderId === orderId);
        if (localOrder) {
            return localOrder;
        }

        // Fetch from API
        try {
            const order = await orderService.getById(orderId);
            return order;
        } catch (error) {
            console.log("Error fetching order:", error);
            return null;
        }
    };

    // =================== CANCEL ORDER =====================

    const cancelOrder = async (orderId: number): Promise<boolean> => {
        try {
            await orderService.cancel(orderId);

            // Update local state
            setOrders(prev =>
                prev.map(order =>
                    order.orderId === orderId
                        ? { ...order, status: 'CANCELLED' as OrderStatus }
                        : order
                )
            );

            console.log("✅ Order cancelled:", orderId);
            return true;
        } catch (error: any) {
            console.error("❌ Error cancelling order:", error);
            throw new Error(error.response?.data?.message || "Không thể hủy đơn hàng");
        }
    };

    // =================== GET ORDERS BY STATUS =====================

    const getOrdersByStatus = (status: OrderStatus): Order[] => {
        return orders.filter(order => order.status === status);
    };

    // =================== CONTEXT VALUE =====================

    const value: OrderContextType = {
        orders,
        isLoading,
        createOrder,
        getOrderById,
        cancelOrder,
        refreshOrders,
        getOrdersByStatus,
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
}

// =================== HOOK =====================

export function useOrders() {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error("useOrders must be used inside OrderProvider");
    }
    return context;
}

export default OrderContext;
