// context/CartContext.tsx
/**
 * CartContext - Quản lý giỏ hàng
 * ==============================
 * Đồng bộ giỏ hàng với backend database
 * Lưu local + gọi API để sync với server
 */

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
  addToCartApi,
  clearCartApi,
  getCartByUserApi,
  getImageUrl,
  removeFromCartApi,
} from "../services/api";
import { useAuth } from "./AuthContext";

// =================== TYPES =====================

export type CartItem = {
  id: string;           // product id (string để tương thích)
  productId: number;    // product id (number cho API)
  name: string;
  price: number;
  image: any;
  size: string;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  addToCart: (item: Omit<CartItem, "qty"> & { quantity?: number }) => Promise<void>;
  changeQty: (id: string, size: string, delta: 1 | -1) => void;
  removeItem: (id: string, size: string) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
};

// =================== CONTEXT =====================

const CartContext = createContext<CartContextType | undefined>(undefined);

// =================== PROVIDER =====================

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Tính tổng số items
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  // Tính tổng giá
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // =================== LOAD CART FROM BACKEND =====================

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getCartByUserApi(user.id);

      if (response && response.items && Array.isArray(response.items)) {
        // Convert API response to CartItem format
        // Backend CartItemDTO uses: productTitle, productImage, price, quantity
        // Filter out invalid items (no productId, no price, no name)
        const cartItems: CartItem[] = response.items
          .filter((item: any) => {
            // Skip items without valid product info
            const productId = item.productId;
            const price = item.price ?? item.productPrice;
            const name = item.productTitle ?? item.productName;
            const quantity = item.quantity;

            if (!productId || productId <= 0) return false;
            if (!price || price <= 0) return false;
            if (!name || name === "Sản phẩm" || name === "") return false;
            if (!quantity || quantity <= 0) return false;
            return true;
          })
          .map((item: any) => ({
            id: String(item.productId),
            productId: item.productId,
            name: item.productTitle || item.productName || "Sản phẩm",
            price: item.price ?? item.productPrice ?? 0,
            image: item.productImage || item.productPhoto
              ? getImageUrl(item.productImage || item.productPhoto)
              : "",
            size: item.size || "40",
            qty: item.quantity || 1,
          }));
        setItems(cartItems);
      } else {
        setItems([]);
      }
    } catch (error: any) {
      console.log("Error loading cart:", error.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Load cart khi user đăng nhập
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshCart();
    } else {
      // Clear cart khi logout
      setItems([]);
    }
  }, [isAuthenticated, user?.id, refreshCart]);

  // =================== ADD TO CART =====================

  const addToCart = async (item: Omit<CartItem, "qty"> & { quantity?: number }) => {
    const quantity = item.quantity || 1;

    // Cập nhật local state immediately
    setItems((prev) => {
      const index = prev.findIndex(
        (p) => p.id === item.id && p.size === item.size
      );
      if (index !== -1) {
        const clone = [...prev];
        clone[index] = { ...clone[index], qty: clone[index].qty + quantity };
        return clone;
      }
      return [...prev, { ...item, qty: quantity }];
    });

    // Sync với backend nếu đã đăng nhập
    if (isAuthenticated && user?.id) {
      try {
        await addToCartApi({
          userId: user.id,
          productId: item.productId || parseInt(item.id),
          quantity: quantity,
          productPrice: item.price,
          discount: 0,
        });
        console.log("✅ Synced to backend cart");
      } catch (error: any) {
        console.log("❌ Error syncing to backend:", error.message);
        // Không rollback, vì local cart vẫn hoạt động
      }
    }
  };

  // =================== CHANGE QUANTITY =====================

  const changeQty = (id: string, size: string, delta: 1 | -1) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id || item.size !== size) return item;
          const newQty = item.qty + delta;
          if (newQty <= 0) return { ...item, qty: 0 };
          return { ...item, qty: newQty };
        })
        .filter((item) => item.qty > 0)
    );

    // TODO: Có thể thêm sync với backend nếu cần
  };

  // =================== REMOVE ITEM =====================

  const removeItem = async (id: string, size: string) => {
    // Sync với backend TRƯỚC, sau đó mới update local state
    if (isAuthenticated && user?.id) {
      try {
        await removeFromCartApi(user.id, parseInt(id));
        console.log("✅ Removed from backend cart");
        // Chỉ xóa local state sau khi backend thành công
        setItems((prev) =>
          prev.filter((item) => !(item.id === id && item.size === size))
        );
      } catch (error: any) {
        console.log("❌ Error removing from backend:", error.message);
        // Vẫn xóa local để UX tốt, nhưng log lỗi
        setItems((prev) =>
          prev.filter((item) => !(item.id === id && item.size === size))
        );
      }
    } else {
      // Không đăng nhập, chỉ xóa local
      setItems((prev) =>
        prev.filter((item) => !(item.id === id && item.size === size))
      );
    }
  };

  // =================== CLEAR CART =====================

  const clearCart = async () => {
    // Sync với backend nếu đã đăng nhập
    if (isAuthenticated && user?.id) {
      try {
        await clearCartApi(user.id);
        console.log("✅ Cleared backend cart");
      } catch (error: any) {
        console.log("❌ Error clearing backend cart:", error.message);
      }
    }
    // Luôn clear local state
    setItems([]);
  };

  // =================== CONTEXT VALUE =====================

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    isLoading,
    addToCart,
    changeQty,
    removeItem,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// =================== HOOK =====================

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
