# 📱 HƯỚNG DẪN TÍCH HỢP THANH TOÁN MOMO - MOBILE APP

## 📋 Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc API Backend](#2-kiến-trúc-api-backend)
3. [Chuẩn Bị Môi Trường](#3-chuẩn-bị-môi-trường)
4. [Triển Khai Frontend Mobile (React Native)](#4-triển-khai-frontend-mobile-react-native)
5. [Luồng Thanh Toán Chi Tiết](#5-luồng-thanh-toán-chi-tiết)
6. [Xử Lý Deep Link](#6-xử-lý-deep-link)
7. [Test và Debug](#7-test-và-debug)
8. [Troubleshooting](#8-troubleshooting)
9. [Checklist Triển Khai](#9-checklist-triển-khai)

---

## 1. Tổng Quan Hệ Thống

### 1.1 Đánh Giá Backend (ĐÃ ĐẦY ĐỦ ✅)

| Component | File | Trạng thái |
|-----------|------|------------|
| Config Class | `MomoConfig.java` | ✅ Có |
| Service Layer | `MomoService.java` | ✅ Có |
| Controller | `MomoPaymentController.java` | ✅ Có |
| DTOs | `MomoRequest.java`, `MomoCreatePaymentResponse.java`, `MomoCallbackResponse.java` | ✅ Có |
| Utility | `HmacUtil.java` | ✅ Có |
| Entity | `Payment.java` | ✅ Có |
| Repository | `PaymentRepository.java` | ✅ Có |
| Database | `payments` table in `schema.sql` | ✅ Có |
| Security | `SecurityConfig.java` - `anyRequest().permitAll()` | ✅ Có |
| Properties | `application.properties` - MoMo Sandbox | ✅ Có |

### 1.2 Sơ Đồ Luồng Thanh Toán

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │────▶│   Backend   │────▶│  MoMo API   │────▶│  MoMo App   │
│     App     │     │  Spring Boot│     │  (Sandbox)  │     │  (Payment)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                  ▲                    │                    │
       │                  │                    │                    │
       │                  └──── Callback ◀─────┘                    │
       │                                                            │
       └────────────────── Deep Link Return ◀───────────────────────┘
```

---

## 2. Kiến Trúc API Backend

### 2.1 Danh Sách Endpoints

| Method | Endpoint | Mô tả | Request Body |
|--------|----------|-------|--------------|
| `POST` | `/api/payment/momo/create` | Tạo link thanh toán (JSON body) | `{ orderId, amount, orderInfo }` |
| `POST` | `/api/payment/momo/create-simple` | Tạo link thanh toán (Query params) | Query: `orderId`, `amount`, `orderInfo` |
| `GET` | `/api/payment/momo/return` | MoMo redirect về sau thanh toán | Query params từ MoMo |
| `POST` | `/api/payment/momo/notify` | MoMo callback thông báo kết quả (IPN) | JSON body từ MoMo |
| `POST` | `/api/payment/momo/ipn` | IPN alternative (form params) | Form params từ MoMo |
| `GET` | `/api/payment/momo/status/{orderId}` | Kiểm tra trạng thái thanh toán | Path: `orderId` |

### 2.2 Chi Tiết API Endpoints

#### 2.2.1 Tạo Link Thanh Toán (Chính)

```http
POST /api/payment/momo/create
Content-Type: application/json

{
  "orderId": 1,
  "amount": 300000,
  "orderInfo": "Thanh toan don hang #1"
}
```

**Response thành công:**
```json
{
  "success": true,
  "payUrl": "https://test-payment.momo.vn/gw_payment/payment/qr?partnerCode=MOMO&orderId=ORDER_1_1703123456789&...",
  "orderId": "ORDER_1_1703123456789",
  "requestId": "1703123456789",
  "message": "Tạo link thanh toán thành công"
}
```

**Response lỗi:**
```json
{
  "success": false,
  "message": "Lỗi tạo thanh toán: [chi tiết lỗi]"
}
```

#### 2.2.2 Kiểm Tra Trạng Thái Thanh Toán

```http
GET /api/payment/momo/status/1
```

**Response:**
```json
{
  "success": true,
  "orderId": 1,
  "orderStatus": "PAID",
  "paymentStatus": "SUCCESS",
  "paymentMethod": "MOMO",
  "transactionId": "ORDER_1_1703123456789",
  "amount": 300000.00,
  "paidAt": "2024-12-28T10:00:00",
  "isPaid": true,
  "totalAmount": 300000.00,
  "message": "Lấy trạng thái thanh toán thành công"
}
```

---

## 3. Chuẩn Bị Môi Trường

### 3.1 Cấu Hình Backend (Đã có sẵn)

File: `application.properties`

```properties
# MOMO PAYMENT CONFIG (Sandbox)
momo.endpoint=https://test-payment.momo.vn/gw_payment/transactionProcessor
momo.partnerCode=MOMO
momo.accessKey=F8BBA842ECF85
momo.secretKey=K951B6PE1waDMi640xX08PD3vg6EkVlz
momo.returnUrl=http://localhost:8080/api/payment/momo/return
momo.notifyUrl=http://localhost:8080/api/payment/momo/notify
momo.requestType=captureMoMoWallet
```

### 3.2 Chuẩn Bị cho Production

Khi deploy lên production, cần cập nhật:

```properties
# MOMO PAYMENT CONFIG (Production)
momo.endpoint=https://payment.momo.vn/gw_payment/transactionProcessor
momo.partnerCode=YOUR_PARTNER_CODE
momo.accessKey=YOUR_ACCESS_KEY
momo.secretKey=YOUR_SECRET_KEY
momo.returnUrl=https://your-domain.com/api/payment/momo/return
momo.notifyUrl=https://your-domain.com/api/payment/momo/notify
momo.requestType=captureMoMoWallet
```

---

## 4. Triển Khai Frontend Mobile (React Native)

### 4.1 Cài Đặt Dependencies

```bash
# Expo project
npx expo install expo-linking expo-web-browser

# Hoặc React Native CLI
npm install react-native-webview @react-native-community/async-storage
```

### 4.2 Tạo Service API MoMo

Tạo file: `services/momoService.ts`

```typescript
// services/momoService.ts
import { API_URL } from '../constants/config';

export interface CreatePaymentRequest {
  orderId: number;
  amount: number;
  orderInfo?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  payUrl?: string;
  orderId?: string;
  requestId?: string;
  message: string;
  errorCode?: number;
}

export interface PaymentStatusResponse {
  success: boolean;
  orderId: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionId: string;
  amount: number;
  paidAt: string | null;
  isPaid: boolean;
  totalAmount: number;
  message: string;
}

const MOMO_API_BASE = `${API_URL}/api/payment/momo`;

/**
 * Tạo link thanh toán MoMo
 */
export const createMomoPayment = async (
  request: CreatePaymentRequest
): Promise<CreatePaymentResponse> => {
  try {
    const response = await fetch(`${MOMO_API_BASE}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: request.orderId,
        amount: request.amount,
        orderInfo: request.orderInfo || `Thanh toan don hang #${request.orderId}`,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('MoMo Create Payment Error:', error);
    return {
      success: false,
      message: `Lỗi kết nối: ${error}`,
    };
  }
};

/**
 * Kiểm tra trạng thái thanh toán
 */
export const checkPaymentStatus = async (
  orderId: number
): Promise<PaymentStatusResponse> => {
  try {
    const response = await fetch(`${MOMO_API_BASE}/status/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('MoMo Check Status Error:', error);
    return {
      success: false,
      orderId: orderId,
      orderStatus: 'UNKNOWN',
      paymentStatus: 'UNKNOWN',
      paymentMethod: '',
      transactionId: '',
      amount: 0,
      paidAt: null,
      isPaid: false,
      totalAmount: 0,
      message: `Lỗi kết nối: ${error}`,
    };
  }
};
```

### 4.3 Hook useMoMoPayment

Tạo file: `hooks/useMoMoPayment.ts`

```typescript
// hooks/useMoMoPayment.ts
import { useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { 
  createMomoPayment, 
  checkPaymentStatus,
  CreatePaymentRequest,
  PaymentStatusResponse 
} from '../services/momoService';

interface UseMoMoPaymentResult {
  loading: boolean;
  error: string | null;
  paymentStatus: PaymentStatusResponse | null;
  initiatePayment: (request: CreatePaymentRequest) => Promise<boolean>;
  verifyPayment: (orderId: number) => Promise<PaymentStatusResponse | null>;
  resetState: () => void;
}

export const useMoMoPayment = (): UseMoMoPaymentResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);

  /**
   * Bắt đầu thanh toán MoMo
   */
  const initiatePayment = useCallback(async (request: CreatePaymentRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Bước 1: Gọi API tạo link thanh toán
      const response = await createMomoPayment(request);

      if (!response.success || !response.payUrl) {
        setError(response.message || 'Không thể tạo link thanh toán');
        setLoading(false);
        return false;
      }

      // Bước 2: Mở trình duyệt/WebView đến MoMo
      const result = await WebBrowser.openBrowserAsync(response.payUrl, {
        showTitle: true,
        enableBarCollapsing: true,
        // Đóng browser khi redirect về app
        dismissButtonStyle: 'close',
      });

      console.log('WebBrowser result:', result);

      // Bước 3: Sau khi user quay về, kiểm tra trạng thái
      if (result.type === 'cancel' || result.type === 'opened') {
        // Đợi một chút rồi kiểm tra trạng thái
        await new Promise(resolve => setTimeout(resolve, 1000));
        await verifyPayment(request.orderId);
      }

      setLoading(false);
      return true;

    } catch (err) {
      setError(`Lỗi thanh toán: ${err}`);
      setLoading(false);
      return false;
    }
  }, []);

  /**
   * Xác minh trạng thái thanh toán
   */
  const verifyPayment = useCallback(async (orderId: number): Promise<PaymentStatusResponse | null> => {
    setLoading(true);
    
    try {
      const status = await checkPaymentStatus(orderId);
      setPaymentStatus(status);
      setLoading(false);
      return status;
    } catch (err) {
      setError(`Lỗi kiểm tra trạng thái: ${err}`);
      setLoading(false);
      return null;
    }
  }, []);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    setLoading(false);
    setError(null);
    setPaymentStatus(null);
  }, []);

  return {
    loading,
    error,
    paymentStatus,
    initiatePayment,
    verifyPayment,
    resetState,
  };
};
```

### 4.4 Component Màn Hình Checkout

Tạo hoặc cập nhật file: `app/(tabs)/checkout.tsx`

```tsx
// app/(tabs)/checkout.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMoMoPayment } from '../../hooks/useMoMoPayment';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

// Icons - có thể dùng icon package hoặc image
const MoMoIcon = require('../../assets/images/momo-icon.png');

const CheckoutScreen = () => {
  const router = useRouter();
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { loading, error, paymentStatus, initiatePayment, verifyPayment } = useMoMoPayment();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'MOMO'>('COD');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Xử lý sau khi thanh toán xong
  useEffect(() => {
    if (paymentStatus) {
      if (paymentStatus.isPaid) {
        Alert.alert(
          'Thanh toán thành công! 🎉',
          `Đơn hàng #${paymentStatus.orderId} đã được thanh toán.\nSố tiền: ${formatCurrency(paymentStatus.amount)}`,
          [
            {
              text: 'Xem đơn hàng',
              onPress: () => {
                clearCart();
                router.push(`/order-status/${paymentStatus.orderId}`);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Thanh toán chưa hoàn tất',
          'Vui lòng thử lại hoặc chọn phương thức thanh toán khác.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [paymentStatus]);

  // Hiển thị lỗi
  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi', error);
    }
  }, [error]);

  /**
   * Tạo đơn hàng trên backend
   */
  const createOrder = async (): Promise<number | null> => {
    try {
      const response = await fetch(`${API_URL}/api/orders/mobile-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          items: cartItems.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            sizeId: item.sizeId,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingName: user?.name,
          shippingPhone: user?.phone,
          shippingAddress: user?.address || 'Địa chỉ giao hàng',
          paymentMethod: selectedPaymentMethod,
          totalAmount: totalAmount,
        }),
      });

      const data = await response.json();
      if (data.orderId) {
        return data.orderId;
      }
      return null;
    } catch (err) {
      console.error('Create order error:', err);
      return null;
    }
  };

  /**
   * Xử lý thanh toán MoMo
   */
  const handleMoMoPayment = async () => {
    setIsProcessing(true);

    // Bước 1: Tạo đơn hàng trước
    const newOrderId = await createOrder();
    if (!newOrderId) {
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      setIsProcessing(false);
      return;
    }

    setOrderId(newOrderId);

    // Bước 2: Gọi MoMo Payment
    const success = await initiatePayment({
      orderId: newOrderId,
      amount: totalAmount,
      orderInfo: `Thanh toan don hang #${newOrderId} - ${user?.name || 'Khách hàng'}`,
    });

    if (!success) {
      Alert.alert('Lỗi', 'Không thể kết nối đến MoMo. Vui lòng thử lại.');
    }

    setIsProcessing(false);
  };

  /**
   * Xử lý thanh toán COD
   */
  const handleCODPayment = async () => {
    setIsProcessing(true);

    const newOrderId = await createOrder();
    if (newOrderId) {
      Alert.alert(
        'Đặt hàng thành công!',
        `Đơn hàng #${newOrderId} đã được tạo.\nVui lòng thanh toán khi nhận hàng.`,
        [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              router.push(`/order-status/${newOrderId}`);
            },
          },
        ]
      );
    } else {
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng.');
    }

    setIsProcessing(false);
  };

  /**
   * Xử lý nút đặt hàng
   */
  const handlePlaceOrder = () => {
    if (selectedPaymentMethod === 'MOMO') {
      handleMoMoPayment();
    } else {
      handleCODPayment();
    }
  };

  /**
   * Kiểm tra lại trạng thái thanh toán
   */
  const handleCheckPaymentStatus = async () => {
    if (orderId) {
      await verifyPayment(orderId);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
        <View style={styles.summaryRow}>
          <Text>Tổng sản phẩm:</Text>
          <Text>{cartItems.length} sản phẩm</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

        {/* COD Option */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            selectedPaymentMethod === 'COD' && styles.paymentOptionSelected,
          ]}
          onPress={() => setSelectedPaymentMethod('COD')}
        >
          <View style={styles.radioCircle}>
            {selectedPaymentMethod === 'COD' && <View style={styles.radioSelected} />}
          </View>
          <Text style={styles.paymentLabel}>💵 Thanh toán khi nhận hàng (COD)</Text>
        </TouchableOpacity>

        {/* MoMo Option */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            selectedPaymentMethod === 'MOMO' && styles.paymentOptionSelected,
          ]}
          onPress={() => setSelectedPaymentMethod('MOMO')}
        >
          <View style={styles.radioCircle}>
            {selectedPaymentMethod === 'MOMO' && <View style={styles.radioSelected} />}
          </View>
          <View style={styles.momoLabelContainer}>
            <Image source={MoMoIcon} style={styles.momoIcon} />
            <Text style={styles.paymentLabel}>Ví MoMo</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* MoMo Info */}
      {selectedPaymentMethod === 'MOMO' && (
        <View style={styles.momoInfo}>
          <Text style={styles.momoInfoText}>
            ℹ️ Bạn sẽ được chuyển đến ứng dụng MoMo để thanh toán.
          </Text>
        </View>
      )}

      {/* Place Order Button */}
      <TouchableOpacity
        style={[styles.placeOrderButton, (loading || isProcessing) && styles.buttonDisabled]}
        onPress={handlePlaceOrder}
        disabled={loading || isProcessing}
      >
        {(loading || isProcessing) ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderButtonText}>
            {selectedPaymentMethod === 'MOMO' ? '💳 Thanh toán với MoMo' : '✓ Đặt hàng'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Check Payment Status Button (hiện khi đã có orderId) */}
      {orderId && (
        <TouchableOpacity
          style={styles.checkStatusButton}
          onPress={handleCheckPaymentStatus}
          disabled={loading}
        >
          <Text style={styles.checkStatusButtonText}>
            🔄 Kiểm tra trạng thái thanh toán
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

// Helper function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const API_URL = 'http://10.0.2.2:8080'; // Android Emulator
// const API_URL = 'http://localhost:8080'; // iOS Simulator

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentOptionSelected: {
    borderColor: '#E91E63',
    backgroundColor: '#FFF0F5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E91E63',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E91E63',
  },
  paymentLabel: {
    fontSize: 16,
  },
  momoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  momoIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  momoInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  momoInfoText: {
    color: '#1976D2',
    fontSize: 14,
  },
  placeOrderButton: {
    backgroundColor: '#E91E63',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkStatusButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E91E63',
  },
  checkStatusButtonText: {
    color: '#E91E63',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
```

---

## 5. Luồng Thanh Toán Chi Tiết

### 5.1 Sequence Diagram

```
┌─────────┐          ┌─────────┐          ┌─────────┐          ┌─────────┐
│ Mobile  │          │ Backend │          │  MoMo   │          │ MoMo    │
│   App   │          │ Spring  │          │   API   │          │  App    │
└────┬────┘          └────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │                    │
     │ 1. POST /create    │                    │                    │
     │ {orderId, amount}  │                    │                    │
     │───────────────────▶│                    │                    │
     │                    │                    │                    │
     │                    │ 2. POST transactionProcessor             │
     │                    │ {signature, ...}   │                    │
     │                    │───────────────────▶│                    │
     │                    │                    │                    │
     │                    │ 3. {payUrl}        │                    │
     │                    │◀───────────────────│                    │
     │                    │                    │                    │
     │ 4. {payUrl}        │                    │                    │
     │◀───────────────────│                    │                    │
     │                    │                    │                    │
     │ 5. Open WebBrowser │                    │                    │
     │    (payUrl)        │                    │                    │
     │──────────────────────────────────────────────────────────────▶
     │                    │                    │                    │
     │                    │                    │ 6. User pays       │
     │                    │                    │◀───────────────────│
     │                    │                    │                    │
     │                    │ 7. POST /notify    │                    │
     │                    │ (IPN callback)     │                    │
     │                    │◀───────────────────│                    │
     │                    │                    │                    │
     │ 8. Deep Link Return│                    │                    │
     │◀──────────────────────────────────────────────────────────────
     │                    │                    │                    │
     │ 9. GET /status/{id}│                    │                    │
     │───────────────────▶│                    │                    │
     │                    │                    │                    │
     │ 10. {isPaid: true} │                    │                    │
     │◀───────────────────│                    │                    │
     │                    │                    │                    │
```

### 5.2 Chi Tiết Các Bước

| Bước | Hành động | Chi tiết |
|------|-----------|----------|
| 1 | Mobile gọi API tạo payment | `POST /api/payment/momo/create` với `orderId`, `amount` |
| 2 | Backend gọi MoMo API | Tạo signature, gửi đến `test-payment.momo.vn` |
| 3 | MoMo trả về `payUrl` | URL để user thanh toán |
| 4 | Backend trả `payUrl` cho Mobile | Mobile nhận URL |
| 5 | Mobile mở WebBrowser | Dùng `expo-web-browser` mở `payUrl` |
| 6 | User thanh toán | Trong app MoMo hoặc web MoMo |
| 7 | MoMo gọi IPN callback | Backend cập nhật trạng thái đơn hàng |
| 8 | MoMo redirect về app | Qua `returnUrl` hoặc deep link |
| 9 | Mobile kiểm tra trạng thái | `GET /api/payment/momo/status/{orderId}` |
| 10 | Hiển thị kết quả | Thành công hoặc thất bại |

---

## 6. Xử Lý Deep Link

### 6.1 Cấu Hình Deep Link (Expo)

File: `app.json`

```json
{
  "expo": {
    "name": "ShoeShop",
    "scheme": "shoeshop",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "shoeshop",
              "host": "payment",
              "pathPrefix": "/return"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "associatedDomains": [
        "applinks:your-domain.com"
      ]
    }
  }
}
```

### 6.2 Xử Lý Deep Link trong App

File: `app/_layout.tsx` hoặc `App.tsx`

```tsx
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Xử lý khi app mở từ deep link
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      
      if (path?.includes('payment/return')) {
        // MoMo redirect về
        const resultCode = queryParams?.resultCode;
        const orderId = queryParams?.orderId;
        
        if (resultCode === '0') {
          // Thanh toán thành công
          router.push(`/payment-success?orderId=${orderId}`);
        } else {
          // Thanh toán thất bại
          router.push(`/payment-failed?orderId=${orderId}`);
        }
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  // ... rest of layout
}
```

### 6.3 Cập Nhật Backend ReturnUrl cho Mobile

Trong `application.properties`, cập nhật:

```properties
# Cho Mobile App (Deep Link)
momo.returnUrl=shoeshop://payment/return

# Hoặc giữ nguyên backend và redirect từ backend về deep link
momo.returnUrl=http://localhost:8080/api/payment/momo/return
```

Trong `MomoPaymentController.java`, thêm redirect:

```java
@GetMapping("/return")
public ResponseEntity<?> returnPayment(@RequestParam Map<String, String> params) {
    Map<String, Object> result = momoService.handleReturn(params);
    
    // Redirect về mobile app
    String deepLink = "shoeshop://payment/return?" 
        + "resultCode=" + params.get("resultCode")
        + "&orderId=" + params.get("orderId")
        + "&transId=" + params.get("transId");
    
    return ResponseEntity.status(302)
        .header("Location", deepLink)
        .build();
}
```

---

## 7. Test và Debug

### 7.1 Tài Khoản Test MoMo Sandbox

| Thông tin | Giá trị |
|-----------|---------|
| Số điện thoại test | `0909000000` - `0909000999` |
| Mật khẩu | Bất kỳ |
| OTP | `000000` |
| Kết quả | Luôn thành công |

### 7.2 Test Cases

```markdown
## TC-01: Tạo thanh toán thành công
1. Chọn sản phẩm → Thêm vào giỏ hàng
2. Vào Checkout → Chọn MoMo
3. Nhấn "Thanh toán với MoMo"
4. Expected: Mở WebBrowser với URL MoMo

## TC-02: Thanh toán thành công
1. Sau TC-01, nhập số test `0909000000`
2. Nhập OTP `000000`
3. Expected: Redirect về app, hiện "Thanh toán thành công"

## TC-03: Kiểm tra trạng thái
1. Sau TC-02, nhấn "Kiểm tra trạng thái thanh toán"
2. Expected: isPaid = true, paymentStatus = SUCCESS

## TC-04: Hủy thanh toán
1. Trong MoMo, nhấn Cancel
2. Expected: Quay về app, trạng thái PENDING
```

### 7.3 Debug Commands

```bash
# Kiểm tra API backend
curl -X POST http://localhost:8080/api/payment/momo/create \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1, "amount": 50000, "orderInfo": "Test payment"}'

# Kiểm tra trạng thái
curl http://localhost:8080/api/payment/momo/status/1
```

---

## 8. Troubleshooting

### 8.1 Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `Network request failed` | Không kết nối được backend | Kiểm tra IP, port, CORS |
| `errorCode: 37` | Sai signature | Kiểm tra `secretKey`, thứ tự params |
| `errorCode: 4` | Số tiền không hợp lệ | Amount phải > 0, <= 50,000,000 |
| `Không mở được MoMo` | Thiếu `expo-web-browser` | Chạy `npx expo install expo-web-browser` |
| `Deep link không hoạt động` | Sai cấu hình scheme | Kiểm tra `app.json` |

### 8.2 Android Emulator Network

```typescript
// config.ts
export const API_URL = Platform.select({
  android: 'http://10.0.2.2:8080', // Android Emulator
  ios: 'http://localhost:8080',    // iOS Simulator
  default: 'http://192.168.1.xxx:8080', // Real device (thay bằng IP máy)
});
```

### 8.3 Logs Debug

```typescript
// Thêm vào momoService.ts
console.log('=== MOMO DEBUG ===');
console.log('Request:', JSON.stringify(request, null, 2));
console.log('Response:', JSON.stringify(response, null, 2));
console.log('==================');
```

---

## 9. Checklist Triển Khai

### ✅ Backend (Đã hoàn thành)

- [x] `MomoConfig.java` - Cấu hình MoMo
- [x] `MomoService.java` - Logic thanh toán
- [x] `MomoPaymentController.java` - API endpoints
- [x] `MomoRequest.java` - DTO request
- [x] `MomoCreatePaymentResponse.java` - DTO response
- [x] `MomoCallbackResponse.java` - DTO callback
- [x] `HmacUtil.java` - Utility ký SHA256
- [x] `Payment.java` - Entity database
- [x] `PaymentRepository.java` - Repository
- [x] `schema.sql` - Table payments
- [x] `application.properties` - Cấu hình sandbox
- [x] `SecurityConfig.java` - Cho phép API public

### 📋 Frontend Mobile (Cần triển khai)

- [ ] Cài đặt `expo-web-browser`, `expo-linking`
- [ ] Tạo `services/momoService.ts`
- [ ] Tạo `hooks/useMoMoPayment.ts`
- [ ] Cập nhật `checkout.tsx` với option MoMo
- [ ] Cấu hình Deep Link trong `app.json`
- [ ] Xử lý Deep Link trong `_layout.tsx`
- [ ] Thêm icon MoMo vào assets
- [ ] Test trên Android Emulator
- [ ] Test trên iOS Simulator
- [ ] Test trên thiết bị thật

### 🚀 Production (Khi deploy)

- [ ] Đăng ký tài khoản MoMo Business
- [ ] Lấy Production credentials
- [ ] Cập nhật `application.properties` với Production keys
- [ ] Cấu hình `returnUrl` và `notifyUrl` với domain thật
- [ ] Test end-to-end trên Production

---

## 📞 Liên Hệ Hỗ Trợ

- **MoMo Developer Portal**: https://developers.momo.vn/
- **MoMo Sandbox Documentation**: https://developers.momo.vn/v2/docs/en/docs/payment-flows/

---

*Tài liệu được tạo: 28/12/2024*
*Phiên bản: 1.0*
