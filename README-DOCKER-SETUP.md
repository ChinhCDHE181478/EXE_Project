# 🐳 Hướng Dẫn Chi Tiết: Switch Giữa Localhost và Docker

## 📋 Tổng Quan

Dự án có 3 services chính: **backend**, **frontend**, **agents**. Tất cả đã được cấu hình để có thể chạy cả trên **localhost** (development thông thường) và **Docker** (containerized).

Các thay đổi đã được thêm dưới dạnh **COMMENT** để bạn dễ dàng chuyển đổi giữa hai môi trường mà không làm hỏng code hiện tại.

---

## 🚀 Để Chạy Với Docker

### Bước 1: Chuẩn Bị External Services

Docker chỉ chạy 3 services chính. Redis và PostgreSQL cần chạy riêng trên localhost.

**Redis:**
```bash
# Kiểm tra Redis đang chạy
redis-cli ping
# Nếu chưa chạy, start Redis
redis-server
```

**PostgreSQL:**
```bash
# Kiểm tra PostgreSQL
psql -U postgres -h localhost -p 5432
# Đảm bảo database "vivuplan" đã tồn tại
```

### Bước 2: Cấu Hình Environment Files

#### Backend

Tạo file `.env` trong thư mục `backend/` (xem mẫu trong `README-DOCKER.md`):

```bash
SERVER_PORT=8080
DATABASE_URL=host.docker.internal:5432
DATABASE_NAME=vivuplan
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=123
REDIS_HOST=host.docker.internal
REDIS_PORT=6379
FRONTEND_URL=http://frontend:3000
PAYOS_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app/payment/payos-webhook
# ... các biến khác
```

#### Agents

Trong file `agents/.env`:

1. **Comment các dòng LOCALHOST**:
   ```bash
   # BACKEND_URL=http://localhost:8080/api/v1
   # REDIS_HOST=localhost
   # POSTGRES_HOST=localhost
   ```

2. **Uncomment các dòng DOCKER**:
   ```bash
   BACKEND_URL=http://backend:8080/api/v1
   REDIS_HOST=host.docker.internal
   POSTGRES_HOST=host.docker.internal
   ```

#### Frontend

Trong file `frontend/src/app/(chat)/chatbox/page.tsx`:

1. **Comment dòng LOCALHOST**:
   ```typescript
   // const API_BASE = "http://localhost:4000/v1";
   ```

2. **Uncomment dòng DOCKER**:
   ```typescript
   const API_BASE = process.env.NEXT_PUBLIC_AGENTS_URL || "http://localhost:4000/v1";
   ```

### Bước 3: Setup PayOS Webhook (Tùy Chọn)

Nếu cần test payment với PayOS:

```bash
# 1. Chạy ngrok
ngrok http 8080

# 2. Copy ngrok URL (ví dụ: https://abc123.ngrok-free.app)

# 3. Update trong backend/.env
PAYOS_WEBHOOK_URL=https://abc123.ngrok-free.app/payment/payos-webhook

# 4. Kiểm tra sau khi start backend
docker-compose logs backend | grep "webhook"
```

### Bước 4: Build và Chạy Docker

```bash
# Từ thư mục gốc project
cd c:\Users\Chinh\Documents\GitHub\EXE_Project

# Build và start tất cả services
docker-compose up --build

# Hoặc chạy background
docker-compose up -d --build
```

### Bước 5: Kiểm Tra Services

```bash
# Check containers đang chạy
docker ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f agents

# Test health
curl http://localhost:8080/api/v1/actuator/health
curl http://localhost:4000/health
```

### Bước 6: Truy Cập Ứng Dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **Backend Swagger**: http://localhost:8080/api/v1/swagger-ui.html
- **Agents API**: http://localhost:4000

---

## 🏠 Để Quay Về Localhost (Không Docker)

### Bước 1: Revert Environment Files

#### Agents

Trong `agents/.env`:

1. **Uncomment các dòng LOCALHOST**:
   ```bash
   BACKEND_URL=http://localhost:8080/api/v1
   REDIS_HOST=localhost
   POSTGRES_HOST=localhost
   ```

2. **Comment các dòng DOCKER**:
   ```bash
   # BACKEND_URL=http://backend:8080/api/v1
   # REDIS_HOST=host.docker.internal
   # POSTGRES_HOST=host.docker.internal
   ```

#### Frontend

Trong `frontend/src/app/(chat)/chatbox/page.tsx`:

1. **Uncomment dòng LOCALHOST**:
   ```typescript
   const API_BASE = "http://localhost:4000/v1";
   ```

2. **Comment dòng DOCKER**:
   ```typescript
   // const API_BASE = process.env.NEXT_PUBLIC_AGENTS_URL || "http://localhost:4000/v1";
   ```

#### Backend

Trong `backend/src/main/resources/application.yml`:

Giữ nguyên:
```yaml
server:
  port: 8080
```

Không uncomment dòng Docker.

### Bước 2: Stop Docker

```bash
# Stop tất cả containers
docker-compose down

# Hoặc stop và xóa volumes
docker-compose down -v
```

### Bước 3: Chạy Services Trực Tiếp

#### Backend
```bash
cd backend
mvn spring-boot:run
# Hoặc chạy từ IDE (IntelliJ, Eclipse)
```

#### Frontend
```bash
cd frontend
npm run dev
```

#### Agents
```bash
cd agents
python main.py
```

---

## 📝 Checklist Nhanh

### Trước Khi Chạy Docker
- [ ] Redis và PostgreSQL đang chạy trên localhost
- [ ] Đã tạo file `backend/.env` với config Docker
- [ ] Đã uncomment dòng DOCKER trong `agents/.env`
- [ ] Đã uncomment dòng DOCKER trong `frontend/src/app/(chat)/chatbox/page.tsx`
- [ ] (Tùy chọn) Đã setup ngrok cho PayOS webhook

### Trước Khi Chạy Localhost
- [ ] Đã uncomment dòng LOCALHOST trong `agents/.env`
- [ ] Đã uncomment dòng LOCALHOST trong `frontend/src/app/(chat)/chatbox/page.tsx`
- [ ] Đã stop Docker: `docker-compose down`
- [ ] Redis và PostgreSQL vẫn chạy trên localhost

---

## 🔍 Troubleshooting

### Lỗi Kết Nối Database/Redis Từ Docker

**Vấn đề**: Containers không kết nối được với PostgreSQL/Redis trên localhost

**Giải pháp**:
- Đảm bảo dùng `host.docker.internal` thay vì `localhost`
- Check PostgreSQL/Redis có cho phép connection từ Docker network không
- Trên Linux, có thể cần dùng `172.17.0.1` thay vì `host.docker.internal`

### PayOS Webhook Không Nhận Được

**Vấn đề**: PayOS không gửi webhook về backend

**Giải pháp**:
- Kiểm tra ngrok vẫn đang chạy: đảm bảo Terminal ngrok không bị tắt
- Check log backend xác nhận webhook đã đăng ký: `docker-compose logs backend | grep "webhook"`
- Test ngrok URL: `curl https://your-ngrok-url.ngrok-free.app/health`
- Restart backend sau khi update webhook URL: `docker-compose restart backend`

### Port Already In Use

**Vấn đề**: Lỗi port 8080, 3000, hoặc 4000 đã được sử dụng

**Giải pháp**:
```bash
# Tìm process đang dùng port
netstat -ano | findstr :8080

# Kết thúc process (thay <PID>)
taskkill /PID <PID> /F

# Hoặc stop Docker containers
docker-compose down
```

### Frontend Không Kết Nối Được Agents

**Vấn đề**: Chatbox không hoạt động

**Kiểm tra**:
1. Agents container có đang chạy không: `docker ps | grep agents`
2. Đã uncomment dòng Docker trong `chatbox/page.tsx` chưa
3. Check logs frontend: `docker-compose logs frontend`
4. Test agents API trực tiếp: `curl http://localhost:4000/health`

---

## 💡 Tips

- **Luôn commit code trước khi switch**: Tránh mất code khi edit nhiều file
- **Sử dụng Git stash**: Nếu cần switch nhanh giữa Docker và localhost
- **Keep ngrok running**: Tránh phải update webhook URL liên tục
- **Check logs thường xuyên**: Dùng `docker-compose logs -f <service>` để debug
- **Use `.env.local` cho frontend**: Trong production có thể tạo file riêng thay vì edit code trực tiếp

---

## 🎯 Kết Luận

Cấu hình này cho phép bạn:
- ✅ Test trên localhost như bình thường (đang dùng)
- ✅ Chạy full Docker khi cần (chỉ cần uncomment/comment)
- ✅ Không làm hỏng code hiện tại
- ✅ Dễ dàng deploy lên production sau này

Mọi thay đổi đều là **COMMENT**, không ảnh hưởng tới code đang chạy!
