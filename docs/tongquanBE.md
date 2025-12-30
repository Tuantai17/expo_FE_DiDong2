
## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Mô tả | Body |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản | `RegisterRequest` |
| POST | `/api/auth/login` | Đăng nhập | `LoginRequest` |
| GET | `/api/auth/me` | Lấy thông tin user (từ token) | Header: `Authorization: Bearer {token}` |

**RegisterRequest**:
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "123456",
  "phone": "0901234567"
}
```

**LoginRequest**:
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**LoginResponse**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "id": 1,
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0901234567",
  "role": "USER"
}
```

---

### 📦 Products (`/api/products`)

| Method | Endpoint | Mô tả | Params |
|--------|----------|-------|--------|
| GET | `/api/products` | Danh sách sản phẩm | `categoryId`, `page`, `size`, `sort`, `filter` |
| GET | `/api/products/{id}` | Chi tiết sản phẩm | - |
| GET | `/api/products/{id}/detail` | Chi tiết + variants | - |
| GET | `/api/products/search` | Tìm kiếm | `q`, `categoryId` |
| POST | `/api/products` | Tạo mới (FormData) | - |
| POST | `/api/products/json` | Tạo mới (JSON) | `ProductRequest` |
| PUT | `/api/products/{id}` | Cập nhật | - |
| PUT | `/api/products/{id}/full` | Cập nhật + variants | `ProductRequest` |
| DELETE | `/api/products/{id}` | Xóa mềm | - |
| DELETE | `/api/products/{id}/force` | Xóa vĩnh viễn | - |
| GET | `/api/products/trash` | Sản phẩm đã xóa | - |
| PUT | `/api/products/{id}/restore` | Khôi phục | - |
| GET | `/api/products/category/{categoryId}` | Lọc theo danh mục | `page`, `size` |
| GET | `/api/products/brand/{brand}` | Lọc theo thương hiệu | `page`, `size` |
| GET | `/api/products/gender/{gender}` | Lọc theo giới tính | `page`, `size` |
| GET | `/api/products/price-range` | Lọc theo giá | `minPrice`, `maxPrice` |
| GET | `/api/products/brands` | Danh sách thương hiệu | - |
| GET | `/api/products/newest` | Sản phẩm mới | `limit` |
| GET | `/api/products/best-sellers` | Bán chạy | `limit` |

**Product Entity**:
```json
{
  "id": 1,
  "title": "Nike Air Max 90",
  "description": "Giày thể thao...",
  "price": 2500000,
  "priceRoot": 3000000,
  "brand": "Nike",
  "gender": "MEN",           // MEN, WOMEN, KIDS, UNISEX
  "sku": "SKU-123456789",
  "status": "ACTIVE",        // ACTIVE, INACTIVE
  "categoryId": 1,
  "photo": "/images/nike.jpg",
  "qty": 100,
  "slug": "nike-air-max-90",
  "deleted": false,
  "createdAt": "2024-12-28T00:00:00",
  "updatedAt": "2024-12-28T00:00:00",
  "variants": [...],
  "images": [...]
}
```

---

### 📁 Categories (`/api/categories`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/categories` | Tất cả danh mục |
| GET | `/api/categories/active` | Danh mục đang hoạt động |
| GET | `/api/categories/{id}` | Chi tiết danh mục |
| POST | `/api/categories` | Tạo mới |
| PUT | `/api/categories/{id}` | Cập nhật |
| DELETE | `/api/categories/{id}` | Xóa |
| GET | `/api/categories/search` | Tìm kiếm (`keyword`) |

**Category Entity**:
```json
{
  "id": 1,
  "name": "Giày thể thao",
  "slug": "giay-the-thao",
  "description": "Các loại giày thể thao",
  "image": "/images/category1.jpg",
  "isActive": true
}
```

---

### 🛒 Cart (`/api/carts`)

| Method | Endpoint | Mô tả | Body |
|--------|----------|-------|------|
| GET | `/api/carts` | **(Admin)** Tất cả giỏ hàng | - |
| GET | `/api/carts/{id}` | **(Admin)** Chi tiết giỏ hàng | - |
| GET | `/api/carts/user/{userId}` | Giỏ hàng của user | - |
| GET | `/api/carts/user/{userId}/detail` | Chi tiết giỏ hàng | - |
| POST | `/api/carts/add` | Thêm vào giỏ | `AddToCartRequest` |
| POST | `/api/carts/user/{userId}/add` | Thêm (trả về DTO) | `AddToCartRequest` |
| PUT | `/api/carts/items/{itemId}` | Cập nhật số lượng | `{ "quantity": 2 }` |
| DELETE | `/api/carts/items/{itemId}` | Xóa item | - |
| DELETE | `/api/carts/{userId}/remove/{productId}` | Xóa theo productId | - |
| DELETE | `/api/carts/user/{userId}/clear` | Xóa toàn bộ giỏ | - |
| GET | `/api/carts/user/{userId}/count` | Số lượng items | - |
| GET | `/api/carts/user/{userId}/total` | Tổng tiền giỏ hàng | - |

