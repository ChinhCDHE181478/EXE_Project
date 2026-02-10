# Backend Docker Configuration

## 🐳 Hướng Dẫn Chạy Backend Với Docker

### Environment Variables Cần Thiết

Khi chạy Docker, tạo file `.env` trong thư mục `backend` với nội dung sau:

```bash
# ============================================
# DOCKER ENVIRONMENT - BACKEND
# ============================================

# Server Configuration
SERVER_PORT=8080

# Database Configuration (External PostgreSQL)
# Lưu ý: host.docker.internal cho phép Docker container kết nối tới localhost
DATABASE_URL=host.docker.internal:5432
DATABASE_NAME=vivuplan
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=123

# Redis Configuration (External)
REDIS_HOST=host.docker.internal
REDIS_PORT=6379

# Frontend URL (Docker service name)
FRONTEND_URL=http://frontend:3000

# ============================================
# PayOS Configuration
# ============================================
PAYOS_CLIENT_ID=your-client-id-here
PAYOS_API_KEY=your-api-key-here
PAYOS_CHECKSUM_KEY=your-checksum-key-here

# PayOS Webhook URL - CẦN NGROK
# Bước 1: Chạy ngrok: ngrok http 8080
# Bước 2: Copy ngrok URL và thay vào dưới
PAYOS_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app/payment/payos-webhook

# PayOS Return/Cancel URLs (localhost vì redirect browser người dùng)
PAYOS_RETURN_URL=http://localhost:3000/payment/success
PAYOS_CANCEL_URL=http://localhost:3000/payment/cancel
# ============================================

# JWT Configuration
SIGNER_KEY=your-signer-key-here
REFRESH_SIGNER_KEY=your-refresh-signer-key-here

# Email Configuration
MAIL=your-email@gmail.com
MAILPASS=your-app-password-here

# RapidAPI Configuration
RAPIDAPI_BOOKINGCOM_URL=https://booking-com15.p.rapidapi.com/api/v1
X_RAPIDAPI_HOST=booking-com15.p.rapidapi.com
X_RAPIDAPI_KEY=your-rapidapi-key-here

# Google OAuth Configuration
OUTBOUND_IDENTITY_GOOGLE_TOKEN_URL=https://oauth2.googleapis.com/token
OUTBOUND_IDENTITY_GOOGLE_USERINFO_URL=https://www.googleapis.com/oauth2/v3/userinfo
OUTBOUND_IDENTITY_GOOGLE_CLIENT_ID=your-google-client-id
OUTBOUND_IDENTITY_GOOGLE_CLIENT_SECRET=your-google-client-secret
OUTBOUND_IDENTITY_GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/auth/google/callback
OUTBOUND_IDENTITY_GOOGLE_GRANT_TYPE=authorization_code
```

## 🔧 Cấu Hình Application.yml Cho Docker

Trong file `application.yml`, cần thay đổi:

1. **Comment dòng port cố định:**
   ```yaml
   # port: 8080
   ```

2. **Uncomment dòng port từ environment variable:**
   ```yaml
   port: ${SERVER_PORT:8080}
   ```

## 📋 Checklist Trước Khi Chạy Docker

- [ ] PostgreSQL đang chạy trên localhost (port 5432)
- [ ] Redis đang chạy trên localhost (port 6379)
- [ ] Đã tạo file `.env` trong thư mục backend
- [ ] Đã điền đầy đủ PayOS credentials
- [ ] Đã chuẩn bị ngrok cho webhook (nếu cần test PayOS)

## 🚀 Chạy Backend Với Docker

```bash
# Từ thư mục gốc project
cd c:\Users\Chinh\Documents\GitHub\EXE_Project

# Build và chạy tất cả services
docker-compose up --build backend
```

## 🔍 Setup PayOS Webhook với Ngrok

**Bước 1:** Chạy ngrok
```bash
ngrok http 8080
```

**Bước 2:** Copy ngrok URL (ví dụ: `https://abc123.ngrok-free.app`)

**Bước 3:** Update file `.env`
```bash
PAYOS_WEBHOOK_URL=https://abc123.ngrok-free.app/payment/payos-webhook
```

**Bước 4:** Restart backend container
```bash
docker-compose restart backend
```

**Bước 5:** Kiểm tra logs xác nhận webhook đã đăng ký
```bash
docker-compose logs backend | grep "webhook"
```

Bạn sẽ thấy:
```
=== Starting PayOS webhook auto-registration ===
Registering webhook URL with PayOS: https://abc123.ngrok-free.app/payment/payos-webhook
=== PayOS webhook registered successfully ===
```

## 🔄 Quay Lại Localhost (Không Docker)

1. Trong `application.yml`:
   - Uncomment: `port: 8080`
   - Comment: `# port: ${SERVER_PORT:8080}`

2. Chạy từ IDE hoặc Maven:
   ```bash
   mvn spring-boot:run
   ```

## ⚠️ Lưu Ý Quan Trọng

- **host.docker.internal**: Đặc biệt cho Docker Desktop trên Windows/Mac, cho phép container truy cập localhost
- **PayOS Webhook**: Phải dùng public URL (ngrok) vì PayOS gửi từ internet
- **Return/Cancel URLs**: Dùng localhost vì redirect browser người dùng, không phải webhook
- Backend sẽ **TỰ ĐỘNG** đăng ký webhook khi startup nhờ `PayOSInitializer.java`
