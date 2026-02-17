# 🚀 Hướng Dẫn Deploy VPS - Từng Bước

Checklist đầy đủ từ local đến VPS production.

---

## ⚠️ LƯU Ý QUAN TRỌNG: Domain & Ports

### 🌐 User Truy Cập Như Thế Nào?

**✅ ĐÚNG - User CHỈ cần domain (KHÔNG có :3000):**
```
http://vivuplan.com              ← HTTP (trước SSL)
https://vivuplan.com             ← HTTPS (sau SSL)
```

**❌ SAI - KHÔNG cần thêm ports:**
```
http://vivuplan.com:3000         ← ❌ KHÔNG cần
http://vivuplan.com:8080         ← ❌ KHÔNG cần
```

### 🔄 Nginx Reverse Proxy Hoạt Động:

Nginx tự động route requests:

| User URL | Nginx Route | Internal Service |
|----------|-------------|------------------|
| `vivuplan.com/` | → | `frontend:3000` |
| `vivuplan.com/api/v1/` | → | `backend:8080` |
| `vivuplan.com/agents/` | → | `agents:4000` |

**User KHÔNG thấy ports 3000, 8080, 4000!**

### 🔒 Firewall CHỈ Mở 2 Ports:

```bash
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
# KHÔNG mở 3000, 8080, 4000! (ports nội bộ)
```

**Lợi ích:**
- ✅ Clean URLs: `vivuplan.com` thay vì `vivuplan.com:3000`
- ✅ Bảo mật: Ports nội bộ không expose ra internet
- ✅ SSL chỉ cần setup cho Nginx, tất cả services được bảo vệ
- ✅ Dễ nhớ: User chỉ nhớ domain

---

## 📦 Bước 1: Chuẩn Bị Code Trên Local

### Files CẦN XÓA Trước Khi Deploy:
```bash
# XÓA các file test/dev này trên VPS (KHÔNG commit)
.env.production          # File test local (có localhost)
frontend/.next/          # Build cache
backend/target/          # Build cache
node_modules/            # Tự build lại
```

### Files GIỮ LẠI (Commit Lên Git):
- ✅ Tất cả `.env.production.template` 
- ✅ Tất cả `Dockerfile.prod`
- ✅ `docker-compose.prod.yml`
- ✅ `nginx/` folder
- ✅ Source code
- ✅ `QUICKSTART.md`, `DEPLOYMENT.md`

### Commit Code:
```bash
git add .
git commit -m "Add production Docker configs"
git push origin main
```

---

## 🖥️ Bước 2: Trên VPS - Cài Đặt Môi Trường

### 2.1 Cài Docker
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
sudo apt install docker-compose-plugin -y

# Kiểm tra
docker --version
docker compose version
```

### 2.2 Firewall (CHỈ Mở 2 Ports!)
```bash
sudo ufw allow 80/tcp    # HTTP - Nginx
sudo ufw allow 443/tcp   # HTTPS - Nginx SSL
sudo ufw allow 22/tcp    # SSH

# ⚠️ KHÔNG mở các ports này (để Nginx proxy):
# sudo ufw allow 3000/tcp  ← ❌ KHÔNG làm (frontend internal)
# sudo ufw allow 8080/tcp  ← ❌ KHÔNG làm (backend internal)
# sudo ufw allow 4000/tcp  ← ❌ KHÔNG làm (agents internal)

sudo ufw enable
```

**Lý do:** Nginx reverse proxy sẽ tự route. User truy cập `vivuplan.com` (port 80/443), Nginx forward tới services nội bộ.

---

## 📁 Bước 3: Upload Code Lên VPS

### Option 1: Git Clone (Khuyến nghị)
```bash
cd /home/your-user/
git clone https://github.com/your-username/EXE_Project.git vivuplan
cd vivuplan
```

### Option 2: SCP Upload
```bash
# Trên local
scp -r c:\Users\Chinh\Documents\GitHub\EXE_Project user@vps-ip:/home/user/vivuplan
```

---

## ⚙️ Bước 4: Cấu Hình Environment

### 4.1 Tạo .env.production (Trong Thư Mục Gốc)

```bash
cd /home/your-user/vivuplan

# Copy template
cp backend/.env.production.template .env.production

# Sửa file
nano .env.production
```

### 4.2 Những Gì CẦN THAY ĐỔI:

**Nếu có DOMAIN:**
```bash
# Tìm và thay tất cả
YOUR_DOMAIN_HERE  →  vivuplan.com    # Domain thật của bạn
localhost         →  vivuplan.com    # (nếu còn)
```

**Nếu dùng IP PUBLIC:**
```bash
# Tìm và thay
YOUR_DOMAIN_HERE  →  123.45.67.89   # IP VPS
localhost         →  123.45.67.89   # (nếu còn)

# LƯU Ý: Dùng IP = KHÔNG có SSL/HTTPS
```

**API Keys (QUAN TRỌNG - BẮT BUỘC):**
```bash
# Trong .env.production, section AGENTS:
OPENAI_API_KEY=YOUR_NEW_KEY_HERE        # ⚠️ PHẢI thay key mới
GOOGLE_API_KEY=YOUR_NEW_KEY_HERE        # ⚠️ PHẢI thay key mới
GROQ_API_KEY=YOUR_NEW_KEY_HERE          # ⚠️ PHẢI thay key mới
TAVILY_API_KEY=YOUR_NEW_KEY_HERE        # ⚠️ PHẢI thay key mới
```

### 4.3 Sửa nginx.conf

```bash
nano nginx/nginx.conf

