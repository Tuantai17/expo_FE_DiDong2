/**
 * Services Index - Export tất cả các services
 * =============================================
 * Import từ đây để sử dụng các API services
 * 
 * Usage:
 * import { productService, categoryService, orderService } from '@/services';
 */

// API Configuration & Base
export * from './api';

// Product Service
export { getProductImageUrl, productService } from './productService';
export type {
    PaginatedResponse, Product, ProductImage,
    ProductListParams, ProductSize, ProductVariant
} from './productService';

// Category Service
export { categoryService, getCategoryImageUrl } from './categoryService';
export type { Category } from './categoryService';

// Cart Service
export { cartService, getCartItemImageUrl } from './cartService';
export type {
    Cart, AddToCartRequest as CartAddRequest, CartItem as CartServiceItem
} from './cartService';

// Order Service
export {
    ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, getStatusColor, getStatusLabel, orderService
} from './orderService';
export type {
    MobileCheckoutRequest, Order,
    OrderItem,
    OrderStatus,
    PaymentMethod
} from './orderService';

// Voucher Service
export {
    calculateDiscountAmount, formatVoucherDiscount,
    isVoucherValid, voucherService
} from './voucherService';
export type {
    DiscountCalculation, DiscountType, Voucher, VoucherCheckResult
} from './voucherService';

// User Service
export { userService } from './userService';
export type {
    AddressRequest,
    ChangePasswordRequest, UpdateProfileRequest, UserAddress, User as UserProfile
} from './userService';

// MoMo Payment Service
export {
    createMoMoPayment,
    checkMoMoPaymentStatus,
    simulateMoMoPayment,
} from './momoService';
export type {
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentStatusResponse,
    MoMoPaymentType,
} from './momoService';
