# 📚 TÀI LIỆU API PAYOS DEMO

## 🎯 MỤC ĐÍCH CỦA PROJECT

**PayOS Demo** là ứng dụng Spring Boot mẫu để tích hợp **PayOS Payment Gateway** - cổng thanh toán trực tuyến của Việt Nam.

### Chức năng chính:
- ✅ Tạo link thanh toán (Payment Links) cho khách hàng
- ✅ Quản lý đơn hàng (Orders/Payment Requests)
- ✅ Nhận webhook từ PayOS khi có giao dịch
- ✅ Thực hiện chi trả (Payouts) - chuyển tiền cho người khác
- ✅ Quản lý hóa đơn (Invoices)

---

## 📦 CẤU TRÚC PROJECT

```
payos-demo-java-spring-main/
├── pom.xml                                         # Maven dependencies
├── src/main/
│   ├── java/com/springboot/app/
│   │   ├── SpringbootBackendPayosApplication.java  # Main app + Config
│   │   ├── controller/
│   │   │   ├── CheckoutController.java            # Checkout UI
│   │   │   ├── OrderController.java               # Order API
│   │   │   ├── PaymentController.java             # Webhook handler
│   │   │   └── PayoutsController.java             # Payout API
│   │   └── type/
│   │       ├── ApiResponse.java
│   │       ├── CreatePaymentLinkRequestBody.java
│   │       └── ConfirmWebhookRequestBody.java
│   └── resources/
│       ├── application.properties.example
│       ├── static/
│       └── templates/
```

---

## 🔧 HƯỚNG DẪN CÀI ĐẶT

### Bước 1: Cài đặt Java 17
Tải và cài đặt từ: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html

### Bước 2: Cấu hình PayOS

Tạo file `application.properties` từ `application.properties.example`:

```bash
cp ./src/main/resources/application.properties.example ./src/main/resources/application.properties
```

