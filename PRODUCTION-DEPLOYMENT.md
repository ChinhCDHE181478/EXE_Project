# 🚀 Production Deployment Guide - VivuPlan VPS

Hướng dẫn triển khai production cho **Backend (Spring Boot)**, **Frontend (Next.js)**, và **Agents (FastAPI)** trên VPS riêng.

---

## 📋 Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Chuẩn bị VPS](#chuẩn-bị-vps)
3. [Cài đặt PostgreSQL](#cài-đặt-postgresql)
4. [Cài đặt Redis](#cài-đặt-redis)
5. [Triển khai Backend](#triển-khai-backend)
6. [Triển khai Agents](#triển-khai-agents)
7. [Triển khai Frontend](#triển-khai-frontend)
8. [Cấu hình Nginx](#cấu-hình-nginx)
9. [Cấu hình SSL/HTTPS](#cấu-hình-sslhttps)
10. [Quản lý Process với systemd](#quản-lý-process-với-systemd)
11. [Monitoring & Logs](#monitoring--logs)
12. [Backup & Restore](#backup--restore)

---

## 🔧 Yêu cầu hệ thống

### Phần cứng tối thiểu
- **CPU**: 2 cores
- **RAM**: 4GB (khuyến nghị 8GB)
- **Storage**: 20GB SSD
- **Network**: 100 Mbps

### Hệ điều hành
- Ubuntu 22.04 LTS (khuyến nghị)
- hoặc Ubuntu 20.04 LTS
- hoặc CentOS 8+

### Phần mềm cần cài
- Java 17 (cho Backend)
- Node.js 20.x (cho Frontend)
- Python 3.11+ (cho Agents)
- PostgreSQL 15+
- Redis 7+
- Nginx
- Git

---

## 🖥️ Chuẩn bị VPS

### 1. Cập nhật hệ thống

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Cài đặt các công cụ cơ bản

```bash
sudo apt install -y curl wget git build-essential ufw certbot python3-certbot-nginx
```

### 3. Cấu hình Firewall

```bash
# Cho phép SSH
sudo ufw allow 22/tcp

# Cho phép HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Kích hoạt firewall
sudo ufw enable
```

### 4. Tạo user cho application (không dùng root)

```bash
sudo adduser vivuplan
sudo usermod -aG sudo vivuplan
su - vivuplan
```

---

## 🐘 Cài đặt PostgreSQL

### 1. Cài đặt PostgreSQL 15

```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2. Khởi động và enable service

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Tạo database và user

```bash
sudo -u postgres psql

-- Trong PostgreSQL shell:
CREATE USER vivuplan_user WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE vivuplan_db OWNER vivuplan_user;
GRANT ALL PRIVILEGES ON DATABASE vivuplan_db TO vivuplan_user;

-- Thoát
\q
```

### 4. Cấu hình cho remote access (nếu cần)

Chỉnh sửa `/etc/postgresql/15/main/postgresql.conf`:
```
listen_addresses = 'localhost'  # Giữ localhost cho bảo mật
```

Chỉnh sửa `/etc/postgresql/15/main/pg_hba.conf`:
```
# Local connections
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

Khởi động lại:
```bash
sudo systemctl restart postgresql
```

---

## 📦 Cài đặt Redis

### 1. Cài đặt Redis

```bash
sudo apt install -y redis-server
```

### 2. Cấu hình Redis

Chỉnh sửa `/etc/redis/redis.conf`:
```
# Bind to localhost only
bind 127.0.0.1 ::1

# Set password
requirepass your_redis_password_here

# Enable persistence
appendonly yes
```

### 3. Khởi động Redis

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 4. Test kết nối

```bash
redis-cli
AUTH your_redis_password_here
PING
# Kết quả: PONG
```

---

## ☕ Triển khai Backend

### 1. Cài đặt Java 17

```bash
sudo apt install -y openjdk-17-jdk
java -version
```

### 2. Clone repository

```bash
cd /home/vivuplan
git clone https://github.com/your-username/EXE_Project.git
cd EXE_Project/backend
```

### 3. Tạo file .env cho production

Tạo file `/home/vivuplan/EXE_Project/backend/.env.production`:

```env
# Database
DATABASE_URL=localhost:5432
DATABASE_NAME=vivuplan_db
DATABASE_USERNAME=vivuplan_user
DATABASE_PASSWORD=your_strong_password_here

# JWT
JWT_SECRET_KEY=your_jwt_secret_key_at_least_32_chars_long_random_string
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# PayOS
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_WEBHOOK_URL=https://yourdomain.com/api/v1/payment/payos-webhook

# RapidAPI
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST_FLIGHT=skyscanner-api.p.rapidapi.com
RAPIDAPI_HOST_HOTEL=apidojo-booking-v1.p.rapidapi.com

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

### 4. Build backend

```bash
# Cài Maven
sudo apt install -y maven

# Build project
cd /home/vivuplan/EXE_Project/backend
mvn clean package -DskipTests
```

### 5. Chạy backend (test)

```bash
# Export environment variables
export $(cat .env.production | xargs)

# Chạy JAR file
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Kiểm tra: `http://your-vps-ip:8080/api/v1/swagger-ui.html`

---

## 🐍 Triển khai Agents

### 1. Cài đặt Python 3.11

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip
```

### 2. Tạo virtual environment

```bash
cd /home/vivuplan/EXE_Project/agents
python3.11 -m venv venv
source venv/bin/activate
```

### 3. Cài đặt dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Tạo file .env cho production

Tạo file `/home/vivuplan/EXE_Project/agents/.env.production`:

```env
# PostgreSQL
POSTGRES_USER=vivuplan_user
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vivuplan_db

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Backend URL
BACKEND_URL=http://localhost:8080/api/v1

# Server
HOST=0.0.0.0
PORT=4000

# Connection Pool
CONNECTION_POOL_SIZE=10
```

### 5. Chạy agents (test)

```bash
# Với .env.production
source venv/bin/activate
python main.py
```

Kiểm tra: `http://your-vps-ip:4000/docs`

---

## ⚛️ Triển khai Frontend

### 1. Cài đặt Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 2. Build frontend

```bash
cd /home/vivuplan/EXE_Project/frontend
npm install
```

### 3. Tạo file .env.production

Tạo file `/home/vivuplan/EXE_Project/frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
NEXT_PUBLIC_AGENTS_URL=https://yourdomain.com/agents
```

### 4. Build production

```bash
npm run build
```

### 5. Chạy frontend (test)

```bash
npm run start
```

Kiểm tra: `http://your-vps-ip:3000`

---

## 🌐 Cấu hình Nginx

### 1. Cài đặt Nginx

```bash
sudo apt install -y nginx
```

### 2. Tạo cấu hình cho domain

Tạo file `/etc/nginx/sites-available/vivuplan`:

```nginx
# Backend upstream
upstream backend {
    server 127.0.0.1:8080;
}

# Agents upstream
upstream agents {
    server 127.0.0.1:4000;
}

# Frontend upstream
upstream frontend {
    server 127.0.0.1:3000;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # For Certbot validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (sẽ được tạo bởi Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API
    location /api/v1/ {
        proxy_pass http://backend/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Agents API
    location /agents/ {
        proxy_pass http://agents/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for AI processing
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Kích hoạt cấu hình

```bash
sudo ln -sf /etc/nginx/sites-available/vivuplan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Cấu hình SSL/HTTPS

### 1. Cài đặt SSL với Let's Encrypt

```bash
# Dừng nginx tạm thời
sudo systemctl stop nginx

# Lấy SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Khởi động lại nginx
sudo systemctl start nginx
```

### 2. Tự động gia hạn SSL

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot sẽ tự động gia hạn, nhưng có thể thêm cron job:
sudo crontab -e

# Thêm dòng sau:
0 0 * * * certbot renew --quiet && systemctl reload nginx
```

---

## 🔄 Quản lý Process với systemd

### 1. Service cho Backend

Tạo file `/etc/systemd/system/vivuplan-backend.service`:

```ini
[Unit]
Description=VivuPlan Backend Service
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=vivuplan
WorkingDirectory=/home/vivuplan/EXE_Project/backend
EnvironmentFile=/home/vivuplan/EXE_Project/backend/.env.production
ExecStart=/usr/bin/java -Xms512m -Xmx2g -jar /home/vivuplan/EXE_Project/backend/target/backend-0.0.1-SNAPSHOT.jar
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/vivuplan/backend.log
StandardError=append:/var/log/vivuplan/backend-error.log

[Install]
WantedBy=multi-user.target
```

### 2. Service cho Agents

Tạo file `/etc/systemd/system/vivuplan-agents.service`:

```ini
[Unit]
Description=VivuPlan Agents Service
After=network.target postgresql.service

[Service]
Type=simple
User=vivuplan
WorkingDirectory=/home/vivuplan/EXE_Project/agents
Environment="PATH=/home/vivuplan/EXE_Project/agents/venv/bin"
EnvironmentFile=/home/vivuplan/EXE_Project/agents/.env.production
ExecStart=/home/vivuplan/EXE_Project/agents/venv/bin/python main.py
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/vivuplan/agents.log
StandardError=append:/var/log/vivuplan/agents-error.log

[Install]
WantedBy=multi-user.target
```

### 3. Service cho Frontend

Tạo file `/etc/systemd/system/vivuplan-frontend.service`:

```ini
[Unit]
Description=VivuPlan Frontend Service
After=network.target

[Service]
Type=simple
User=vivuplan
WorkingDirectory=/home/vivuplan/EXE_Project/frontend
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/vivuplan/frontend.log
StandardError=append:/var/log/vivuplan/frontend-error.log

[Install]
WantedBy=multi-user.target
```

### 4. Tạo thư mục logs

```bash
sudo mkdir -p /var/log/vivuplan
sudo chown vivuplan:vivuplan /var/log/vivuplan
```

### 5. Kích hoạt và khởi động services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable vivuplan-backend
sudo systemctl enable vivuplan-agents
sudo systemctl enable vivuplan-frontend

# Start services
sudo systemctl start vivuplan-backend
sudo systemctl start vivuplan-agents
sudo systemctl start vivuplan-frontend

# Check status
sudo systemctl status vivuplan-backend
sudo systemctl status vivuplan-agents
sudo systemctl status vivuplan-frontend
```

---

## 📊 Monitoring & Logs

### 1. Xem logs realtime

```bash
# Backend logs
sudo journalctl -u vivuplan-backend -f

# Agents logs
sudo journalctl -u vivuplan-agents -f

# Frontend logs
sudo journalctl -u vivuplan-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Xem logs trong file

```bash
tail -f /var/log/vivuplan/backend.log
tail -f /var/log/vivuplan/agents.log
tail -f /var/log/vivuplan/frontend.log
```

### 3. Kiểm tra trạng thái services

```bash
sudo systemctl status vivuplan-backend
sudo systemctl status vivuplan-agents
sudo systemctl status vivuplan-frontend
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
```

### 4. Restart services

```bash
sudo systemctl restart vivuplan-backend
sudo systemctl restart vivuplan-agents
sudo systemctl restart vivuplan-frontend
sudo systemctl restart nginx
```

---

## 💾 Backup & Restore

### 1. Backup Database

```bash
# Tạo backup directory
mkdir -p /home/vivuplan/backups

# Backup PostgreSQL
sudo -u postgres pg_dump vivuplan_db > /home/vivuplan/backups/vivuplan_db_$(date +%Y%m%d_%H%M%S).sql

# Backup với compression
sudo -u postgres pg_dump vivuplan_db | gzip > /home/vivuplan/backups/vivuplan_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 2. Restore Database

```bash
# Restore từ file backup
sudo -u postgres psql vivuplan_db < /home/vivuplan/backups/vivuplan_db_20260217.sql

# Restore từ file compressed
gunzip -c /home/vivuplan/backups/vivuplan_db_20260217.sql.gz | sudo -u postgres psql vivuplan_db
```

### 3. Automated Backup Script

Tạo file `/home/vivuplan/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/vivuplan/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
sudo -u postgres pg_dump vivuplan_db | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

Thêm vào crontab:
```bash
crontab -e
# Chạy backup hàng ngày lúc 2h sáng
0 2 * * * /home/vivuplan/scripts/backup.sh
```

---

## 🚀 Deployment Checklist

- [ ] VPS đã cài đặt đầy đủ dependencies
- [ ] PostgreSQL và Redis đã được cấu hình
- [ ] Tất cả 3 services đã build thành công
- [ ] File .env.production đã được tạo cho cả 3 services
- [ ] Systemd services đã được tạo và enable
- [ ] Nginx đã được cấu hình đúng
- [ ] SSL certificate đã được cài đặt
- [ ] Firewall đã được cấu hình
- [ ] Tất cả services đang chạy (check bằng systemctl status)
- [ ] Domain đã trỏ đúng IP VPS
- [ ] Website accessible qua HTTPS
- [ ] Backend API hoạt động (test qua Swagger)
- [ ] Frontend load được
- [ ] Agents API hoạt động
- [ ] Backup script đã được cấu hình
- [ ] Logs đang được ghi đúng

---

## 🔧 Troubleshooting

### Backend không khởi động

```bash
# Check logs
sudo journalctl -u vivuplan-backend -n 100

# Common issues:
# - Database connection failed: Check DATABASE_URL, username, password
# - Port already in use: lsof -i :8080
# - Out of memory: Increase -Xmx in systemd service
```

### Frontend lỗi 502 Bad Gateway

```bash
# Check if frontend is running
sudo systemctl status vivuplan-frontend

# Check if port 3000 is listening
sudo lsof -i :3000

# Check frontend logs
tail -f /var/log/vivuplan/frontend.log
```

### Agents không kết nối được database

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U vivuplan_user -d vivuplan_db

# Check agents logs
tail -f /var/log/vivuplan/agents.log
```

### SSL certificate issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates

# Reload nginx after renewal
sudo systemctl reload nginx
```

---

## 📞 Support

Nếu gặp vấn đề trong quá trình deployment, kiểm tra:
1. Logs của từng service
2. Nginx error logs
3. Database connectivity
4. Environment variables
5. Firewall rules

---

**Chúc bạn deployment thành công! 🎉**
