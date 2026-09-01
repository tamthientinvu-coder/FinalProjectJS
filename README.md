# LearnQuiz — Nền Tảng Học Tập & Quiz Trực Tuyến

Đồ án tốt nghiệp **Lập trình Full-stack JavaScript — Khóa 312**, Trung Tâm Tin Học, ĐH KHTN TP.HCM.
Đề tài số 4.

📄 Tài liệu đồ án: **[`docs/DE-AN.md`](docs/DE-AN.md)** · 🚀 Hướng dẫn triển khai: **[`docs/DEPLOY.md`](docs/DEPLOY.md)**

🌐 **Đang chạy thật:** Frontend [final-project-js-ten.vercel.app](https://final-project-js-ten.vercel.app/) · Backend [learnquiz-api.onrender.com](https://learnquiz-api.onrender.com/) ([`/health`](https://learnquiz-api.onrender.com/health)) · Mã nguồn [github.com/tamthientinvu-coder/FinalProjectJS](https://github.com/tamthientinvu-coder/FinalProjectJS)

| | |
|---|---|
| **Backend** | Node.js · Express · TypeScript · Prisma · PostgreSQL |
| **Frontend** | React 19 · TypeScript · Vite · MUI · React Router · React Hook Form |
| **Hạ tầng** | RESTful API `/api/v1` · Docker · Render (BE) · Vercel (FE) · Vercel Speed Insights & Analytics · Uptime ping (GitHub Actions) |
| **AI** | Google Gemini — sinh quiz, giải thích đáp án sai, tóm tắt bài học |

---

## Chạy dự án trong 3 bước

### 1. Cơ sở dữ liệu

```bash
docker compose up -d
```
PostgreSQL chạy ở cổng `5433`, Adminer ở <http://localhost:8080>.
*(Nếu đã cài sẵn PostgreSQL, bỏ qua bước này và sửa `DATABASE_URL` trong `backend/.env`.)*

### 2. Backend

```bash
cd backend
copy .env.example .env               # macOS/Linux: cp .env.example .env
npm install
npx prisma migrate dev --name init   # tạo 11 bảng
npm run seed                         # nạp dữ liệu mẫu
npm run dev
```

Kiểm tra: <http://localhost:3000/health> phải trả `{"status":"ok","db":"up"}`

### 3. Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Mở <http://localhost:5173>

---

## Tài khoản demo

Mật khẩu chung: **`123456`**

| Vai trò | Email |
|---|---|
| Quản trị | `admin@learnquiz.vn` |
| Giảng viên | `instructor@learnquiz.vn` |
| Giảng viên 2 | `instructor2@learnquiz.vn` |
| Học viên | `student@learnquiz.vn` |
| Học viên 2 | `student2@learnquiz.vn` |

---

## Các lệnh thường dùng

### Backend
| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy server, tự khởi động lại khi sửa code |
| `npm run build` | Biên dịch TypeScript sang `dist/` |
| `npm run typecheck` | Kiểm tra kiểu, không xuất file |
| `npm run seed` | Tạo lại dữ liệu mẫu; xóa dữ liệu nghiệp vụ hiện có |
| `npm test` | Chạy 344 phép kiểm thử — không cần cơ sở dữ liệu |
| `npm run test:unit` | Chỉ chạy phần kiểm thử hàm thuần (nhanh nhất) |
| `npx prisma migrate dev --name <tên>` | Tạo migration sau khi sửa `schema.prisma` |
| `npx prisma studio` | Xem và sửa dữ liệu bằng giao diện web (CSDL cục bộ) |
| `npm run studio:prod` | Như trên nhưng cho CSDL thật trên Render — cần tạo `backend/.env.production.local` trước, xem [`docs/DEPLOY.md`](docs/DEPLOY.md#13-quản-lý-dữ-liệu-bằng-prisma-studio-từ-máy-tính) |

### Frontend
| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy Vite dev server |
| `npm run build` | Kiểm tra kiểu rồi build ra `dist/` |
| `npm test` | Chạy 10 phép kiểm thử Vitest |
| `npm run preview` | Xem thử bản build |

---

## Tiến độ

- [x] **Sprint 0** — Khung dự án · lược đồ CSDL 11 bảng · đăng ký / đăng nhập / refresh token / phân quyền
- [x] **Sprint 1** — Danh mục & Khóa học (CRUD, gửi duyệt, lọc, sắp xếp, phân trang)
- [x] **Sprint 2** — Bài học (soạn, sắp xếp thứ tự) · Đăng ký học · Học theo lộ trình · Tiến độ
- [x] **Sprint 3** — Quiz: soạn đề, làm bài, server chấm điểm, xem lại đáp án, làm lại · 111 phép kiểm thử
- [x] **Sprint 4** — Duyệt khóa học · Quản lý người dùng · Thống kê · 253 phép kiểm thử
- [x] **Sprint 5** — Tích hợp Gemini · Docker · CI/CD · Deploy · 344 phép kiểm thử

---

## Chạy trọn bộ bằng Docker

```bash
# Windows PowerShell
Copy-Item .env.example .env
# Mở .env và thay hai JWT secret bằng hai chuỗi ngẫu nhiên khác nhau

docker compose -f docker-compose.full.yml up --build
# Chỉ chạy seed lần đầu trên môi trường demo trống; lệnh này xóa dữ liệu nghiệp vụ hiện có
docker compose -f docker-compose.full.yml exec backend npm run seed
```

Frontend ở <http://localhost:8080>, API ở <http://localhost:3000>.

---

## Lưu ý quan trọng

- **Không commit file `.env`.** Chỉ commit `.env.example`. File `.gitignore` đã chặn sẵn.
- Sau mỗi lần sửa `prisma/schema.prisma`, phải chạy `npx prisma migrate dev` rồi `npx prisma generate`.
- API key Gemini chỉ đặt ở `backend/.env` — không bao giờ đặt ở frontend, vì mọi biến `VITE_*` đều lộ ra trình duyệt.