Điền thông tin lấy từ [my.payos.vn](https://my.payos.vn):

```properties
# Thông tin xác thực PayOS chính (dùng cho thanh toán)
payos.client-id=your-client-id
payos.api-key=your-api-key
payos.checksum-key=your-checksum-key

# Thông tin xác thực cho Payout (tùy chọn)
payos.payout-client-id=your-payout-client-id
payos.payout-api-key=your-payout-api-key
payos.payout-checksum-key=your-payout-checksum-key

# Mức độ log: DEBUG | INFO | NONE
payos.log-level=NONE
```

### Bước 3: Chạy ứng dụng

```bash
# Cài đặt dependencies
mvn clean install

# Chạy ứng dụng
mvn spring-boot:run
```

Ứng dụng sẽ chạy tại: `http://localhost:8080`

### Bước 4: Cấu hình Webhook (Tùy chọn)

Để test webhook trong môi trường development:

1. Cài đặt [ngrok](https://ngrok.com/)
2. Expose local server:
   ```bash
   ngrok http 8080
   ```
3. Đăng ký webhook URL tại [my.payos.vn](https://my.payos.vn) hoặc dùng API:
   ```
   POST /order/confirm-webhook
   {
     "webhookUrl": "https://abc123.ngrok.io/payment/payos_transfer_handler"
   }
   ```

---

## 🚀 CHI TIẾT CÁC API

### 📱 1. CHECKOUT CONTROLLER

Base URL: `/`

#### 🔹 1.1. Hiển thị trang chủ

```http
GET /
```

**Mô tả:** Hiển thị trang checkout (file template `index.html`)

---

#### 🔹 1.2. Tạo Payment Link (Form-based)

```http
POST /create-payment-link
Content-Type: application/x-www-form-urlencoded
```

**Mô tả:** Tạo link thanh toán và redirect khách hàng đến trang PayOS

**Quy trình:**
1. Nhận form submit từ trang web
2. Tạo `orderCode` = timestamp (giây)
3. Tạo payment link với:
   - Tên sản phẩm: "Mì tôm hảo hảo ly"
   - Giá: 2000 VND
   - Return URL: `/success`
   - Cancel URL: `/cancel`
4. Redirect (HTTP 302) đến `checkoutUrl` của PayOS

**Response:** HTTP 302 redirect

---

#### 🔹 1.3. Trang thanh toán thành công

```http
GET /success
```

**Mô tả:** Hiển thị khi thanh toán thành công

---

#### 🔹 1.4. Trang hủy thanh toán

```http
GET /cancel
```

**Mô tả:** Hiển thị khi khách hủy thanh toán

---

### 📦 2. ORDER CONTROLLER

Base URL: `/order`

#### 🔹 2.1. Tạo Payment Link (REST API)

```http
POST /order/create
Content-Type: application/json
```

**Request Body:**
```json
{
  "productName": "Tên sản phẩm",
  "description": "Mô tả đơn hàng",
  "returnUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel",
  "price": 50000
}
```

**Response Success:**
```json
{
  "success": true,
  "data": {
    "bin": "970422",
    "accountNumber": "113366668888",
    "accountName": "NGUYEN VAN A",
    "amount": 50000,
    "description": "Mô tả đơn hàng",
    "orderCode": 1234567890,
    "currency": "VND",
    "paymentLinkId": "...",
    "status": "PENDING",
    "checkoutUrl": "https://pay.payos.vn/...",
    "qrCode": "https://api.payos.vn/qr/..."
  }
}
```

**Sử dụng cho:**
- Tích hợp từ mobile app
- Tích hợp từ website SPA (React, Vue, Angular)
- Lấy QR code để hiển thị cho khách

---

#### 🔹 2.2. Lấy thông tin đơn hàng

```http
GET /order/{orderId}
```

**Path Parameters:**
- `orderId` (long) - Mã đơn hàng

**Example:**
```http
GET /order/1234567890
```

**Response:**
```json
{
  "success": true,
  "message": "ok",
  "data": {
    "orderCode": 1234567890,
    "amount": 50000,
    "amountPaid": 50000,
    "amountRemaining": 0,
    "status": "PAID",
    "createdAt": "2024-01-15T10:30:00Z",
    "transactions": [
      {
        "reference": "FT123456789",
        "amount": 50000,
        "accountNumber": "9876543210",
        "description": "Thanh toan don hang",
        "transactionDateTime": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Trạng thái đơn hàng (status):**
- `PENDING` - Chờ thanh toán
- `PAID` - Đã thanh toán
- `CANCELLED` - Đã hủy

**Sử dụng cho:**
- Polling để kiểm tra khách đã thanh toán chưa
- Hiển thị lịch sử giao dịch
- Xác minh thanh toán

---

#### 🔹 2.3. Hủy đơn hàng

```http
PUT /order/{orderId}
```

**Path Parameters:**
- `orderId` (long) - Mã đơn hàng cần hủy

**Example:**
```http
PUT /order/1234567890
```

**Response:**
```json
{
  "success": true,
  "message": "ok",
  "data": {
    "orderCode": 1234567890,
    "status": "CANCELLED",
    "cancellationReason": "change my mind"
  }
}
```

**Lưu ý:**
- Chỉ hủy được đơn hàng chưa thanh toán (status = PENDING)
- Lý do hủy mặc định: "change my mind"

**Sử dụng cho:**
- Khách hàng muốn hủy đơn
- Admin hủy đơn hết hàng/không hợp lệ

---

#### 🔹 2.4. Đăng ký Webhook URL

```http
POST /order/confirm-webhook
Content-Type: application/json
```

**Request Body:**
```json
{
  "webhookUrl": "https://yourdomain.com/payment/payos_transfer_handler"
}
```

**Response:**
```json
{
  "success": true,
  "message": "ok",
  "data": {
    "webhookUrl": "https://yourdomain.com/payment/payos_transfer_handler"
  }
}
```

**Quan trọng:** 
- Cần chạy API này để PayOS biết gửi webhook về đâu
- URL phải public (dùng ngrok khi dev local)

**Sử dụng cho:**
- Cấu hình webhook khi deploy production
- Testing với ngrok trong development

---

#### 🔹 2.5. Lấy thông tin hóa đơn

```http
GET /order/{orderId}/invoices
```

**Path Parameters:**
- `orderId` (long) - Mã đơn hàng

**Example:**
```http
GET /order/1234567890/invoices
```

**Response:**
```json
{
  "success": true,
  "message": "ok",
  "data": {
    "invoices": [
      {
        "invoiceId": "INV123",
        "status": "ISSUED",
        "createdAt": "2024-01-15T10:35:00Z"
      }
    ]
  }
}
```

**Sử dụng cho:**
- Kiểm tra hóa đơn đã xuất chưa
- Lấy danh sách hóa đơn của đơn hàng

---

#### 🔹 2.6. Tải hóa đơn PDF

```http
GET /order/{orderId}/invoices/{invoiceId}/download
```

**Path Parameters:**
- `orderId` (long) - Mã đơn hàng
- `invoiceId` (string) - Mã hóa đơn

**Example:**
```http
GET /order/1234567890/invoices/INV123/download
```

**Response:**
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="invoice.pdf"`
- **Body:** Binary PDF file

**Sử dụng cho:**
- Khách hàng tải hóa đơn
- Xuất hóa đơn cho kế toán
- Lưu trữ chứng từ

---

### 🔔 3. PAYMENT CONTROLLER - WEBHOOK HANDLER

Base URL: `/payment`

#### 🔹 3.1. PayOS Webhook Handler

```http
POST /payment/payos_transfer_handler
Content-Type: application/json
```

**Request Body (từ PayOS):**
```json
{
  "code": "00",
  "desc": "success",
  "data": {
    "orderCode": 1234567890,
    "amount": 50000,
    "description": "Thanh toan don hang",
    "accountNumber": "113366668888",
    "reference": "FT123456789",
    "transactionDateTime": "2024-01-15 10:30:00",
    "currency": "VND",
    "paymentLinkId": "...",
    "code": "00",
    "desc": "Giao dịch thành công",
    "counterAccountBankId": "970422",
    "counterAccountBankName": "VietcomBank",
    "counterAccountName": "NGUYEN VAN B",
    "counterAccountNumber": "9876543210",
    "virtualAccountName": "",
    "virtualAccountNumber": ""
  },
  "signature": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook delivered",
  "data": {
    "orderCode": 1234567890,
    "amount": 50000,
    ...
  }
}
```

**Quan trọng:**
- PayOS sẽ **TỰ ĐỘNG** gửi request này khi khách thanh toán thành công
- SDK tự động verify `signature` để đảm bảo request từ PayOS
- Đây là cách **REALTIME** nhất để biết giao dịch thành công

**Sử dụng cho:**
- Cập nhật database khi có giao dịch mới
- Gửi email xác nhận cho khách
- Kích hoạt dịch vụ tự động (VIP, khóa học, etc.)
- Ghi log giao dịch
- Tự động fulfill order

**Lưu ý:**
- Phải expose server ra internet (dùng ngrok khi dev)
- Đăng ký webhook URL tại `my.payos.vn` hoặc API 2.4
- Xử lý idempotent (có thể nhận trùng webhook)

---

### 💸 4. PAYOUTS CONTROLLER - CHI TRẢ / CHUYỂN TIỀN

Base URL: `/payouts`

#### 🔹 4.1. Tạo lệnh chi trả đơn

```http
POST /payouts/create
Content-Type: application/json
```

**Request Body:**
```json
{
  "referenceId": "PAYOUT_001",
  "amount": 100000,
  "description": "Hoàn tiền cho khách",
  "accountNumber": "9876543210",
  "accountName": "NGUYEN VAN B",
  "bin": "970422"
}
```

**Request Parameters:**
- `referenceId` (string, optional) - Mã tham chiếu của bạn (auto-gen nếu không có)
- `amount` (long, required) - Số tiền cần chuyển
- `description` (string, required) - Mô tả giao dịch
- `accountNumber` (string, required) - Số tài khoản nhận
- `accountName` (string, required) - Tên chủ tài khoản nhận
- `bin` (string, required) - Mã ngân hàng (ví dụ: 970422 = VietcomBank)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "PAYOUT123",
    "amount": 100000,
    "status": "PROCESSING",
    "referenceId": "PAYOUT_001",
    "accountNumber": "9876543210",
    "accountName": "NGUYEN VAN B",
    "description": "Hoàn tiền cho khách"
  }
}
```

**Sử dụng cho:**
- Hoàn tiền cho khách hàng
- Thanh toán cho đối tác
- Trả hoa hồng
- Chi lương nhân viên

---

#### 🔹 4.2. Tạo lệnh chi trả hàng loạt

```http
POST /payouts/batch/create
Content-Type: application/json
```

**Request Body:**
```json
{
  "referenceId": "BATCH_001",
  "payouts": [
    {
      "referenceId": "PAYOUT_001",
      "amount": 100000,
      "description": "Lương tháng 1",
      "accountNumber": "111111",
      "accountName": "NGUYEN VAN A",
      "bin": "970422"
    },
    {
      "amount": 200000,
      "description": "Lương tháng 1",
      "accountNumber": "222222",
      "accountName": "TRAN THI B",
      "bin": "970422"
    }
  ]
}
```

**Lưu ý:**
- `referenceId` của từng item sẽ auto-generate nếu không có
- Format: `payout_{timestamp}_{index}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "BATCH_PAYOUT_123",
    "referenceId": "BATCH_001",
    "status": "PROCESSING",
    "totalAmount": 300000,
    "totalItems": 2
  }
}
```

**Sử dụng cho:**
- Chi lương hàng loạt
- Hoàn tiền nhiều đơn hàng
- Thanh toán nhiều nhà cung cấp
- Trả hoa hồng cho nhiều đối tác

---

#### 🔹 4.3. Kiểm tra trạng thái chi trả

```http
GET /payouts/{payoutId}
```

**Path Parameters:**
- `payoutId` (string) - ID của lệnh chi trả

**Example:**
```http
GET /payouts/PAYOUT123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "PAYOUT123",
    "amount": 100000,
    "status": "SUCCESS",
    "referenceId": "PAYOUT_001",
    "accountNumber": "9876543210",
    "accountName": "NGUYEN VAN B",
    "description": "Hoàn tiền cho khách",
    "createdAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T10:05:00Z"
  }
}
```

**Trạng thái chi trả (status):**
- `PROCESSING` - Đang xử lý
- `SUCCESS` - Thành công
- `FAILED` - Thất bại

**Sử dụng cho:**
- Polling để kiểm tra tiến độ
- Xác minh chi trả thành công
- Debug khi có vấn đề

---

#### 🔹 4.4. Lấy danh sách chi trả

```http
GET /payouts/list?referenceId=BATCH_001&approvalState=APPROVED&limit=20&offset=0
```

**Query Parameters:**
- `referenceId` (string, optional) - Lọc theo reference ID
- `approvalState` (string, optional) - Lọc theo trạng thái duyệt
  - `APPROVED` - Đã duyệt
  - `PENDING` - Chờ duyệt
  - `REJECTED` - Bị từ chối
- `category` (array, optional) - Loại chi trả
- `fromDate` (string, optional) - Từ ngày (yyyy-MM-dd)
- `toDate` (string, optional) - Đến ngày (yyyy-MM-dd)
- `limit` (integer, optional) - Số lượng kết quả (mặc định 20)
- `offset` (integer, optional) - Vị trí bắt đầu (pagination)

**Example:**
```http
GET /payouts/list?fromDate=2024-01-01&toDate=2024-01-31&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "PAYOUT123",
      "amount": 100000,
      "status": "SUCCESS",
      "referenceId": "PAYOUT_001",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "PAYOUT124",
      "amount": 200000,
      "status": "PROCESSING",
      "referenceId": "PAYOUT_002",
      "createdAt": "2024-01-16T14:30:00Z"
    }
  ]
}
```

**Lưu ý:**
- API tự động lấy tất cả trang bằng `autoPager()`
- Kết quả đã merge tất cả pages vào 1 array

**Sử dụng cho:**
- Xem lịch sử tất cả chi trả
- Báo cáo tài chính
- Đối soát
- Export dữ liệu

---

#### 🔹 4.5. Kiểm tra số dư tài khoản

```http
GET /payouts/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 5000000,
    "currency": "VND",
    "accountNumber": "113366668888",
    "accountName": "CONG TY ABC"
  }
}
```

**Sử dụng cho:**
- Kiểm tra trước khi tạo lệnh chi trả
- Cảnh báo khi sắp hết tiền
- Hiển thị số dư dashboard
- Tự động nạp tiền khi thấp

---

## 🔄 FLOW HOẠT ĐỘNG THỰC TẾ

### 💰 Flow 1: Thanh toán đơn hàng (Payment)

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 1. POST /order/create
       ▼
┌─────────────┐
│   Backend   │ ──→ PayOS API
└──────┬──────┘
       │ 2. Return checkoutUrl + qrCode
       ▼
┌─────────────┐
│  Frontend   │ ──→ Hiển thị QR hoặc redirect
└─────────────┘
       │
       │ 3. Khách quét QR/chuyển khoản
       ▼
┌─────────────┐
│    PayOS    │
└──────┬──────┘
       │ 4. POST /payment/payos_transfer_handler (WEBHOOK)
       ▼
┌─────────────┐
│   Backend   │ ──→ Update database, send email, etc.
└─────────────┘
       │
       │ 5. (Optional) Frontend polling
       │    GET /order/{orderId}
       ▼
┌─────────────┐
│  Frontend   │ ──→ Hiển thị "Thanh toán thành công"
└─────────────┘
```

