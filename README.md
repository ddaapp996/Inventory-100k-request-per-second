# Hệ Thống Quản Lý Kho Hàng

Đây là Hệ Thống Quản Lý Kho Hàng được xây dựng với NestJS (backend), React (frontend), MySQL (database), Redis (caching), và NGINX (reverse proxy). Hệ thống hỗ trợ các hoạt động hiệu suất cao với clustering và được thiết kế để xử lý lên đến 100k requests mỗi giây (đã test cục bộ lên đến ~46k requests/s).

## Mục Lục

- [Tổng Quan Dự Án](#tổng-quan-dự-án)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt](#cài-đặt)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Đẩy Lên GitHub](#đẩy-lên-github)
- [Kiểm Tra Tải](#kiểm-tra-tải)
- [Tối Ưu Hóa](#tối-ưu-hóa)
- [Đóng Góp](#đóng-góp)
- [Giấy Phép](#giấy-phép)

## Tổng Quan Dự Án

Dự án này là một hệ thống quản lý kho hàng full-stack:

- **Backend**: NestJS với Node.js 22, sử dụng clustering để mở rộng quy mô.
- **Frontend**: React cho giao diện người dùng.
- **Database**: MySQL cho lưu trữ dữ liệu bền vững.
- **Caching**: Redis cho truy xuất dữ liệu nhanh.
- **Reverse Proxy**: NGINX cho cân bằng tải và caching.

Hệ thống được tối ưu hóa cho thông lượng cao, với kiểm tra tải được thực hiện bằng k6 để đạt được ~46k requests/s trên máy cục bộ.

## Yêu Cầu Hệ Thống

- **Node.js**: Phiên bản 22.x
- **Docker**: Để chạy các container MySQL và Redis
- **NGINX**: Cài đặt qua Homebrew (MacOS) hoặc Docker
- **MySQL**: Phiên bản 8.x
- **Redis**: Phiên bản 6.x
- **k6**: Để kiểm tra tải
- **Git**: Để quản lý phiên bản
- **Hệ điều hành**: MacOS, Linux, hoặc Windows (khuyến nghị MacOS cho phát triển cục bộ)

## Cài Đặt

Làm theo các bước sau để thiết lập dự án cục bộ.

### 1. Clone Repository

```bash
git clone git@github.com:ddaapp996/Inventory-100k-request-per-second.git
cd inventory-system
```

### 2. Cài Đặt Dependencies Backend

Điều hướng đến thư mục backend và cài đặt dependencies:

```bash
cd backend
npm install
```

### 3. Cài Đặt Dependencies Frontend

Điều hướng đến thư mục frontend và cài đặt dependencies:

```bash
cd ../frontend
npm install
```

### 4. Thiết Lập MySQL

Chạy container MySQL bằng Docker:

```bash
docker run -d -p 3306:3306 --name mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=inventory mysql:8
```

Tạo các index cần thiết:

```bash
mysql -u root -p
# Nhập mật khẩu: root
USE inventory;
CREATE INDEX idx_id ON inventory(id);
```

### 5. Thiết Lập Redis

Chạy container Redis:

```bash
docker run -d -p 6379:6379 --name redis redis:6 --maxclients 10000
```

### 6. Thiết Lập NGINX

#### MacOS (Homebrew)

Cài đặt NGINX:

```bash
brew install nginx
```

Tạo hoặc cập nhật file cấu hình NGINX tại `/opt/homebrew/etc/nginx/servers/inventory.conf`:

```nginx
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

upstream backend {
  server localhost:3000;
  keepalive 64;
}

server {
  listen 80;
  location /inventory/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 60s;
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
  }
  location / {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

Cập nhật `/opt/homebrew/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
events {
  worker_connections 8192;
  multi_accept on;
  use kqueue;
}
http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  client_max_body_size 10m;
  client_body_buffer_size 128k;
}
```

Khởi động lại NGINX:

```bash
brew services restart nginx
```

#### Docker

Chạy NGINX trong container Docker và mount cấu hình:

```bash
docker run -d -p 80:80 --name nginx -v $(pwd)/nginx-config/inventory.conf:/etc/nginx/conf.d/inventory.conf nginx
```

### 7. Cài Đặt k6 để Kiểm Tra Tải

```bash
brew install k6
```

## Chạy Ứng Dụng

### Khởi động MySQL và Redis:

```bash
docker start mysql redis
```

### Khởi động Backend (NestJS):

```bash
cd backend
npm run start:dev
```

Log mong đợi:
```
Primary 12345 is running, forking 4 workers
Worker 12346 is running on port 3000
...
```

### Khởi động Frontend (React):

```bash
cd frontend
npm start
```

Frontend chạy trên http://localhost:3001.

### Truy Cập Ứng Dụng:

- **Backend API**: http://localhost/inventory/1
- **Frontend**: http://localhost

## Đẩy Lên GitHub

Để đẩy repository này lên GitHub, làm theo các bước sau:

### Khởi tạo Git (nếu chưa làm):

```bash
git init
```

### Thêm Files:

```bash
git add .
```

### Commit Changes:

```bash
git commit -m "Initial commit"
```

### Tạo Repository GitHub:

1. Đi đến GitHub và tạo repository mới (ví dụ: Inventory-100k-request-per-second).
2. Sao chép URL repository (ví dụ: git@github.com:ddaapp996/Inventory-100k-request-per-second.git).

### Liên Kết với Remote Repository:

```bash
git remote add origin git@github.com:ddaapp996/Inventory-100k-request-per-second.git
```

### Đẩy lên GitHub:

```bash
git push -u origin main
```

### Xác minh:
Kiểm tra repository GitHub để đảm bảo tất cả files đã được upload.

## Kiểm Tra Tải

Hệ thống đã được test để xử lý ~46k requests/s với 500 VUs sử dụng k6. Để chạy kiểm tra tải:

### Tạo load-test.js:

```javascript
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 500,
  duration: '10s',
};

export default function () {
  http.get('http://localhost/inventory/1');
  sleep(0.01);
}
```

### Chạy Kiểm Tra Tải:

```bash
k6 run load-test.js
```

### Phân Tích Kết Quả:

Hiệu suất hiện tại: ~46k requests/s, độ trễ trung bình ~0.62ms, không có lỗi.
Để nhắm đến 100k requests/s, tăng VUs lên 1000-2000 hoặc triển khai lên cloud.

## Tối Ưu Hóa

Để cải thiện hiệu suất hướng đến 100k requests/s:

### NGINX:
- Tăng worker_connections lên 8192+.
- Bật rate limiting:
```nginx
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1000r/s;
server {
  location /inventory/ {
    limit_req zone=mylimit burst=2000;
  }
}
```

### Backend:
- Tăng workers trong backend/src/main.ts:
```typescript
const numCPUs = cpus().length * 2;
```

- Chạy nhiều instances:
```bash
PORT=3000 npm run start:dev &
PORT=3001 npm run start:dev &
```

### Redis:
Đảm bảo tỷ lệ cache hit cao (INFO STATS trong Redis CLI).

### MySQL:
Thêm indexes và bật slow query log:
```sql
SET GLOBAL slow_query_log = 'ON';
```

### Triển Khai Cloud:
Sử dụng AWS ECS/EKS, ElastiCache, RDS, và ALB để mở rộng quy mô.

## Đóng Góp

1. Fork repository.
2. Tạo branch mới: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "Add your feature"`.
4. Push lên branch: `git push origin feature/your-feature`.
5. Tạo Pull Request trên GitHub.

## Giấy Phép

Dự án này được cấp phép theo MIT License.
