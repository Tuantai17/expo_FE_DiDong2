# 📱 ShoeShop Mobile App - API Services

## 📋 Tổng quan

Mobile App React Native/Expo kết nối với Backend API Spring Boot để quản lý cửa hàng giày.

## 🚀 Cấu trúc Services

```
services/
├── api.ts              # API Configuration, Axios instance, Auth APIs
├── productService.ts   # Product APIs (CRUD, search, filter)
├── categoryService.ts  # Category APIs
├── cartService.ts      # Cart APIs (add, remove, update)
├── orderService.ts     # Order APIs (checkout, history)
├── voucherService.ts   # Voucher APIs (check, apply)
├── userService.ts      # User APIs (profile, addresses)
└── index.ts            # Export all services
```

## 📦 Cách sử dụng

### Import Services

```typescript
// Import từ index
import { 
  productService, 
  categoryService, 
  orderService 
} from '@/services';

// Hoặc import trực tiếp
import { productService } from '@/services/productService';
```

### Ví dụ sử dụng

#### 1. Lấy danh sách sản phẩm

```typescript
import { productService, Product } from '@/services';

const loadProducts = async () => {
  try {
    // Lấy tất cả sản phẩm
    const products = await productService.getAll();
    
    // Lấy theo category
    const categoryProducts = await productService.getByCategory(1);
    
    // Tìm kiếm
    const searchResults = await productService.search('nike');
    
    // Sản phẩm mới nhất
    const newest = await productService.getNewest(10);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### 2. Quản lý giỏ hàng

```typescript
import { cartService } from '@/services';

// Thêm vào giỏ
await cartService.addToCart({
  userId: 1,
  productId: 10,
  size: '42',
  quantity: 1,
  price: 2500000
});

// Lấy giỏ hàng
const cart = await cartService.getCart(userId);

// Cập nhật số lượng
await cartService.updateQuantity(itemId, 2);

// Xóa item
await cartService.removeItem(itemId);
```

#### 3. Đặt hàng

```typescript
import { orderService, MobileCheckoutRequest } from '@/services';

const checkoutData: MobileCheckoutRequest = {
  userId: 1,
  shippingName: 'Nguyễn Văn A',
  shippingPhone: '0901234567',
  shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
  paymentMethod: 'COD',
  items: [...],
  subtotal: 2500000,
  shippingFee: 30000,
  discount: 0,
  totalAmount: 2530000
};

const order = await orderService.mobileCheckout(checkoutData);
```

#### 4. Áp dụng voucher

```typescript
import { voucherService } from '@/services';

// Kiểm tra mã
const result = await voucherService.check('SALE10', 500000);

if (result.valid) {
  console.log('Tiền giảm:', result.discountAmount);
}

// Lấy danh sách voucher có thể dùng
const vouchers = await voucherService.getApplicable(500000);
```

## 🔧 Cấu hình

### File `.env`

```env
# Thay bằng IP máy tính của bạn (chạy ipconfig để lấy)
EXPO_PUBLIC_API_URL=http://192.168.1.10:8080
```

### Contexts

```
context/
├── AuthContext.tsx    # Quản lý đăng nhập/đăng ký
├── CartContext.tsx    # Quản lý giỏ hàng
├── OrderContext.tsx   # Quản lý đơn hàng
├── FavoriteContext.tsx # Quản lý yêu thích
└── index.ts           # Export all
```

### Sử dụng Context

```typescript
import { useAuth, useCart, useOrders } from '@/context';

// Trong component
const { user, login, logout } = useAuth();
const { items, addToCart, removeItem } = useCart();
const { orders, createOrder } = useOrders();
```

## 📱 Chạy ứng dụng

```bash
# Cài đặt dependencies
npm install

# Chạy trên Expo Go
npx expo start

# Chạy trên Android
npx expo run:android

# Chạy trên iOS
npx expo run:ios
```

## ⚠️ Lưu ý quan trọng

1. **Đảm bảo Backend đang chạy** tại `http://localhost:8080`
2. **Thay đổi IP** trong file `.env` nếu test trên điện thoại thật
3. **Token JWT** được tự động gửi kèm trong mỗi request sau khi đăng nhập
4. **Error handling** - Tất cả API calls nên được wrap trong try-catch
