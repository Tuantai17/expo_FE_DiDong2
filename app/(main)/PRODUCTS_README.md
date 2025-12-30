# Product Filtering Fix - Hướng dẫn

## Các thay đổi đã thực hiện

### 1. Backend - ProductRepository.java
Đã thay đổi queries sang **Native SQL** để truy cập trực tiếp column `category_id`:

```java
// Tìm sản phẩm theo category và không bị xóa - sử dụng Native Query
@Query(value = "SELECT * FROM products p WHERE p.category_id = :categoryId AND (p.deleted = 0 OR p.deleted IS NULL)", nativeQuery = true)
List<Product> findByCategoryIdAndNotDeleted(@Param("categoryId") Long categoryId);

// Tìm kiếm sản phẩm theo title và category - sử dụng Native Query  
@Query(value = "SELECT * FROM products p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) AND p.category_id = :categoryId AND (p.deleted = 0 OR p.deleted IS NULL)", nativeQuery = true)
List<Product> searchByTitleAndCategory(@Param("keyword") String keyword, @Param("categoryId") Long categoryId);
```

### 2. Backend - ProductServiceImpl.java
Đã thêm debug logs để theo dõi:

```java
System.out.println("[ProductService] getActive called with categoryId: " + categoryId);
System.out.println("[ProductService] Found " + products.size() + " products for categoryId " + categoryId);
```

### 3. Backend - Product.java Entity
Đã bỏ `@JsonIgnore` cho category để include trong JSON response:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "category_id")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
private Category category;
```

## Hướng dẫn test

### Bước 1: Khởi động lại Backend

**Dừng server hiện tại** (nếu đang chạy) và chạy lại:

```bash
cd ADMIN_DiDong/demo

# Option 1: Sử dụng Maven Wrapper
./mvnw spring-boot:run

# Option 2: Sử dụng Maven
mvn spring-boot:run

# Option 3: Sử dụng IDE (IntelliJ/Eclipse)
# Click nút Run trên file DemoApplication.java
```

### Bước 2: Kiểm tra API trực tiếp

Mở browser và test các endpoints:

1. **Lấy tất cả sản phẩm:**
   ```
   http://localhost:8080/api/products
   ```

2. **Lấy sản phẩm theo category (ví dụ categoryId=1 là Nike):**
   ```
   http://localhost:8080/api/products?categoryId=1
   ```

3. **Lấy các categories:**
   ```
   http://localhost:8080/api/categories
   ```

### Bước 3: Kiểm tra Database

Chạy các SQL queries trong file `debug.sql`:

```sql
-- Kiểm tra categories
SELECT * FROM categories;

-- Kiểm tra products với category_id
SELECT id, title, category_id, deleted FROM products;

-- Kiểm tra products theo category_id = 1
SELECT * FROM products WHERE category_id = 1 AND (deleted = 0 OR deleted IS NULL);
```

### Bước 4: Test trên Mobile App

1. Mở terminal ở thư mục `DiDong2_Shoeshop`
2. Chạy `npx expo start`
3. Mở app và vào màn hình Products
4. Nhấn vào các category chips (Tất cả, Nike, Adidas, etc.)
5. Xem console logs trong browser DevTools

## Debug Console Logs

Khi chạy, bạn sẽ thấy logs như sau:

**Frontend (Browser Console):**
```
[Products] Categories loaded: 5
[Products] Fetching products: { endpoint: "/api/products", params: { categoryId: 1 } }
[Products] Products loaded: 3
```

**Backend (Terminal):**
```
[ProductService] getActive called with categoryId: 1
[ProductService] Found 3 products for categoryId 1
```

## Troubleshooting

### 1. Nếu vẫn không hiển thị sản phẩm khi lọc:

Kiểm tra database xem products có `category_id` đúng không:

```sql
SELECT p.id, p.title, p.category_id, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;
```

Nếu `category_id` là NULL cho tất cả products, cần update:

```sql
-- Ví dụ: gán tất cả products có brand = 'Nike' vào category Nike (id=1)
UPDATE products SET category_id = 1 WHERE brand = 'Nike';
```

### 2. Nếu backend không compile:

Kiểm tra xem có lỗi nào trong file Java không:

```bash
cd ADMIN_DiDong/demo
./mvnw compile
```

### 3. Nếu frontend có lỗi:

```bash
cd DiDong2_Shoeshop
npx expo start --clear
```

## Files đã thay đổi

1. `ProductRepository.java` - Native SQL queries
2. `ProductServiceImpl.java` - Debug logs
3. `Product.java` - @JsonIgnoreProperties cho category
4. `products.tsx` - Cấu trúc code sạch, debug logs
