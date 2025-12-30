 SYSTEM PROMPT: KỸ SƯ FULL-STACK AGENT
1. ĐỊNH DANH
Bạn là Kỹ sư Full-stack, làm việc như một nhà thầu thi công phần mềm chuyên nghiệp. Bạn tuân thủ nghiêm ngặt Bộ Quy chuẩn kỹ thuật được định nghĩa trong tài liệu này.
Nguyên tắc làm việc:

Làm đúng yêu cầu, không tự ý mở rộng scope
Hỏi lại khi yêu cầu mơ hồ
Giải thích rõ ràng mọi quyết định kỹ thuật
Đảm bảo code có thể bảo trì lâu dài
2. PHÂN LOẠI NHIỆM VỤ
Khi nhận yêu cầu, BẮT BUỘC xác định thuộc 1 trong 4 loại:
Ký hiệuLoạiMô tả🔍TƯ VẤNHỏi ý kiến, so sánh phương án, đề xuất giải pháp🏗️XÂY MỚITạo feature, component, module, page mới🔧SỬA LỖIFix bug, error, hành vi không đúng mong đợi⚡TỐI ƯUCải thiện performance, refactor, clean code

CHẾ ĐỘ SỬA LỖI (Debug Mode)
Mục tiêu: Tìm đúng nguyên nhân, sửa đúng chỗ, phòng ngừa tái phát.
Quy trình:

Thu thập thông tin: lỗi gì, ở đâu, khi nào, tái hiện thế nào
Phân tích nguyên nhân gốc (root cause)
Đề xuất cách sửa + giải thích
Đề xuất cách phòng ngừa
CHẾ ĐỘ XÂY MỚI (Build Mode)
Mục tiêu: Tạo code mới đúng chuẩn, dễ bảo trì.

 CHẾ ĐỘ TỐI ƯU (Optimize Mode)
Mục tiêu: Cải thiện chất lượng mà không thay đổi hành vi.
Quy trình:

Đo lường hiện trạng (baseline)
Xác định bottleneck chính
Đề xuất cải tiến + dự đoán kết quả
Refactor + so sánh trước/sau
 
 Hướng Dẫn Triển Khai Frontend
Tài liệu này hướng dẫn chi tiết từng bước triển khai các tính năng cho:




DiDong2_Shoeshop - Mobile App (React Native/Expo)
test-admin - Admin Panel (React-Admin/Vite)
📋 Tổng Quan Các Phase
Phase	Tính năng	Mobile App	Admin Panel
1	Authentication	✅ Login/Register	✅ Admin Login
2	Products	✅ Hiển thị/Tìm kiếm	✅ CRUD quản lý
3	Categories	✅ Lọc theo danh mục	✅ CRUD quản lý
4	Cart	✅ Thêm/Xóa/Cập nhật	❌ Không cần
5	Orders	✅ Đặt hàng/Xem lịch sử	✅ Quản lý đơn hàng
6	User Profile	✅ Thông tin/Địa chỉ	✅ Quản lý users
7	Vouchers	✅ Áp dụng mã giảm giá	✅ CRUD quản lý
🚀 Phase 1: Authentication
Mobile App - services/api.ts
// DiDong2_Shoeshop/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = 'http://192.168.1.10:8080/api'; // Thay IP của bạn
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Interceptor: Tự động thêm token vào mỗi request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Interceptor: Xử lý lỗi 401 (token hết hạn)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);
export default api;
Mobile App - services/authService.ts
// DiDong2_Shoeshop/services/authService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
export interface LoginResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN';
}
export const authService = {
  // Đăng ký
  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  // Đăng nhập
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    const { token, ...user } = response.data;
    
    // Lưu token và user info
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },
  // Đăng xuất
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },
  // Lấy thông tin user từ token
  getCurrentUser: async (): Promise<LoginResponse | null> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch {
      return null;
    }
  },
  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },
  // Lấy user đã lưu
  getStoredUser: async (): Promise<any | null> => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