**Các bước chi tiết:**

1. **Tạo Payment Link**
   - Frontend gọi: `POST /order/create`
   - Backend trả về: `checkoutUrl`, `qrCode`

2. **Khách hàng thanh toán**
   - Hiển thị QR code hoặc redirect đến `checkoutUrl`
   - Khách quét mã QR bằng app ngân hàng
   - Khách chuyển khoản theo thông tin

3. **Nhận Webhook (REALTIME)**
   - PayOS tự động gọi: `POST /payment/payos_transfer_handler`
   - Backend cập nhật database
   - Gửi email/SMS xác nhận
   - Kích hoạt dịch vụ

4. **Kiểm tra trạng thái (Optional)**
   - Frontend có thể polling: `GET /order/{orderId}`
   - Kiểm tra `status === "PAID"`

---

### 💸 Flow 2: Hoàn tiền / Chi trả (Payout)

```
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 1. GET /payouts/balance
       │    (Check số dư)
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 2. POST /payouts/create
       │    (Tạo lệnh hoàn tiền)
       ▼
┌─────────────┐
│    PayOS    │ ──→ Xử lý chuyển tiền
└─────────────┘
       │
       │ 3. Backend polling
       │    GET /payouts/{payoutId}
       ▼
┌─────────────┐
│   Backend   │ ──→ Check status === "SUCCESS"
└─────────────┘
       │
       │ 4. Update database
       ▼
┌─────────────┐
│   Customer  │ ──→ Nhận tiền vào tài khoản
└─────────────┘
```

