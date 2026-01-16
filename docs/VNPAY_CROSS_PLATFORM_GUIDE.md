# 📱 VNPay Cross-Platform Integration Guide

## 🎯 Tổng Quan

Tài liệu này mô tả chi tiết việc tích hợp thanh toán **VNPay Cross-Platform** cho ứng dụng React Native + Expo, hỗ trợ:

- **iOS/Android Native**: Sử dụng WebView
- **Web (Expo Web)**: Sử dụng Browser Redirect

---

## ✅ Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                    Checkout Screen                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   handleVNPayPayment()                              │   │
│  │                                                     │   │
│  │   1. Create Order on Backend                        │   │
│  │   2. Call API /api/payment/vnpay/create             │   │
│  │   3. Check Platform.OS                              │   │
│  │      │                                              │   │
│  │      ├── Platform.OS === 'web'                      │   │
│  │      │   └── window.location.href = paymentUrl      │   │
│  │      │       (Browser Redirect)                     │   │
│  │      │                                              │   │
│  │      └── Platform.OS === 'ios' | 'android'          │   │
│  │          └── Navigate to VNPayWebViewScreen         │   │
│  │              (In-App WebView)                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu Trúc Files

```
DiDong2_Shoeshop/
├── app/
│   └── product/
│       ├── checkout.tsx           # Cross-platform checkout
│       ├── vnpay-webview.tsx      # WebView screen (Native only)
│       └── order-success.tsx      # Success screen
├── hooks/
│   └── useVNPayPayment.ts         # VNPay payment hook
├── services/
│   └── vnpayService.ts            # VNPay API calls
├── utils/
│   └── vnpayPlatform.ts           # Platform-specific helpers
└── docs/
    └── VNPAY_CROSS_PLATFORM_GUIDE.md
```

---

## 🔧 Core Implementation

### 1. Platform Detection Utility (`utils/vnpayPlatform.ts`)

```typescript
import { Platform } from "react-native";

export const isWeb = (): boolean => Platform.OS === "web";
export const isNative = (): boolean =>
  Platform.OS === "ios" || Platform.OS === "android";

// Web: Redirect browser
export const openVNPayWeb = (paymentUrl: string): boolean => {
  if (typeof window !== "undefined") {
    window.location.href = paymentUrl;
    return true;
  }
  return false;
};
```

### 2. Checkout Flow (`app/product/checkout.tsx`)

```typescript
const handleVNPayPayment = async () => {
  // 1. Create order
  const orderId = await createOrderOnBackend();

  // 2. Get payment URL
  const result = await initiatePayment({ orderId, amount: total });

  // 3. Platform-specific handling
  if (isWeb()) {
    // WEB: Redirect browser
    await clearCart();
    openVNPayWeb(result.payUrl);
  } else {
    // NATIVE: Navigate to WebView screen
    router.push({
      pathname: "/product/vnpay-webview",
      params: {
        paymentUrl: result.payUrl,
        orderId: orderId.toString(),
        amount: total.toString(),
      },
    });
  }
};
```

### 3. WebView Screen (`app/product/vnpay-webview.tsx`)

```typescript
// Only import WebView on native
let WebView: any = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").default;
}

export default function VNPayWebViewScreen() {
  // Platform guard
  if (Platform.OS === "web") {
    return <Text>Not supported on web</Text>;
  }

  // Handle navigation state change
  const handleNavigationStateChange = (navState) => {
    if (navState.url.includes("/order-success")) {
      handlePaymentSuccess();
    }
  };

  return (
    <WebView
      source={{ uri: paymentUrl }}
      onNavigationStateChange={handleNavigationStateChange}
    />
  );
}
```

---

## 🌐 Platform-Specific Flows

### Web Flow

```
1. User clicks "Thanh toán VNPay"
2. App creates order on backend
3. App gets paymentUrl from backend
4. App clears cart
5. Browser redirects to VNPay: window.location.href = paymentUrl
6. User completes payment on VNPay
7. VNPay redirects to returnUrl (backend)
8. Backend processes and redirects to frontend success page
```

### Native (iOS/Android) Flow

```
1. User clicks "Thanh toán VNPay"
2. App creates order on backend
3. App gets paymentUrl from backend
4. App navigates to VNPayWebViewScreen
5. WebView loads VNPay payment page
6. User completes payment
7. VNPay redirects to returnUrl
8. WebView detects success URL pattern
9. App navigates to order-success screen
10. Cart is cleared
```

---

## 📡 Backend API Endpoints

| Method | Endpoint                              | Description                 |
| ------ | ------------------------------------- | --------------------------- |
| `POST` | `/api/payment/vnpay/create`           | Tạo payment URL             |
| `GET`  | `/api/payment/vnpay/return`           | Return URL (xử lý redirect) |
| `POST` | `/api/payment/vnpay/ipn`              | IPN callback (cập nhật DB)  |
| `GET`  | `/api/payment/vnpay/status/{orderId}` | Check payment status        |

### Return URL vs IPN

|                | Return URL                   | IPN (Instant Payment Notification) |
| -------------- | ---------------------------- | ---------------------------------- |
| **Purpose**    | Redirect user after payment  | Update database                    |
| **Security**   | User-visible, can be faked   | Server-to-server, verified         |
| **Trust**      | ❌ Don't trust for DB update | ✅ Trust for DB update             |
| **Idempotent** | N/A                          | ✅ Must be idempotent              |

