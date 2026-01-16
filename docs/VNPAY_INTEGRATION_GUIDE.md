# 📱 VNPay Integration Guide - React Native (Expo)

## 🎯 Tổng Quan

Tài liệu này mô tả chi tiết việc tích hợp thanh toán VNPay vào ứng dụng React Native/Expo, thay thế hoàn toàn hệ thống thanh toán MoMo trước đó.

---

## ✅ Các Thay Đổi Đã Thực Hiện

### 1. Files Đã Tạo Mới

| File                                  | Mô tả                                             |
| ------------------------------------- | ------------------------------------------------- |
| `services/vnpayService.ts`            | Service xử lý API calls tới VNPay backend         |
| `hooks/useVNPayPayment.ts`            | Custom hook quản lý payment flow                  |
| `components/payment/VNPayWebView.tsx` | Component WebView hiển thị trang thanh toán VNPay |

### 2. Files Đã Cập Nhật

| File                            | Thay đổi                                    |
| ------------------------------- | ------------------------------------------- |
| `app/product/checkout.tsx`      | Thay MoMo bằng VNPay, sử dụng WebView modal |
| `app/product/order-success.tsx` | Cập nhật xử lý xác nhận thanh toán VNPay    |
| `services/orderService.ts`      | Thay PaymentMethod `MOMO` → `VNPAY`         |
| `context/OrderContext.tsx`      | Thay PaymentMethodType `MOMO` → `VNPAY`     |
| `services/index.ts`             | Export VNPay service thay MoMo              |
| `hooks/index.ts`                | Export VNPay hook thay MoMo                 |
| `components/payment/index.ts`   | Export VNPay WebView                        |

### 3. Files Đã Xóa

| File                                      | Lý do                        |
| ----------------------------------------- | ---------------------------- |
| `services/momoService.ts`                 | Thay bằng vnpayService.ts    |
| `hooks/useMoMoPayment.ts`                 | Thay bằng useVNPayPayment.ts |
| `components/payment/MoMoPaymentModal.tsx` | Thay bằng VNPayWebView.tsx   |

---

## 🔧 Cấu Trúc Code

### VNPay Service (`services/vnpayService.ts`)

```typescript
// Types
interface CreateVNPayPaymentRequest {
  orderId: number;
  amount: number;
  orderInfo?: string;
}

interface VNPayStatusResponse {
  success: boolean;
  orderId: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  amount: number;
  transactionId?: string;
  paymentGateway: string;
  paidAt?: string;
}

// Functions
createVNPayPayment(request); // Tạo payment URL
checkVNPayPaymentStatus(orderId); // Kiểm tra trạng thái
simulateVNPayPayment(orderId, amount); // Test (dev only)
confirmVNPayPayment(orderId); // Xác nhận thủ công
```

### VNPay Hook (`hooks/useVNPayPayment.ts`)

```typescript
const {
  isLoading,
  error,
  paymentUrl,
  paymentStatus,
  currentOrderId,
  vnpTxnRef,
  initiatePayment,
  verifyPayment,
  openPaymentUrl,
  simulatePayment,
  confirmPayment,
  resetState,
  pollPaymentStatus,
} = useVNPayPayment();
```

---

## 📡 Backend API Endpoints

| Method | Endpoint                               | Mô tả               |
| ------ | -------------------------------------- | ------------------- |
| `POST` | `/api/payment/vnpay/create`            | Tạo payment URL     |
| `GET`  | `/api/payment/vnpay/return`            | Xử lý return URL    |
| `POST` | `/api/payment/vnpay/ipn`               | IPN callback        |
| `GET`  | `/api/payment/vnpay/status/{orderId}`  | Kiểm tra trạng thái |
| `POST` | `/api/payment/vnpay/simulate`          | Test payment (dev)  |
| `POST` | `/api/payment/vnpay/confirm/{orderId}` | Xác nhận thủ công   |

---

## 🔄 Payment Flow