**Các bước chi tiết:**

1. **Kiểm tra số dư**
   ```
   GET /payouts/balance
   → Đảm bảo đủ tiền để chi trả
   ```

2. **Tạo lệnh chi trả**
   ```
   POST /payouts/create
   {
     "amount": 100000,
     "accountNumber": "...",
     "accountName": "...",
     "bin": "970422"
   }
   ```

3. **Theo dõi trạng thái**
   ```
   GET /payouts/{payoutId}
   → Polling mỗi 5-10 giây
   → Đợi status === "SUCCESS"
   ```

4. **Hoàn tất**
   - Cập nhật database
   - Gửi thông báo cho khách
   - Ghi log

---

## 🔑 CÁC MÃ NGÂN HÀNG PHỔ BIẾN (BIN)

| Mã BIN | Ngân hàng |
|--------|-----------|
| 970422 | VietcomBank |
| 970415 | Vietinbank |
| 970436 | Vietcombank |
| 970418 | BIDV |
| 970405 | Agribank |
| 970416 | ACB |
| 970432 | VPBank |
| 970423 | TPBank |
| 970407 | Techcombank |
| 970419 | NCB |
| 970414 | OceanBank |
| 970403 | Sacombank |
| 970448 | OCB |
| 970422 | MB Bank |
| 970426 | MSB |
| 970431 | Eximbank |