**AddToCartRequest**:
```json
{
  "userId": 1,
  "productId": 10,
  "size": "42",
  "quantity": 1,
  "price": 2500000
}
```

---

### 📋 Orders (`/api/orders`)

| Method | Endpoint | Mô tả | Body/Params |
|--------|----------|-------|-------------|
| POST | `/api/orders/checkout` | Checkout (từ giỏ hàng DB) | `CheckoutRequest` |
| POST | `/api/orders/mobile-checkout` | Checkout (mobile) | `MobileCheckoutRequest` |
| POST | `/api/orders/create` | Tạo đơn hàng mới | `CreateOrderRequest` |
| GET | `/api/orders` | **(Admin)** Tất cả đơn hàng | `page`, `size` |
| GET | `/api/orders/{id}` | Chi tiết đơn hàng | - |
| GET | `/api/orders/{id}/detail` | Chi tiết (DTO) | - |
| GET | `/api/orders/code/{orderCode}` | Tìm theo mã đơn | - |
| PUT | `/api/orders/{id}` | **(Admin)** Cập nhật | - |
| PUT | `/api/orders/{id}/status` | Cập nhật trạng thái | `status` |
| POST | `/api/orders/{id}/cancel` | Hủy đơn hàng | - |
| GET | `/api/orders/{id}/items` | Các sản phẩm trong đơn | - |
| GET | `/api/orders/user/{userId}` | Đơn hàng của user | `status` |
| GET | `/api/orders/user/{userId}/detail` | Đơn hàng user (DTO) | - |
| GET | `/api/orders/status/{status}` | Lọc theo trạng thái | `page`, `size` |
| GET | `/api/orders/recent` | Đơn hàng gần đây | `limit` |
| GET | `/api/orders/stats` | **(Admin)** Thống kê | - |
| GET | `/api/orders/revenue` | **(Admin)** Doanh thu | `startDate`, `endDate` |
| GET | `/api/orders/monthly-stats/{year}` | Thống kê theo tháng | - |

**MobileCheckoutRequest** (cho app mobile):
```json
{
  "userId": 1,
  "shippingName": "Nguyễn Văn A",
  "shippingPhone": "0901234567",
  "shippingAddress": "123 Đường ABC, Quận 1, TP.HCM",
  "paymentMethod": "COD",
  "note": "Giao buổi sáng",
  "voucherCode": "SALE10",
  "items": [
    {
      "productId": 10,
      "productName": "Nike Air Max 90",
      "productImage": "/images/nike.jpg",
      "size": "42",
      "quantity": 1,
      "price": 2500000
    }
  ],
  "subtotal": 2500000,
  "shippingFee": 30000,
  "discount": 250000,
  "totalAmount": 2280000
}
```

**Order Status Enum**:
- `PENDING` - Chờ xử lý
- `CONFIRMED` - Đã xác nhận
- `PROCESSING` - Đang xử lý
- `SHIPPING` - Đang giao hàng
- `DELIVERED` - Đã giao hàng
- `COMPLETED` - Hoàn thành
- `CANCELLED` - Đã hủy

---

### 👥 Users (`/api/users`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users` | **(Admin)** Danh sách users (`page`, `size`) |
| GET | `/api/users/{id}` | Chi tiết user |
| GET | `/api/users/{id}/profile` | Profile user (DTO) |
| PUT | `/api/users/{id}` | Cập nhật user |
| DELETE | `/api/users/{id}` | Xóa user |
| GET | `/api/users/search` | Tìm kiếm (`keyword`) |
| GET | `/api/users/{userId}/addresses` | Danh sách địa chỉ |
| POST | `/api/users/{userId}/addresses` | Thêm địa chỉ |
| PUT | `/api/users/{userId}/addresses/{addressId}` | Cập nhật địa chỉ |
| DELETE | `/api/users/{userId}/addresses/{addressId}` | Xóa địa chỉ |
| PUT | `/api/users/{userId}/addresses/{addressId}/default` | Đặt làm mặc định |
| POST | `/api/users/{userId}/change-password` | Đổi mật khẩu |
| GET | `/api/users/count` | Thống kê số lượng |

**User Entity**:
```json
{
  "id": 1,
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0901234567",
  "role": "USER",            // USER, ADMIN
  "emailVerifiedAt": null,
  "createdAt": "2024-12-28T00:00:00",
  "updatedAt": "2024-12-28T00:00:00"
}
```

