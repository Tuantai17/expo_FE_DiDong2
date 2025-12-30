/**
 * Context Index - Export tất cả contexts
 * ========================================
 * Import từ đây để sử dụng các context providers và hooks
 * 
 * Usage:
 * import { useAuth, useCart, useOrders } from '@/context';
 */

// Auth Context
export { AuthProvider, useAuth } from './AuthContext';

// Cart Context
export { CartProvider, useCart } from './CartContext';
export type { CartItem } from './CartContext';

// Order Context
export { OrderProvider, useOrders } from './OrderContext';
export type { CreateOrderInput, PaymentMethodType } from './OrderContext';

// Favorite Context
export { FavoriteProvider, useFavorite } from './FavoriteContext';
export type { FavoriteItem } from './FavoriteContext';