> **Lưu ý:** Danh sách đầy đủ có tại tài liệu PayOS

---

## 🔒 BẢO MẬT

### Xác thực Webhook

PayOS tự động verify webhook bằng `signature`. SDK đã xử lý:

```java
// SDK tự động verify
WebhookData data = payOS.webhooks().verify(body);
```

**Cơ chế:**
- PayOS ký request bằng `checksumKey`
- SDK verify signature
- Nếu sai → throw Exception
- Nếu đúng → return data

### Bảo vệ các endpoint

**Khuyến nghị:**
- Thêm authentication cho các API create/cancel
- Rate limiting cho webhook endpoint
- Whitelist IP của PayOS cho webhook
- Log tất cả requests
- Xử lý idempotent cho webhook

---

## 📊 XỬ LÝ LỖI

### Response khi có lỗi

```json
{
  "success": false,
  "message": "Order not found"
}
```

### Các lỗi phổ biến

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `Order not found` | OrderId không tồn tại | Kiểm tra lại orderCode |
| `Invalid signature` | Checksum key sai | Kiểm tra config |
| `Insufficient balance` | Không đủ tiền payout | Nạp tiền vào tài khoản |
| `Order already paid` | Đơn đã thanh toán | Không cần xử lý |
| `Order cancelled` | Đơn đã hủy | Tạo đơn mới |