```
User nhấn "Thanh toán VNPay"
       ↓
[1] Tạo Order trên Backend
       ↓
[2] Gọi API /api/payment/vnpay/create
       ↓
[3] Nhận paymentUrl
       ↓
[4] Hiển thị WebView với paymentUrl
       ↓
[5] User thanh toán trên trang VNPay
       ↓
[6] VNPay redirect về Return URL
       ↓
[7] Backend xử lý và redirect về:
    - Success: /product/order-success?orderId=X&status=success
    - Fail: /product/checkout?error=message
       ↓
[8] WebView detect URL → Navigate accordingly
       ↓
[9] Hiển thị Order Success screen
```

---

## 🧪 Testing Guide

### Thông Tin Test VNPay Sandbox

```
Ngân hàng: NCB (hoặc bất kỳ)
Số thẻ: 9704198526191432198
Tên: NGUYEN VAN A
Ngày phát hành: 07/15
Mã OTP: 123456
```

### Test Steps

1. **Thêm sản phẩm vào giỏ**
2. **Đi đến Checkout**
3. **Nhập thông tin giao hàng**
4. **Chọn "VNPay"**
5. **Nhấn "Thanh toán VNPay"**
6. **WebView mở trang VNPay Sandbox**
7. **Chọn ngân hàng NCB**
8. **Nhập thông tin thẻ test**
9. **Nhập OTP: 123456**
10. **Thanh toán thành công → Redirect về Order Success**

### Simulate Payment (Dev Mode)

Trong modal VNPay, có nút **"🧪 Test: Mô phỏng thành công"** để test nhanh mà không cần VNPay thật.

---

## ⚙️ Configuration

### API Base URL

File: `config/api.config.ts`

```typescript
export const API_BASE_URL = "http://YOUR_IP:8080";
// Thay YOUR_IP bằng IP máy backend
// Windows: ipconfig
// Mac: ifconfig
```

### Backend VNPay Config

File: `application.properties`

```properties
# VNPay Sandbox
vnpay.url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.tmnCode=YOUR_TMN_CODE
vnpay.hashSecret=YOUR_HASH_SECRET
vnpay.returnUrl=http://YOUR_BACKEND_URL/api/payment/vnpay/return
vnpay.ipnUrl=http://YOUR_BACKEND_URL/api/payment/vnpay/ipn
vnpay.version=2.1.0
vnpay.command=pay
vnpay.orderType=other
vnpay.frontendSuccessUrl=http://localhost:8081/product/order-success
vnpay.frontendFailUrl=http://localhost:8081/product/checkout
```

---

## 🎨 UI/UX

### Payment Methods

1. **Thanh toán khi nhận hàng (COD)**

   - Icon: cash-outline
   - Color: Default blue

2. **VNPay** ⭐ NEW

   - Icon: card-outline
   - Color: #0066CC (VNPay Blue)
   - Supports: ATM, Visa, MasterCard, JCB

3. **Chuyển khoản ngân hàng**
   - Icon: business-outline
   - Color: Default blue

### WebView Modal

- Header với logo VNPay và số tiền
- WebView full-screen cho trang thanh toán
- Footer với nút "Kiểm tra trạng thái"
- Security badge

---

## ⚠️ Important Notes

### 1. Same WiFi Network

Phone và backend phải cùng mạng WiFi khi test trên thiết bị thật.

### 2. Không dùng localhost

Thay `localhost` bằng IP thực tế trong `API_BASE_URL`.

### 3. Backend phải chạy

```bash
cd demo
./mvnw spring-boot:run
```

### 4. IPN URL cần public

Để VNPay gọi IPN callback, backend cần public URL:

- Dùng ngrok: `ngrok http 8080`
- Hoặc deploy lên server

---

## 📞 Support

- **VNPay Sandbox**: https://sandbox.vnpayment.vn
- **VNPay Support**: 1900 55 55 77
- **Backend Docs**: `/demo/doc/README_VNPAY.md`
- **React Native Guide**: `/demo/doc/REACT_NATIVE_VNPAY_GUIDE.md`

---

## 📝 Changelog

### v2.0.0 (2026-01-06)

- ✅ **REMOVED**: MoMo payment integration
- ✅ **ADDED**: VNPay payment integration
- ✅ Updated checkout flow with WebView
- ✅ Updated order success screen
- ✅ Clean, structured code

---

_Document Version: 2.0_
_Last Updated: 2026-01-06_
