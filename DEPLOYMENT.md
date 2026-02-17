# 📚 Hướng Dẫn Deploy Production - VPS Linux

Hướng dẫn chi tiết deploy VivuPlan lên VPS với Docker + Nginx + SSL.

---

## 📋 Yêu Cầu

### VPS
- **OS**: Ubuntu 20.04+/ Debian 11+ 
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **CPU**: 2 cores+
- **Disk**: 20GB+
- **Domain**: Đã trỏ về IP của VPS

### Phần Mềm
```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
sudo apt install docker-compose-plugin

# Kiểm tra
docker --version
docker compose version
```

### Firewall
```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

---

## 🚀 Bước 1: Chuẩn Bị Code

### 1.1 Clone/Upload Code Lên VPS
```bash
cd /home/your-user/
git clone your-repo-url vivuplan
cd vivuplan
```

### 1.2 Tạo File .env.production

**Backend:**
```bash
cp backend/.env.production.template backend/.env.production
nano backend/.env.production
```
Thay đổi:
- `YOUR_DOMAIN_HERE` → domain thật (vd: `api.vivuplan.com`)
- Kiểm tra Supabase credentials
- Rotate JWT keys nếu cần

**Frontend:**
```bash
cp frontend/.env.production.template frontend/.env.production
nano frontend/.env.production
```
Thay đổi:
- `YOUR_DOMAIN_HERE` → domain thật

**Agents:**
```bash
cp agents/.env.production.template agents/.env.production
nano agents/.env.production
```
⚠️ **QUAN TRỌNG**: Thay ĐỔI TẤT CẢ API KEYS (keys cũ đã bị lộ):
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`  
- `GROQ_API_KEY`
- `TAVILY_API_KEY`

### 1.3 Cập Nhật Nginx Config
```bash
nano nginx/nginx.conf
```
Thay tất cả `YOUR_DOMAIN_HERE` bằng domain thật.

---

## 🔐 Bước 2: Setup SSL (Let's Encrypt)

### 2.1 Cài Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2.2 Chạy Docker Trước (để Nginx lên)
```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

### 2.3 Xin SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

Certbot sẽ tự động:
- Tạo certificates
- Cập nhật nginx.conf
- Setup auto-renewal

### 2.4 Kiểm Tra Auto-Renewal
```bash
sudo certbot renew --dry-run
```

---

## 🐳 Bước 3: Deploy với Docker

### 3.1 Build & Start Tất Cả Services
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Chờ 3-5 phút cho:
- Backend build (Maven)
- Frontend build (Next.js)
- Agents build (Python)

### 3.2 Kiểm Tra Containers
```bash
docker ps
```
Phải thấy 4 containers running:
- `vivuplan-nginx`
- `vivuplan-backend`
- `vivuplan-frontend`
- `vivuplan-agents`

### 3.3 Xem Logs
```bash
# Tất cả services
docker compose -f docker-compose.prod.yml logs -f

# Hoặc từng service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f agents
```

---

## ✅ Bước 4: Kiểm Tra

### 4.1 Health Checks
```bash
# Nginx
curl https://your-domain.com/health

# Backend
curl http://localhost:8080/actuator/health

# Frontend  
curl http://localhost:3000

# Agents
curl http://localhost:4000/health
```

### 4.2 Test Trên Browser
- Mở `https://your-domain.com`
- Đăng nhập/đăng ký
- Test search chuyến bay/khách sạn
- Test chatbot AI

---

## 🔧 Các Lệnh Hữu Ích

### Quản Lý Services
```bash
# Restart service cụ thể
docker compose -f docker-compose.prod.yml restart backend

# Stop tất cả
docker compose -f docker-compose.prod.yml down

# Start lại
docker compose -f docker-compose.prod.yml up -d

# Rebuild sau khi sửa code
docker compose -f docker-compose.prod.yml up -d --build backend
```

### Xem Logs
```bash
# Real-time logs
docker compose -f docker-compose.prod.yml logs -f

# 100 dòng cuối
docker compose -f docker-compose.prod.yml logs --tail=100

# Logs của 1 service
docker logs vivuplan-backend -f
```

### Vào Container
```bash
# Backend
docker exec -it vivuplan-backend bash

# Frontend
docker exec -it vivuplan-frontend sh

# Agents
docker exec -it vivuplan-agents bash
```

---

## 🔄 Update Code

Khi có code mới:

```bash
# 1. Pull code mới
cd /home/your-user/vivuplan
git pull

# 2. Rebuild services cần update
docker compose -f docker-compose.prod.yml up -d --build backend

# 3. Kiểm tra logs
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 🐛 Troubleshooting

### Container không start
```bash
# Xem logs chi tiết
docker compose -f docker-compose.prod.yml logs service-name

# Xem resource usage
docker stats
```

### Out of memory
```bash
# Tăng memory limit trong docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 2G  # tăng từ 1G
```

### SSL expired
```bash
# Renew manually
sudo certbot renew

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### PayOS Webhook không hoạt động
Kiểm tra:
1. Domain đã đúng trong `backend/.env.production`?
2. URL webhook trong PayOS dashboard đã update?
3. Nginx proxy đúng endpoint `/api/v1/payments/payos/callback`?

Test webhook:
```bash
curl -X POST https://your-domain.com/api/v1/payments/payos/callback \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📊 Monitoring

### Disk Usage
```bash
# Xem disk usage
df -h

# Dọn dẹp Docker
docker system prune -a
```

### Database (Supabase)
- Login vào Supabase dashboard
- Xem table usage, connections
- Setup backup nếu cần

### Logs
```bash
# Rotate logs để không đầy disk
sudo nano /etc/logrotate.d/docker
```

---

## 🚨 Lưu Ý Quan Trọng

### Bảo Mật
- [ ] Đã thay TẤT CẢ API keys trong `agents/.env.production`
- [ ] Đã rotate JWT keys trong `backend/.env.production`
- [ ] File `.env.production` KHÔNG commit lên Git
- [ ] Firewall chỉ mở ports 80, 443, 22

### Domain
- [ ] Đã thay `YOUR_DOMAIN_HERE` trong 3 file `.env.production`
- [ ] Đã thay `YOUR_DOMAIN_HERE` trong `nginx/nginx.conf`
- [ ] PayOS webhook URL đã update trong PayOS dashboard
- [ ] Domain đã trỏ đúng IP VPS (A record)

### Performance
- [ ] Build frontend với `npm run build` (không phải `dev`)
- [ ] Java heap size đủ lớn cho backend
- [ ] Agents có đủ memory cho AI models

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Xem logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Kiểm tra health checks
3. Verify environment variables đã đúng

Good luck! 🚀