---

## 🧪 TESTING

### Test Payment Flow

1. **Tạo payment link:**
   ```bash
   curl -X POST http://localhost:8080/order/create \
     -H "Content-Type: application/json" \
     -d '{
       "productName": "Test Product",
       "description": "Test",
       "returnUrl": "http://localhost:8080/success",
       "cancelUrl": "http://localhost:8080/cancel",
       "price": 10000
     }'
   ```

2. **Check order status:**
   ```bash
   curl http://localhost:8080/order/1234567890
   ```

3. **Cancel order:**
   ```bash
   curl -X PUT http://localhost:8080/order/1234567890
   ```

### Test Payout Flow

1. **Check balance:**
   ```bash
   curl http://localhost:8080/payouts/balance
   ```

2. **Create payout:**
   ```bash
   curl -X POST http://localhost:8080/payouts/create \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 50000,
       "description": "Test payout",
       "accountNumber": "9876543210",
       "accountName": "NGUYEN VAN A",
       "bin": "970422"
     }'
   ```

3. **Check payout status:**
   ```bash
   curl http://localhost:8080/payouts/PAYOUT123
   ```

---

## 🚀 PRODUCTION CHECKLIST

### Trước khi deploy:

- [ ] Đổi credentials từ sandbox → production
- [ ] Cấu hình webhook URL production
- [ ] Test webhook với ngrok
- [ ] Thêm authentication/authorization
- [ ] Setup database để lưu orders
- [ ] Implement retry logic cho API calls
- [ ] Add monitoring & logging
- [ ] Setup alerting (email/Telegram)
- [ ] Test error scenarios
- [ ] Document API cho team
- [ ] Rate limiting
- [ ] HTTPS cho tất cả endpoints