Admin Panel - src/authProvider.ts
// test-admin/src/authProvider.ts
import { AuthProvider } from 'react-admin';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });
    if (!response.ok) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    const data = await response.json();
    
    // Kiểm tra role ADMIN
    if (data.role !== 'ADMIN') {
      throw new Error('Bạn không có quyền truy cập Admin');
    }
    
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data));
  },
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    return Promise.resolve();
  },
  checkAuth: () => {
    return localStorage.getItem('adminToken')
      ? Promise.resolve()
      : Promise.reject();
  },
  checkError: (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('adminToken');
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getPermissions: () => {
    const user = localStorage.getItem('adminUser');
    return user ? Promise.resolve(JSON.parse(user).role) : Promise.reject();
  },
  getIdentity: () => {
    const user = localStorage.getItem('adminUser');
    if (user) {
      const parsed = JSON.parse(user);
      return Promise.resolve({
        id: parsed.id,
        fullName: parsed.name,
        avatar: undefined,
      });
    }
    return Promise.reject();
  },
};
📦 Phase 2: Products
Mobile App - services/productService.ts
// DiDong2_Shoeshop/services/productService.ts
import api from './api';
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  priceRoot?: number;
  brand: string;
  gender: 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';
  sku: string;
  status: 'ACTIVE' | 'INACTIVE';
  categoryId: number;
  photo: string;
  qty: number;
  slug: string;
  createdAt: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
}
export interface ProductVariant {
  id: number;
  color: string;
  colorCode: string;
  sizes: ProductSize[];
}
export interface ProductSize {
  id: number;
  size: string;
  stock: number;
  price?: number;
}
export interface ProductImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
}
export const productService = {
  // Lấy danh sách sản phẩm
  getAll: async (params?: {
    categoryId?: number;
    page?: number;
    size?: number;
  }): Promise<Product[]> => {
    const response = await api.get('/products', { params });
    return response.data.content || response.data;
  },
  // Lấy chi tiết sản phẩm
  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  // Lấy chi tiết với variants
  getDetail: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}/detail`);
    return response.data;
  },
  // Tìm kiếm
  search: async (query: string, categoryId?: number): Promise<Product[]> => {
    const response = await api.get('/products/search', {
      params: { q: query, categoryId },
    });
    return response.data;
  },
  // Lọc theo category
  getByCategory: async (categoryId: number, page = 0, size = 10): Promise<Product[]> => {
    const response = await api.get(`/products/category/${categoryId}`, {
      params: { page, size },
    });
    return response.data.content || response.data;
  },
  // Lọc theo brand
  getByBrand: async (brand: string): Promise<Product[]> => {
    const response = await api.get(`/products/brand/${brand}`);
    return response.data.content || response.data;
  },
  // Lọc theo giá
  getByPriceRange: async (minPrice: number, maxPrice: number): Promise<Product[]> => {
    const response = await api.get('/products/price-range', {
      params: { minPrice, maxPrice },
    });
    return response.data;
  },
  // Sản phẩm mới nhất
  getNewest: async (limit = 10): Promise<Product[]> => {
    const response = await api.get('/products/newest', { params: { limit } });
    return response.data;
  },
  // Sản phẩm bán chạy
  getBestSellers: async (limit = 10): Promise<Product[]> => {
    const response = await api.get('/products/best-sellers', { params: { limit } });
    return response.data;
  },
  // Lấy tất cả brands
  getBrands: async (): Promise<string[]> => {
    const response = await api.get('/products/brands');
    return response.data;
  },
};
Admin Panel - src/products.tsx
// test-admin/src/products.tsx
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  EditButton,
  DeleteButton,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  SelectInput,
  ReferenceInput,
  ImageField,
  useRecordContext,
} from 'react-admin';
// Danh sách sản phẩm
export const ProductList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <ImageField source="photo" label="Ảnh" />
      <TextField source="title" label="Tên sản phẩm" />
      <NumberField source="price" label="Giá" options={{ style: 'currency', currency: 'VND' }} />
      <TextField source="brand" label="Thương hiệu" />
      <TextField source="gender" label="Giới tính" />
      <TextField source="status" label="Trạng thái" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);
// Chỉnh sửa sản phẩm
export const ProductEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" label="Tên sản phẩm" fullWidth />
      <TextInput source="description" label="Mô tả" multiline rows={4} fullWidth />
      <NumberInput source="price" label="Giá bán" />
      <NumberInput source="priceRoot" label="Giá gốc" />
      <TextInput source="brand" label="Thương hiệu" />
      <SelectInput source="gender" label="Giới tính" choices={[
        { id: 'MEN', name: 'Nam' },
        { id: 'WOMEN', name: 'Nữ' },
        { id: 'KIDS', name: 'Trẻ em' },
        { id: 'UNISEX', name: 'Unisex' },
      ]} />
      <ReferenceInput source="categoryId" reference="categories" label="Danh mục">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <SelectInput source="status" label="Trạng thái" choices={[
        { id: 'ACTIVE', name: 'Đang bán' },
        { id: 'INACTIVE', name: 'Ngừng bán' },
      ]} />
      <TextInput source="photo" label="URL ảnh" fullWidth />
      <NumberInput source="qty" label="Số lượng" />
    </SimpleForm>
  </Edit>
);
// Tạo sản phẩm mới
export const ProductCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" label="Tên sản phẩm" fullWidth required />
      <TextInput source="description" label="Mô tả" multiline rows={4} fullWidth />
      <NumberInput source="price" label="Giá bán" required />
      <NumberInput source="priceRoot" label="Giá gốc" />
      <TextInput source="brand" label="Thương hiệu" />
      <SelectInput source="gender" label="Giới tính" choices={[
        { id: 'MEN', name: 'Nam' },
        { id: 'WOMEN', name: 'Nữ' },
        { id: 'KIDS', name: 'Trẻ em' },
        { id: 'UNISEX', name: 'Unisex' },
      ]} />
      <ReferenceInput source="categoryId" reference="categories" label="Danh mục">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <TextInput source="photo" label="URL ảnh" fullWidth />
      <NumberInput source="qty" label="Số lượng" defaultValue={0} />
    </SimpleForm>
  </Create>
);
🛒 Phase 3: Cart (Mobile App)
Mobile App - services/cartService.ts
// DiDong2_Shoeshop/services/cartService.ts
import api from './api';
export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  size: string;
  quantity: number;
  price: number;
}
export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalPrice: number;
  itemCount: number;
}
export interface AddToCartRequest {
  userId: number;
  productId: number;
  size: string;
  quantity: number;
  price: number;
}
export const cartService = {
  // Lấy giỏ hàng của user
  getCart: async (userId: number): Promise<Cart> => {
    const response = await api.get(`/carts/user/${userId}`);
    return response.data;
  },
  // Thêm vào giỏ hàng
  addToCart: async (data: AddToCartRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/carts/add', data);
    return response.data;
  },
  // Cập nhật số lượng
  updateQuantity: async (itemId: number, quantity: number): Promise<void> => {
    await api.put(`/carts/items/${itemId}`, { quantity });
  },
  // Xóa item khỏi giỏ
  removeItem: async (itemId: number): Promise<void> => {
    await api.delete(`/carts/items/${itemId}`);
  },
  // Xóa toàn bộ giỏ hàng
  clearCart: async (userId: number): Promise<void> => {
    await api.delete(`/carts/user/${userId}/clear`);
  },
  // Lấy số lượng items
  getItemCount: async (userId: number): Promise<number> => {
    const response = await api.get(`/carts/user/${userId}/count`);
    return response.data.count;
  },
  // Lấy tổng tiền
  getTotal: async (userId: number): Promise<number> => {
    const response = await api.get(`/carts/user/${userId}/total`);
    return response.data.total;
  },
};
📋 Phase 4: Orders
Mobile App - services/orderService.ts
// DiDong2_Shoeshop/services/orderService.ts
import api from './api';
export interface OrderItem {
  productId: number;
  productName: string;
  productImage: string;
  size: string;
  quantity: number;
  price: number;
}
export interface MobileCheckoutRequest {
  userId: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  paymentMethod: 'COD' | 'MOMO' | 'BANKING';
  note?: string;
  voucherCode?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
}
export interface Order {
  orderId: number;
  orderCode: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  paymentMethod: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  note: string;
  items: OrderItem[];
  createdAt: string;
}
export const orderService = {
  // Đặt hàng (Mobile)
  mobileCheckout: async (data: MobileCheckoutRequest): Promise<Order> => {
    const response = await api.post('/orders/mobile-checkout', data);
    return response.data;
  },
  // Lấy danh sách đơn hàng của user
  getByUser: async (userId: number, status?: string): Promise<Order[]> => {
    const response = await api.get(`/orders/user/${userId}`, {
      params: status ? { status } : {},
    });
    return response.data;
  },
  // Lấy chi tiết đơn hàng
  getById: async (orderId: number): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}/detail`);
    return response.data;
  },
  // Tìm đơn hàng theo mã
  getByCode: async (orderCode: string): Promise<Order> => {
    const response = await api.get(`/orders/code/${orderCode}`);
    return response.data;
  },
  // Hủy đơn hàng
  cancel: async (orderId: number): Promise<void> => {
    await api.post(`/orders/${orderId}/cancel`);
  },
};
Admin Panel - src/orders.tsx
// test-admin/src/orders.tsx
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  EditButton,
  Edit,
  SimpleForm,
  SelectInput,
  Show,
  SimpleShowLayout,
  ArrayField,
  ChipField,
} from 'react-admin';
// Hiển thị màu status
const StatusField = () => {
  const record = useRecordContext();
  const colors: Record<string, string> = {
    PENDING: '#FFA500',
    CONFIRMED: '#007BFF',
    PROCESSING: '#9C27B0',
    SHIPPING: '#17A2B8',
    DELIVERED: '#28A745',
    COMPLETED: '#4CAF50',
    CANCELLED: '#DC3545',
  };
  return (
    <ChipField 
      source="status" 
      style={{ backgroundColor: colors[record?.status] || '#999', color: 'white' }} 
    />
  );
};
// Danh sách đơn hàng
export const OrderList = () => (
  <List sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid rowClick="show">
      <TextField source="orderId" label="ID" />
      <TextField source="orderCode" label="Mã đơn" />
      <TextField source="shippingName" label="Khách hàng" />
      <NumberField source="totalAmount" label="Tổng tiền" options={{ style: 'currency', currency: 'VND' }} />
      <StatusField />
      <TextField source="paymentMethod" label="Thanh toán" />
      <DateField source="createdAt" label="Ngày đặt" showTime />
      <EditButton />
    </Datagrid>
  </List>
);
// Cập nhật trạng thái đơn hàng
export const OrderEdit = () => (
  <Edit>
    <SimpleForm>
      <TextField source="orderCode" label="Mã đơn hàng" />
      <TextField source="shippingName" label="Tên khách hàng" />
      <TextField source="shippingPhone" label="Số điện thoại" />
      <TextField source="shippingAddress" label="Địa chỉ" />
      <SelectInput source="status" label="Trạng thái" choices={[
        { id: 'PENDING', name: 'Chờ xử lý' },
        { id: 'CONFIRMED', name: 'Đã xác nhận' },
        { id: 'PROCESSING', name: 'Đang xử lý' },
        { id: 'SHIPPING', name: 'Đang giao' },
        { id: 'DELIVERED', name: 'Đã giao' },
        { id: 'COMPLETED', name: 'Hoàn thành' },
        { id: 'CANCELLED', name: 'Đã hủy' },
      ]} />
    </SimpleForm>
  </Edit>
);
// Chi tiết đơn hàng
export const OrderShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="orderCode" label="Mã đơn hàng" />
      <TextField source="shippingName" label="Tên khách hàng" />
      <TextField source="shippingPhone" label="Số điện thoại" />
      <TextField source="shippingAddress" label="Địa chỉ" />
      <TextField source="status" label="Trạng thái" />
      <NumberField source="totalAmount" label="Tổng tiền" options={{ style: 'currency', currency: 'VND' }} />
      <TextField source="paymentMethod" label="Phương thức thanh toán" />
      <TextField source="note" label="Ghi chú" />
      <DateField source="createdAt" label="Ngày đặt" showTime />
      <ArrayField source="items" label="Sản phẩm">
        <Datagrid>
          <TextField source="productName" label="Tên" />
          <TextField source="size" label="Size" />
          <NumberField source="quantity" label="SL" />
          <NumberField source="price" label="Giá" options={{ style: 'currency', currency: 'VND' }} />
        </Datagrid>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
);
🎟️ Phase 5: Vouchers
Mobile App - services/voucherService.ts
// DiDong2_Shoeshop/services/voucherService.ts
import api from './api';
export interface Voucher {
  id: number;
  code: string;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  minOrderAmount: number;
  maxDiscountAmount: number;
  expiryDate: string;
  description: string;
}
export interface VoucherCheckResult {
  valid: boolean;
  message: string;
  voucher?: Voucher;
  discountAmount?: number;
  finalTotal?: number;
}
export const voucherService = {
  // Lấy vouchers còn hiệu lực
  getPublicVouchers: async (): Promise<Voucher[]> => {
    const response = await api.get('/vouchers/public');
    return response.data;
  },
  // Lấy vouchers áp dụng được cho đơn hàng
  getApplicable: async (orderAmount: number): Promise<Voucher[]> => {
    const response = await api.get('/vouchers/applicable', {
      params: { orderAmount },
    });
    return response.data;
  },
  // Kiểm tra mã voucher
  check: async (code: string, total: number): Promise<VoucherCheckResult> => {
    try {
      const response = await api.get('/vouchers/check', {
        params: { code, total },
      });
      return response.data;
    } catch (error: any) {
      return {
        valid: false,
        message: error.response?.data?.message || 'Mã giảm giá không hợp lệ',
      };
    }
  },
  // Tính tiền giảm
  calculateDiscount: async (code: string, orderAmount: number): Promise<{
    discountAmount: number;
    finalAmount: number;
  }> => {
    const response = await api.get('/vouchers/calculate', {
      params: { code, orderAmount },
    });
    return response.data;
  },
};
👤 Phase 6: User Profile
Mobile App - services/userService.ts
// DiDong2_Shoeshop/services/userService.ts
import api from './api';
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}
export interface UserAddress {
  id: number;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  isDefault: boolean;
}
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}
export interface AddressRequest {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  isDefault?: boolean;
}
export const userService = {
  // Lấy thông tin profile
  getProfile: async (userId: number): Promise<User> => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },
  // Cập nhật profile
  updateProfile: async (userId: number, data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },
  // Lấy danh sách địa chỉ
  getAddresses: async (userId: number): Promise<UserAddress[]> => {
    const response = await api.get(`/users/${userId}/addresses`);
    return response.data;
  },
  // Thêm địa chỉ
  addAddress: async (userId: number, data: AddressRequest): Promise<UserAddress> => {
    const response = await api.post(`/users/${userId}/addresses`, data);
    return response.data;
  },
  // Cập nhật địa chỉ
  updateAddress: async (userId: number, addressId: number, data: AddressRequest): Promise<UserAddress> => {
    const response = await api.put(`/users/${userId}/addresses/${addressId}`, data);
    return response.data;
  },
  // Xóa địa chỉ
  deleteAddress: async (userId: number, addressId: number): Promise<void> => {
    await api.delete(`/users/${userId}/addresses/${addressId}`);
  },
  // Đặt địa chỉ mặc định
  setDefaultAddress: async (userId: number, addressId: number): Promise<void> => {
    await api.put(`/users/${userId}/addresses/${addressId}/default`);
  },
  // Đổi mật khẩu
  changePassword: async (userId: number, oldPassword: string, newPassword: string): Promise<void> => {
    await api.post(`/users/${userId}/change-password`, {
      oldPassword,
      newPassword,
    });
  },
};
🛠️ Admin Panel - App.tsx
// test-admin/src/App.tsx
import { Admin, Resource } from 'react-admin';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { ProductList, ProductEdit, ProductCreate } from './products';
import { CategoryList, CategoryEdit, CategoryCreate } from './categories';
import { OrderList, OrderEdit, OrderShow } from './orders';
import { UserList, UserEdit, UserShow } from './users';
import { VoucherList, VoucherEdit, VoucherCreate } from './vouchers';
// Icons
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    <Resource 
      name="products" 
      list={ProductList} 
      edit={ProductEdit} 
      create={ProductCreate}
      icon={ShoppingBagIcon}
      options={{ label: 'Sản phẩm' }}
    />
    <Resource 
      name="categories" 
      list={CategoryList} 
      edit={CategoryEdit} 
      create={CategoryCreate}
      icon={CategoryIcon}
      options={{ label: 'Danh mục' }}
    />
    <Resource 
      name="orders" 
      list={OrderList} 
      edit={OrderEdit} 
      show={OrderShow}
      icon={ShoppingCartIcon}
      options={{ label: 'Đơn hàng' }}
    />
    <Resource 
      name="users" 
      list={UserList}
      edit={UserEdit}
      show={UserShow}
      icon={PeopleIcon}
      options={{ label: 'Người dùng' }}
    />
    <Resource 
      name="vouchers" 
      list={VoucherList} 
      edit={VoucherEdit} 
      create={VoucherCreate}
      icon={ConfirmationNumberIcon}
      options={{ label: 'Vouchers' }}
    />
  </Admin>
);
export default App;
✅ Checklist Triển Khai
Mobile App (DiDong2_Shoeshop)
 Phase 1: Authentication

 Tạo services/api.ts
 Tạo services/authService.ts
 Tạo context/AuthContext.tsx
 Tạo màn hình Login
 Tạo màn hình Register
 Phase 2: Products

 Tạo services/productService.ts
 Tạo màn hình Home (danh sách sản phẩm)
 Tạo màn hình ProductDetail
 Tạo màn hình Search
 Phase 3: Cart

 Tạo services/cartService.ts
 Tạo context/CartContext.tsx
 Tạo màn hình Cart
 Phase 4: Orders

 Tạo services/orderService.ts
 Tạo màn hình Checkout
 Tạo màn hình OrderHistory
 Tạo màn hình OrderDetail
 Phase 5: Profile

 Tạo services/userService.ts
 Tạo màn hình Profile
 Tạo màn hình EditProfile
 Tạo màn hình Addresses
Admin Panel (test-admin)
 Phase 1: Authentication

 Cấu hình authProvider.ts
 Cấu hình dataProvider.ts
 Phase 2: Products

 Tạo products.tsx (List, Edit, Create)
 Phase 3: Categories

 Tạo categories.tsx
 Phase 4: Orders

 Tạo orders.tsx
 Phase 5: Users

 Tạo users.tsx
 Phase 6: Vouchers

 Tạo vouchers.tsx
📝 Ghi Chú
Thay IP: Thay 192.168.1.10 bằng IP máy tính của bạn (chạy ipconfig)
Token: Luôn lưu token sau khi login và gửi kèm trong header
Error handling: Luôn bọc các API call trong try-catch
Loading states: Hiển thị loading khi đang fetch data
Offline support: Có thể cache data với AsyncStorage (mobile) hoặc localStorage (web)
