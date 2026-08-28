# 🚀 Phân Tích & Lựa Chọn Hạ Tầng Triển Khai: Vercel vs Render Cho Đồ Án 4 (LearnQuiz)

> **Khóa học:** JS26 - Lập trình viên Full-stack JavaScript - Khóa 312  
> **Đề tài 4:** LEARNQUIZ — Nền tảng học tập & Quiz trực tuyến  
> **Kiến trúc:** Client–Server tách rời (React 19 + Express + PostgreSQL + Prisma + Google Gemini AI)  

---

## 📌 Tóm Tắt Khuyến Nghị

> **KẾT HỢP CẢ HAI: Vercel (Frontend) + Render (Backend & Database PostgreSQL)**

Đây là mô hình kiến trúc chuẩn Full-Stack được thiết kế tối ưu nhất cho đồ án tốt nghiệp, phát huy 100% thế mạnh chuyên biệt của từng nền tảng mà không tốn chi phí (toàn bộ dùng gói Free).

---

## 📊 Bảng So Sánh Chi Tiết Vercel & Render

| Tiêu chí so sánh | 🌐 Vercel (Dành cho Frontend) | ⚙️ Render (Dành cho Backend & Database) |
|---|---|---|
| **Thành phần đảm nhiệm** | **`frontend/`** (React 19, Vite, MUI, React Router) | **`backend/`** (Express REST API) + **PostgreSQL** |
| **Loại dịch vụ** | Jamstack / Edge Static Hosting & Serverless | PaaS (Platform as a Service) & Managed Database |
| **Tốc độ tải trang** | **Cực nhanh (Gần như 0 giây)** nhờ Global Edge CDN | Phụ thuộc vào vị trí Server đặt container |
| **Hiện tượng "Ngủ" (Cold Start)** | **KHÔNG BAO GIỜ NGỦ** — Giao diện luôn sẵn sàng 24/7 | **Có ngủ sau 15 phút không dùng** (Gói Free mất ~30–50s để khởi động lại) |
| **Cơ sở dữ liệu** | Không có CSDL quan hệ tích hợp sẵn | **Tích hợp sẵn PostgreSQL Free** (1GB RAM, hỗ trợ kết nối Internal an toàn) |
| **Khả năng tự động hóa** | Tự động Build, Tối ưu Bundle, Cấp SSL/HTTPS miễn phí | Tự động chạy **Prisma Migration** (`migrate deploy`) và **Seed Data** qua Blueprint `render.yaml` |
| **Định tuyến SPA** | Hỗ trợ Rewrite mượt mà qua `vercel.json` | Cần cấu hình custom routing nếu serve file tĩnh |

---

## 🏗️ Sơ Đồ Kiến Trúc Triển Khai Hoàn Chỉnh

```
┌────────────────────────────────────────────────────────┐
│         TRÌNH DUYỆT NGƯỜI DÙNG / GIẢNG VIÊN            │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
    (1) Tải giao diện HTML/JS     (2) Gửi REST API Request
        Tức thì qua Edge CDN          Kèm JWT Bearer Token
              │                           │
              ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│     VERCEL (Frontend)     │   │      RENDER (Backend)     │
│   React 19 + TypeScript   │   │   Node.js + Express API   │
│       Vite + MUI v9       │   │  Helmet, CORS, Rate-limit │
└───────────────────────────┘   └─────────────┬─────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                              ▼                               ▼
                ┌───────────────────────────┐   ┌───────────────────────────┐
                │    RENDER (PostgreSQL)    │   │     GOOGLE GEMINI AI      │
                │ 11 Bảng, Prisma Relations │   │  Sinh Quiz, Giải thích,   │
                │  Internal Database URL    │   │     Tóm tắt bài học       │
                └───────────────────────────┘   └───────────────────────────┘
```

---

## 💡 Tại Sao Không Nên Chọn Riêng 1 Nền Tảng Đơn Lẻ?

### ❌ Nếu chỉ dùng riêng Vercel:
1. Vercel là nền tảng Serverless (Function-as-a-Service), không phù hợp để chạy một Express Server truyền thống dạng long-running.
2. Vercel không có PostgreSQL Database miễn phí đi kèm $\rightarrow$ Bạn buộc phải đăng ký thêm dịch vụ thứ 3 (như Supabase, NeonDB, ElephantSQL), gây phức tạp trong việc quản lý nhiều tài khoản.

### ❌ Nếu chỉ dùng riêng Render (Host cả Frontend lẫn Backend):
1. Gói Free của Web Service trên Render sẽ **tự động ngủ sau 15 phút** không có lượt truy cập.
2. Khi Giảng viên bấm vào link đồ án để chấm điểm, họ sẽ phải nhìn màn hình trắng chờ tới gần **1 phút** để Render đánh thức Web Service $\rightarrow$ Trải nghiệm người dùng và ấn tượng chấm điểm sẽ bị giảm sút.

### ✅ Khi kết hợp Vercel (FE) + Render (BE):
- Giảng viên vừa click vào link là **giao diện mở lên ngay lập tức** (nhờ Vercel Edge CDN).
- Trong lúc giảng viên đọc lướt trang chủ, Backend trên Render đã kịp hoàn tất quá trình khởi động $\rightarrow$ Mọi thao tác sau đó (Đăng nhập, Học bài, Làm Quiz) đều phản hồi mượt mà.

---

## ⚠️ 4 Lưu Ý & Mẹo Sống Còn Khi Triển Khai & Bảo Vệ Đồ Án

### 1. Luôn "Làm Nóng" (Warm Up) Backend trước buổi bảo vệ 15 phút
Vì gói Free của Render có cơ chế ngủ, hãy mở link `https://<ten-backend>.onrender.com/health` trên trình duyệt khoảng 15–30 phút trước khi đến lượt bạn thuyết trình để server Render luôn ở trạng thái `{"status":"ok","db":"up"}`.

### 2. Cấu hình biến `FE_URL` chính xác trên Render (Chống lỗi CORS)
Sau khi Vercel cấp tên miền chính thức (ví dụ: `https://learnquiz.vercel.app`), hãy vào **Render Dashboard $\rightarrow$ learnquiz-api $\rightarrow$ Environment** và cập nhật:
```env
FE_URL=https://learnquiz.vercel.app
```
*(Lưu ý: Tuyệt đối không để dấu gạch chéo `/` ở cuối đường link).*

### 3. Bảo mật API Key Google Gemini
- Khóa `GEMINI_API_KEY` chỉ được đặt tại biến môi trường của **Render (Backend)**.
- Tuyệt đối không đặt khóa này ở Frontend, vì mọi biến `VITE_*` đều bị đóng gói công khai vào file JavaScript trên trình duyệt.

### 4. Luôn có phương án dự phòng Offline bằng Docker Desktop
Dự án đã được đóng gói sẵn file `docker-compose.full.yml`. Trong trường hợp mạng tại hội đồng thi bị chập chờn, bạn chỉ cần mở Terminal trên máy tính và gõ:
```bash
docker compose -f docker-compose.full.yml up --build
```
Hệ thống sẽ chạy hoàn toàn cục bộ (Frontend tại `http://localhost:8080`, Backend tại `http://localhost:3000`) mà không cần kết nối Internet.

---
*Tài liệu hướng dẫn triển khai chi tiết từng bước xem tại: [`docs/DEPLOY.md`](DEPLOY.md).*