---

## 📚 TÀI LIỆU THAM KHẢO

- **PayOS Dashboard:** https://my.payos.vn
- **PayOS Docs:** https://payos.vn/docs
- **Support:** support@payos.vn
- **SDK GitHub:** https://github.com/payos-vn/payos-java

---

## 💡 MẸO & BEST PRACTICES

### 1. Luôn dùng Webhook thay vì Polling

✅ **Tốt:**
```java
// Nhận webhook realtime
@PostMapping("/payment/payos_transfer_handler")
public ApiResponse handleWebhook(@RequestBody Object body) {
    WebhookData data = payOS.webhooks().verify(body);
    // Update database ngay lập tức
}
```

❌ **Không tốt:**
```java
// Polling mỗi giây
while (true) {
    PaymentLink order = payOS.paymentRequests().get(orderId);
    if (order.getStatus().equals("PAID")) break;
    Thread.sleep(1000);
}
```

### 2. Xử lý Idempotent cho Webhook

PayOS có thể gửi trùng webhook. Xử lý bằng cách:

```java
@PostMapping("/payment/payos_transfer_handler")
public ApiResponse handleWebhook(@RequestBody Object body) {
    WebhookData data = payOS.webhooks().verify(body);
    
    // Check đã xử lý chưa
    if (orderRepository.isProcessed(data.getOrderCode())) {
        return ApiResponse.success("Already processed");
    }
    
    // Xử lý
    processOrder(data);
    
    // Đánh dấu đã xử lý
    orderRepository.markProcessed(data.getOrderCode());
    
    return ApiResponse.success("OK");
}
```

### 3. Luôn check số dư trước khi Payout

```java
public void createPayout(PayoutRequest request) {
    // Check balance first
    PayoutAccountInfo balance = payOS.payoutsAccount().balance();
    
    if (balance.getBalance() < request.getAmount()) {
        throw new InsufficientBalanceException();
    }
    
    // Then create payout
    payOS.payouts().create(request);
}
```

### 4. Sử dụng ReferenceId để tracking

```java
// Dùng format có ý nghĩa
String referenceId = String.format(
    "ORDER_%s_%d",
    orderId,
    System.currentTimeMillis()
);

PayoutRequests payout = new PayoutRequests();
payout.setReferenceId(referenceId);
```

### 5. Log tất cả giao dịch

```java
@PostMapping("/payment/payos_transfer_handler")
public ApiResponse handleWebhook(@RequestBody Object body) {
    WebhookData data = payOS.webhooks().verify(body);
    
    // Log đầy đủ
    log.info("Received webhook for order: {}, amount: {}, ref: {}", 
        data.getOrderCode(), 
        data.getAmount(),
        data.getReference()
    );
    
    // Xử lý...
}
```

---

## 🎓 TÓM TẮT

**PayOS Demo** cung cấp:

### ✅ 4 Controllers:
1. **CheckoutController** - UI checkout
2. **OrderController** - Quản lý payment links & invoices
3. **PaymentController** - Webhook handler
4. **PayoutsController** - Quản lý chi trả

### ✅ Chức năng đầy đủ:
- Tạo link thanh toán (QR + URL)
- Kiểm tra trạng thái đơn hàng
- Nhận webhook realtime
- Hủy đơn hàng
- Quản lý hóa đơn (xem + download)
- Chi trả đơn/hàng loạt
- Kiểm tra số dư

### ✅ Dễ dàng mở rộng:
- Thêm database
- Thêm authentication
- Tích hợp email/SMS
- Tích hợp với hệ thống hiện có

---

**🎉 Chúc bạn tích hợp PayOS thành công!**
