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
    isVoucherValid, userVoucherService, voucherService
} from './voucherService';
export type {
    DiscountCalculation, DiscountType, SaveVoucherResult, UserVoucher, Voucher, VoucherCheckResult
} from './voucherService';

// User Service
export { userService } from './userService';
export type {
    AddressRequest,
    ChangePasswordRequest, UpdateProfileRequest, UserAddress, User as UserProfile
} from './userService';

// VNPay Payment Service (Replaces MoMo)
export {
    checkVNPayPaymentStatus, confirmVNPayPayment, createVNPayPayment, simulateVNPayPayment, vnpayService
} from './vnpayService';
export type {
    CreateVNPayPaymentRequest,
    CreateVNPayPaymentResponse, VNPaySimulateResponse, VNPayStatusResponse
} from './vnpayService';

// Review Service
export { reviewService } from './reviewService';
export type { CheckReviewedResponse, CreateReviewRequest, Review, ReviewResponse, ReviewSummary, ReviewSummaryResponse, ReviewsResponse, UpdateReviewRequest } from './reviewService';

// Minigame Service
export * from './minigameService';

// Payment History Service
export {
    countMyPayments,
    formatCurrency,
    formatDateTime,
    getDisplayTime,
    getGatewayDisplayName,
    getMyPaymentDetail,
    getMyPaymentHistory,
    getStatusColor as getPaymentStatusColor
} from './paymentHistoryService';
export type {
    OrderItemSummary,
    PaymentDetail,
    PaymentHistoryItem,
    PaymentHistoryResponse,
    PaymentStatus
} from './paymentHistoryService';

// Shipping Service
export { shippingService } from './shippingService';
export type {
    CheckoutPreviewRequest,
    CheckoutPreviewResponse,
    ProvinceDTO,
    ShippingCalculateRequest,
    ShippingCalculateResponse
} from './shippingService';

