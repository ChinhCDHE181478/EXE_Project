# 🚀 Hướng Dẫn Deploy Nhanh (3 Bước)

## Bước 1: Chuẩn Bị File Cấu Hình

### Option 1: Tạo .env.production trong thư mục gốc (Khuyến nghị)
```bash
# Tạo 1 file .env.production duy nhất
cp backend/.env.production.template .env.production
nano .env.production  # Thay YOUR_DOMAIN_HERE và các giá trị
```

### Option 2: Hoặc tạo trong từng thư mục service
```bash
cp backend/.env.production.template backend/.env.production
cp frontend/.env.production.template frontend/.env.production
cp agents/.env.production.template agents/.env.production
```

**Quan trọng:** 
- Thay `YOUR_DOMAIN_HERE` bằng domain thật
- File `.env` cũ (dev) có thể XÓA hoặc GIỮ (không ảnh hưởng)
- `localhost` trong templates → Docker sẽ dùng internal network, KHÔNG cần IP public

## Bước 2: Chạy Docker

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Đợi 2-3 phút để build xong.

## Bước 3: Cài SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN_HERE
```

## ✅ Xong!

Truy cập: `https://YOUR_DOMAIN_HERE`

---

## 🔧 Lệnh Hữu Ích

**Xem log:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Restart service:**
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

**Stop tất cả:**
```bash
docker-compose -f docker-compose.prod.yml down
```

---

## ⚠️ Lưu Ý Trước Khi Deploy

- [ ] Đã thay tất cả `YOUR_DOMAIN_HERE` trong các file `.env.production`
- [ ] Đã thay `YOUR_DOMAIN_HERE` trong `nginx/nginx.conf`
- [ ] Đã rotate API keys trong `agents/.env.production` (keys cũ bị lộ)
- [ ] Domain đã trỏ về IP của VPS
- [ ] Ports 80, 443, 8080 đã mở trên firewall

---

## ❓ Câu Hỏi Thường Gặp

**Q: Có cần xóa file `.env` cũ không?**  
A: KHÔNG cần. File `.env` cho dev local, `.env.production` cho VPS. Giữ cả 2 hoặc xóa `.env` trên VPS đều OK.

**Q: `localhost` trong docker-compose có lỗi trên VPS không?**  
A: KHÔNG lỗi. `localhost` là cho Docker internal network, không phải IP public của VPS.

**Q: Có cần xóa `Dockerfile` cũ không?**  
A: KHÔNG. Giữ cả `Dockerfile` (dev) và `Dockerfile.prod` (production).

**Q: Docker load env từ đâu?**  
A: Docker-compose đọc file `.env.production` và pass vào containers qua `environment` section.

Muốn chi tiết hơn → đọc `DEPLOYMENT.md`