# Tìm và thay (có 2 chỗ):
server_name YOUR_DOMAIN_HERE;  →  server_name vivuplan.com;
# Hoặc nếu dùng IP:
server_name YOUR_DOMAIN_HERE;  →  server_name 123.45.67.89;
```

---

## 🚀 Bước 5: Deploy!

### 5.1 Build và Chạy
```bash
cd /home/your-user/vivuplan

# Build tất cả services (~6-10 phút lần đầu)
docker compose -f docker-compose.prod.yml up -d --build

# Xem logs real-time
docker compose -f docker-compose.prod.yml logs -f
```

**Đợi cho đến khi thấy:**
- Backend: `Started BackendApplication`
- Frontend: `ready - started server on 0.0.0.0:3000`
- Agents: `Application startup complete`

### 5.2 Kiểm Tra Containers
```bash
docker ps
```

**Phải thấy 4 containers RUNNING:**
- `vivuplan-nginx`
- `vivuplan-backend`
- `vivuplan-frontend`
- `vivuplan-agents`

---

## 🔐 Bước 6: Setup SSL (Chỉ Nếu Có Domain)

### 6.1 Cài Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Xin SSL Certificate
```bash
# Thay vivuplan.com bằng domain thật
sudo certbot --nginx -d vivuplan.com

# Làm theo hướng dẫn:
# - Nhập email
# - Đồng ý Terms
# - Chọn redirect HTTP -> HTTPS
```

### 6.3 Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Nếu OK thì cert sẽ tự động renew
```

---

## ✅ Bước 7: Kiểm Tra

### 7.1 Test Endpoints
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

### 7.2 Test Trên Browser

**Nếu có domain + SSL:**
```
https://vivuplan.com              ← ✅ URL chính thức
https://vivuplan.com/api/v1/      ← API endpoint
```

**Nếu dùng IP (không SSL):**
```
http://123.45.67.89               ← ✅ Truy cập được
http://123.45.67.89/api/v1/       ← API endpoint
```

**❌ KHÔNG cần thêm ports:**
```
http://vivuplan.com:3000          ← ❌ SAI (Nginx đã proxy)
http://123.45.67.89:8080          ← ❌ SAI (ports internal)
```

**Test:**
- ✅ Đăng ký/đăng nhập
- ✅ Search flight/hotel
- ✅ Chatbot
- ⚠️ Payment (cần SSL)

---

## 🔧 Bước 8: PayOS Webhook (Nếu Cần Test Payment)

### 8.1 Update Webhook URL
1. Login vào PayOS dashboard
2. Vào Settings → Webhook
3. Update URL:
   - **Có domain**: `https://vivuplan.com/api/v1/payments/payos/callback`
   - **Dùng IP**: Không test được (cần HTTPS)

### 8.2 Test Webhook
```bash
curl -X POST https://vivuplan.com/api/v1/payments/payos/callback \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🛠️ Commands Hữu Ích

### Quản Lý Services
```bash
# Xem logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart service
docker compose -f docker-compose.prod.yml restart backend

# Stop tất cả
docker compose -f docker-compose.prod.yml down

# Start lại
docker compose -f docker-compose.prod.yml up -d

# Rebuild service sau khi sửa code
docker compose -f docker-compose.prod.yml up -d --build backend
```

### Dọn Dẹp
```bash
# Xóa containers stopped
docker container prune

# Xóa images không dùng
docker image prune -a

# Xóa volumes không dùng
docker volume prune
```

---

## 🐛 Troubleshooting

### Container Không Start
```bash
# Xem logs chi tiết
docker compose -f docker-compose.prod.yml logs backend

# Xem resource
docker stats
```

### Out of Memory
```bash
# Kiểm tra RAM
free -h

# Tăng memory limit trong docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 2G  # Tăng từ 1G
```

### SSL Không Hoạt Động
```bash
# Kiểm tra nginx config
sudo nginx -t

# Restart nginx container
docker compose -f docker-compose.prod.yml restart nginx

# Xem logs
docker logs vivuplan-nginx
```

---

## 📋 Checklist Deploy

### Trước Khi Deploy
- [ ] Code đã commit và push
- [ ] Xóa `.env.production` test local
- [ ] Xóa `frontend/.next/` và `backend/target/`

### Trên VPS
- [ ] Docker và Docker Compose đã cài
- [ ] Firewall mở ports 80, 443
- [ ] Code đã clone/upload
- [ ] `.env.production` đã tạo và sửa đúng:
  - [ ] Thay `YOUR_DOMAIN_HERE` (hoặc IP)
  - [ ] Rotate tất cả API keys
- [ ] `nginx.conf` đã sửa `server_name`
- [ ] `docker compose up -d --build` chạy thành công
- [ ] 4 containers đang running
- [ ] SSL đã setup (nếu có domain)
- [ ] Test trên browser OK
- [ ] PayOS webhook đã update (nếu có)

---

## 🎯 Tóm Tắt Nhanh

```bash
# 1. Trên VPS - Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh

# 2. Clone code
git clone your-repo vivuplan && cd vivuplan

# 3. Tạo .env.production
cp backend/.env.production.template .env.production
nano .env.production  # Thay YOUR_DOMAIN_HERE và API keys

# 4. Sửa nginx
nano nginx/nginx.conf  # Thay YOUR_DOMAIN_HERE

# 5. Deploy
docker compose -f docker-compose.prod.yml up -d --build

# 6. SSL (nếu có domain)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com

# 7. Test
curl http://localhost:8080/actuator/health
```

**Done!** 🎉 Truy cập `https://your-domain.com` hoặc `http://your-ip`

---

## 📞 Nếu Gặp Lỗi

1. Xem logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Kiểm tra `.env.production` đã điền đúng chưa
3. Kiểm tra domain/IP đã trỏ đúng chưa
4. Kiểm tra ports 80, 443 có mở không
5. Restart services: `docker compose -f docker-compose.prod.yml restart`