---

## ⚙️ Backend Configuration

### application.properties

```properties
# VNPay Configuration
vnpay.url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.tmnCode=YOUR_TMN_CODE
vnpay.hashSecret=YOUR_HASH_SECRET

# Return URL - HTTPS, accessible from VNPay
vnpay.returnUrl=https://yourdomain.com/api/payment/vnpay/return

# IPN URL - HTTPS, public endpoint
vnpay.ipnUrl=https://yourdomain.com/api/payment/vnpay/ipn

# Frontend URLs for redirect after payment
vnpay.frontendSuccessUrl=http://localhost:8081/product/order-success
vnpay.frontendFailUrl=http://localhost:8081/product/checkout
```

### ngrok for Local Testing

```bash
# Terminal 1: Start backend
cd demo
./mvnw spring-boot:run

# Terminal 2: Expose backend
ngrok http 8080

# Update application.properties with ngrok URL
# vnpay.returnUrl=https://xxxx.ngrok.io/api/payment/vnpay/return
# vnpay.ipnUrl=https://xxxx.ngrok.io/api/payment/vnpay/ipn
```

---

## 🧪 Testing Guide

### Test Cards (VNPay Sandbox)

```
Bank: NCB
Card: 9704198526191432198
Name: NGUYEN VAN A
Date: 07/15
OTP: 123456
```

### Test on Each Platform

#### Web (Expo Web)

```bash
npm run web
# or
npx expo start --web
```

1. Add products to cart
2. Go to checkout
3. Select VNPay
4. Click "Thanh toán VNPay"
5. Browser redirects to VNPay sandbox
6. Complete payment
7. Redirected to success page

#### iOS (Simulator)

```bash
npx expo run:ios
# or
npx expo start → Press 'i'
```

1. Same flow, but:
2. WebView opens inside app
3. Complete payment in WebView
4. Auto-navigates to success screen

#### Android (Emulator)

```bash
npx expo run:android
# or
npx expo start → Press 'a'
```

---

## 🛡️ Best Practices & Checklist

### ✅ Do's

- [x] Use `Platform.OS` to detect platform
- [x] Conditionally import WebView only on native
- [x] Clear cart before web redirect
- [x] Use IPN for database updates (not returnUrl)
- [x] Make IPN handler idempotent
- [x] Verify HMAC signature on backend
- [x] Use HTTPS for returnUrl and ipnUrl

### ❌ Don'ts

- [ ] Don't import WebView unconditionally
- [ ] Don't update DB on returnUrl
- [ ] Don't trust frontend for payment verification
- [ ] Don't use `window.open` (popup blockers)
- [ ] Don't use localhost for VNPay URLs

---

## 🔄 Payment Status Polling (Optional)

For better UX on Web (where user returns manually):

```typescript
// After user returns from VNPay
const pollStatus = async (orderId: number) => {
  const maxAttempts = 10;
  const interval = 3000; // 3 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkVNPayPaymentStatus(orderId);

    if (status.status === "SUCCESS") {
      return status;
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};
```

---

## 🐛 Troubleshooting

### "WebView does not support this platform"

**Cause**: WebView imported on Web platform.

**Solution**: Conditionally import:

```typescript
let WebView: any = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").default;
}
```

### Popup Blocked on Web

**Cause**: Using `window.open()`.

**Solution**: Use `window.location.href` instead.

### Payment Success but Order Not Updated

**Cause**: IPN not received by backend.

**Check**:

1. Is IPN URL public (HTTPS)?
2. Is backend running?
3. Check backend logs for IPN calls

---

## 📊 Flow Diagrams

### Complete Cross-Platform Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Checkout   │────▶│   Backend    │────▶│    VNPay     │
│    Screen    │     │   API        │     │   Sandbox    │
└──────────────┘     └──────────────┘     └──────────────┘
      │                    │                    │
      │ Create Order       │                    │
      │────────────────────▶                    │
      │                    │                    │
      │ Get Payment URL    │                    │
      │◀────────────────────                    │
      │                    │                    │
      ├── Web ─────────────────────────────────▶│
      │   (Browser Redirect)                    │
      │                    │                    │
      ├── Native ──────────────────────────────▶│
      │   (WebView)                             │
      │                    │                    │
      │                    │◀──── IPN ──────────│
      │                    │   (Update DB)      │
      │                    │                    │
      │◀───────────────────────── Return ───────│
      │                    │                    │
      ▼                    │                    │
┌──────────────┐           │                    │
│Order Success │           │                    │
│   Screen     │           │                    │
└──────────────┘           │                    │
```

---

## 📝 Changelog

### v2.1.0 (2026-01-06)

- ✅ **ADDED**: Cross-platform support (Web + Native)
- ✅ **FIXED**: WebView not supported on web error
- ✅ Separate WebView screen for native
- ✅ Browser redirect for web
- ✅ Platform-specific utils

### v2.0.0 (2026-01-06)

- ✅ Initial VNPay integration replacing MoMo

---

_Document Version: 2.1_
_Last Updated: 2026-01-06_
