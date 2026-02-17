# 🧪 Hướng Dẫn Test Production Docker Trên Local

Test production config trước khi deploy lên VPS thật.

---

## 🚀 Bước 1: Khởi Động Docker Desktop

**Windows:**
1. Mở Docker Desktop app
2. Đợi cho đến khi thấy "Docker Desktop is running"
3. Kiểm tra: `docker ps` (phải chạy không lỗi)

**Nếu chưa cài Docker Desktop:**
- Download: https://www.docker.com/products/docker-desktop/
- Cài đặt và khởi động

---

## 🧪 Bước 2: Test Từng Dockerfile

### Test 1: Backend Build
```bash
cd c:\Users\Chinh\Documents\GitHub\EXE_Project
docker build -f backend/Dockerfile.prod -t vivuplan-backend:test backend
```

**Kết quả mong đợi:**
- Build thành công (~3-5 phút)
- Dòng cuối: `Successfully tagged vivuplan-backend:test`
- Image size: ~350MB

**Nếu lỗi:**
- Kiểm tra Maven có trong backend/ không
- Kiểm tra pom.xml đúng không

### Test 2: Frontend Build
```bash
docker build -f frontend/Dockerfile.prod -t vivuplan-frontend:test frontend
```

**Kết quả mong đợi:**
- Build thành công (~2-4 phút)
- Dòng cuối: `Successfully tagged vivuplan-frontend:test`
- Image size: ~150MB

**Nếu lỗi:**
- Kiểm tra package.json có không
- Kiểm tra Next.js config

### Test 3: Agents Build  
```bash
docker build -f agents/Dockerfile.prod -t vivuplan-agents:test agents
```

**Kết quả mong đợi:**
- Build thành công (~3-5 phút)
- Image size: ~900MB

### Test 4: Nginx Build
```bash
docker build -t vivuplan-nginx:test nginx
```

**Kết quả mong đợi:**
- Build rất nhanh (~10 giây)
- Image size: ~40MB

---

## 🧪 Bước 3: Test Docker Compose

### 3.1 Kiểm Tra Config
```bash
docker compose -f docker-compose.prod.yml config
```

**Kết quả mong đợi:**
- Hiển thị YAML config đầy đủ
- KHÔNG có lỗi syntax
- Environment variables đã được substitute

### 3.2 Chạy Stack (không SSL)

**LƯU Ý**: Để test local, tôi đã tạo file `.env.production` với localhost. Bạn cần:

```bash
# Comment phần SSL trong nginx/nginx.conf trước
# Hoặc chỉ test backend + frontend + agents (bỏ nginx)

# Chạy chỉ backend, frontend, agents (không nginx)
docker compose -f docker-compose.prod.yml up backend frontend agents
```

**Xem logs real-time:**
- Backend log sẽ hiện Spring Boot khởi động
- Frontend log sẽ hiện Next.js compile
- Agents log sẽ hiện FastAPI uvicorn start

**Kiểm tra containers:**
```bash
# Tab mới
docker ps
```

Phải thấy 3 containers:
- `vivuplan-backend` → PORT 8080
- `vivuplan-frontend` → PORT 3000
- `vivuplan-agents` → PORT 4000

### 3.3 Test Endpoints

```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend
curl http://localhost:3000

# Agents health
curl http://localhost:4000/health
```

**Kết quả mong đợi:**
- Backend: `{"status":"UP"}`
- Frontend: HTML content
- Agents: `{"status":"healthy"}`

---

## 🧪 Bước 4: Test Trên Browser

1. Mở: `http://localhost:3000`
2. Đăng ký/đăng nhập
3. Test search (flight/hotel)
4. Test chatbot

**Nếu có lỗi CORS hoặc API:**
- Kiểm tra `.env.production` có đúng URLs không
- Xem logs: `docker compose -f docker-compose.prod.yml logs -f backend`

---

## 🛑 Dừng Test

```bash
# Stop tất cả containers
docker compose -f docker-compose.prod.yml down

# Xóa images test (nếu muốn)
docker rmi vivuplan-backend:test vivuplan-frontend:test vivuplan-agents:test vivuplan-nginx:test
```