---

### 🎟️ Vouchers (`/api/vouchers`)

| Method | Endpoint | Mô tả | Params |
|--------|----------|-------|--------|
| GET | `/api/vouchers` | **(Admin)** Danh sách | `page`, `size` |
| GET | `/api/vouchers/{id}` | Chi tiết voucher | - |
| GET | `/api/vouchers/{id}/detail` | Chi tiết (DTO) | - |
| POST | `/api/vouchers` | **(Admin)** Tạo mới | - |
| PUT | `/api/vouchers/{id}` | **(Admin)** Cập nhật | - |
| DELETE | `/api/vouchers/{id}` | **(Admin)** Xóa | - |
| GET | `/api/vouchers/check` | Kiểm tra mã | `code`, `total` |
| POST | `/api/vouchers/apply` | Áp dụng mã | - |
| GET | `/api/vouchers/public` | Vouchers còn hiệu lực | - |
| GET | `/api/vouchers/applicable` | Vouchers áp dụng được | `orderAmount` |
| GET | `/api/vouchers/calculate` | Tính tiền giảm | `code`, `orderAmount` |

**Voucher Entity**:
```json
{
  "id": 1,
  "code": "SALE10",
  "discount": 10,
  "discountType": "PERCENTAGE",  // PERCENTAGE, FIXED_AMOUNT
  "minOrderAmount": 500000,
  "maxDiscountAmount": 100000,
  "expiryDate": "2024-12-31",
  "usageLimit": 100,
  "usedCount": 25,
  "isActive": true,
  "description": "Giảm 10% đơn hàng",
  "createdAt": "2024-12-28T00:00:00",
  "updatedAt": "2024-12-28T00:00:00"
}
```

---

### 📤 Upload (`/api/upload`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/upload/image` | Upload ảnh (FormData: `file`) |

**Response**:
```json
{
  "url": "/images/filename.jpg"
}
```

---

## 📊 Entities (Database Tables)

### Sơ đồ quan hệ

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │──1──│    Cart     │──*──│  CartItem   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       │
       │1                                      │*
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│    Order    │──*─────────────────────>│   Product   │
└─────────────┘                         └─────────────┘
       │                                       │
       │*                                      │*
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│  OrderItem  │                         │  Category   │
└─────────────┘                         └─────────────┘
       │                                       
       │                               ┌─────────────┐
       │                               │ProductVariant│
       │                               └─────────────┘
       ▼                                       
┌─────────────┐                         ┌─────────────┐
│   Voucher   │                         │ProductImage │
└─────────────┘                         └─────────────┘

┌─────────────┐
│ UserAddress │
└─────────────┘
```

### Danh sách Entities

| Entity | Table | Mô tả |
|--------|-------|-------|
| `User` | `users` | Thông tin người dùng |
| `UserAddress` | `user_addresses` | Địa chỉ giao hàng |
| `Product` | `products` | Sản phẩm |
| `ProductVariant` | `product_variants` | Biến thể (màu sắc) |
| `ProductImage` | `product_images` | Ảnh sản phẩm |
| `ProductSize` | `product_sizes` | Size sản phẩm |
| `Category` | `categories` | Danh mục |
| `Cart` | `carts` | Giỏ hàng |
| `CartItem` | `cart_items` | Sản phẩm trong giỏ |
| `Order` | `orders` | Đơn hàng |
| `OrderItem` | `order_items` | Sản phẩm trong đơn |
| `Voucher` | `vouchers` | Mã giảm giá |
| `Payment` | `payments` | Thanh toán |

---

## 🔗 Kết Nối Frontend

### Mobile App (DiDong2_Shoeshop)

File `.env`:
```env
API_BASE_URL=http://192.168.1.10:8080/api
```

### Admin Panel (test-admin)

File `.env`:
```env
VITE_API_URL=http://localhost:8080/api
```

---

## 📝 Headers Quan Trọng

### Content-Type
```
Content-Type: application/json
```

### Authorization (sau khi login)
```
Authorization: Bearer {token}
```

### CORS Headers (đã cấu hình sẵn)
```
Content-Range: items 0-10/100
X-Total-Count: 100
```

---

## 🛠️ Development

### Chạy trong Development
```powershell
.\mvnw spring-boot:run
```

### Build Production
```powershell
.\mvnw clean package -DskipTests
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

---

## 📌 Ghi Chú

1. **Password** được mã hóa bằng BCrypt
2. **JWT Token** có thời hạn 24 giờ
3. **CORS** đã được cấu hình cho phép tất cả origins
4. **File upload** giới hạn 10MB
5. **Pagination** mặc định: page=0, size=100