---

## 🌐 Domain vs IP Address

### Câu Hỏi: Có thể dùng IP thay domain không?

**Trả lời: ĐƯỢC, nhưng có hạn chế:**

### ✅ Dùng IP Public - Những Gì Hoạt Động:
```bash
# Trong .env.production
FRONTEND_URL=http://123.45.67.89
NEXT_PUBLIC_API_URL=http://123.45.67.89/api/v1

# Trong nginx.conf
server_name 123.45.67.89;
```

- ✅ HTTP hoạt động bình thường
- ✅ API calls hoạt động
- ✅ Các chức năng cơ bản OK

### ❌ Dùng IP - Những Gì KHÔNG Hoạt Động:

1. **SSL/HTTPS với Let's Encrypt:**
   ```bash
   # KHÔNG ĐƯỢC - Let's Encrypt cần domain
   sudo certbot --nginx -d 123.45.67.89  # ❌ SẼ LỖI
   ```
   → **Let's Encrypt KHÔNG cấp SSL cho địa chỉ IP**

2. **PayOS Webhook:**
   - PayOS yêu cầu HTTPS cho webhook
   - Không có SSL = không test được payment

3. **Google OAuth:**
   - Redirect URI phải là domain (hoặc localhost)
   - `http://123.45.67.89/callback` có thể không được Google chấp nhận

4. **Cookie Security:**
   - Cookies với `Secure` flag KHÔNG hoạt động trên HTTP
   - Sessions có thể có vấn đề

### 🎯 Khuyến Nghị:

**Cho Testing/Demo (ngắn hạn):**
```bash
# OK - dùng HTTP với IP
FRONTEND_URL=http://YOUR_VPS_IP
# Không test được: Payment, OAuth, SSL
```

**Cho Production (dài hạn):**
```bash
# BẮT BUỘC - dùng domain
FRONTEND_URL=https://vivuplan.com
# Hoạt động đầy đủ: Payment, OAuth, SSL, HTTPS
```

### 💡 Giải Pháp Tạm Thời - Dùng IP Nhưng Vẫn Có SSL:

**Nếu chưa có domain, dùng self-signed certificate:**

```bash
# Tạo self-signed SSL cho IP
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj "/CN=YOUR_VPS_IP"

# Update nginx.conf để dùng cert này
ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
```

**Nhược điểm:**
- Browser sẽ báo "Not Secure" (phải click "Advanced" → "Proceed")
- Không professional
- PayOS/Google có thể từ chối

---

## 📋 Checklist Test Local

- [ ] Docker Desktop đang chạy
- [ ] Test build backend Dockerfile.prod ✅
- [ ] Test build frontend Dockerfile.prod ✅  
- [ ] Test build agents Dockerfile.prod ✅
- [ ] Test docker-compose config ✅
- [ ] Test chạy stack (backend + frontend + agents)
- [ ] Test health endpoints
- [ ] Test trên browser
- [ ] Không có lỗi trong logs

**Nếu tất cả PASS** → Config production đúng, có thể deploy lên VPS!

---

## 🚀 Sau Khi Test Xong

### Deploy Lên VPS:

1. **Có Domain:**
   ```bash
   # Thay localhost → domain thật trong .env.production
   FRONTEND_URL=https://vivuplan.com
   # Deploy → Setup SSL với certbot
   ```

2. **Chưa Có Domain (dùng IP tạm):**
   ```bash
   # Thay localhost → IP VPS
   FRONTEND_URL=http://123.45.67.89
   # Deploy → Chạy được nhưng KHÔNG có:
   # - HTTPS
   # - PayOS webhook
   # - Google OAuth (có thể)
   ```

3. **Khuyến Nghị:**
   - Mua domain (~$10/năm) cho professional
   - Hoặc dùng subdomain miễn phí (DuckDNS, NoIP)
   - Có domain → full features

---

**Tóm tắt:**
- ✅ Test local để đảm bảo config đúng
- ✅ Dùng IP được nhưng thiếu SSL/HTTPS  
- 🎯 Production thật nên có domain để đầy đủ tính năng
