# HƯỚNG DẪN TRIỂN KHAI — LEARNQUIZ

> Đưa hệ thống từ máy cá nhân lên Internet: **Backend + PostgreSQL trên Render**, **Frontend trên Vercel**.
> Toàn bộ dùng gói miễn phí, không cần thẻ tín dụng.

---

## 0. Chuẩn bị

| Việc cần làm | Ghi chú |
|---|---|
| Đẩy toàn bộ mã nguồn lên GitHub | Kiểm tra kỹ: **file `.env` KHÔNG được lên git** |
| Tài khoản [render.com](https://render.com) | Đăng nhập bằng GitHub cho tiện |
| Tài khoản [vercel.com](https://vercel.com) | Đăng nhập bằng GitHub |
| API key Gemini | Lấy tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

**Kiểm tra `.env` chưa từng bị commit** — chạy trong thư mục dự án:

```bash
git log --all --full-history -- "*/.env" ".env"
```

Kết quả phải **rỗng**. Nếu có kết quả nghĩa là secret đã lộ: phải gỡ khỏi lịch sử git **và đổi toàn bộ secret**, vì mọi thứ từng lên GitHub thì coi như đã công khai.

---

## 1. Backend + Cơ sở dữ liệu trên Render

### Cách A — Dùng Blueprint (khuyến nghị, nhanh nhất)

Dự án đã có sẵn `render.yaml` ở thư mục gốc, khai báo đủ cả CSDL lẫn API.

1. Render Dashboard → **New** → **Blueprint**
2. Chọn repository của đồ án → Render đọc `render.yaml` và hiện ra 2 tài nguyên sẽ tạo
3. Điền hai biến Render hỏi (các biến khác Render tự sinh):
   - `FE_URL` — tạm điền `http://localhost:5173`, sẽ sửa lại ở Bước 3
   - `GEMINI_API_KEY` — dán key vừa lấy
4. Bấm **Apply** và chờ khoảng 3–5 phút

### Cách B — Tạo tay từng bước

<details>
<summary>Bấm để xem</summary>

**Tạo cơ sở dữ liệu:** New → PostgreSQL → Name `learnquiz-db` → Plan **Free** → Create.
Chờ trạng thái *Available*, rồi copy chuỗi **Internal Database URL**.

**Tạo web service:** New → Web Service → chọn repository → cấu hình:

| Trường | Giá trị |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check Path | `/health` |
| Plan | Free |

**Biến môi trường:**

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Internal Database URL vừa copy |
| `JWT_ACCESS_SECRET` | chuỗi ngẫu nhiên dài (bấm Generate) |
| `JWT_REFRESH_SECRET` | chuỗi ngẫu nhiên **khác** |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |
| `FE_URL` | điền sau ở Bước 3 |
| `GEMINI_API_KEY` | key Gemini |
| `GEMINI_MODEL` | `gemini-2.0-flash` |

</details>

### Vì sao `migrate deploy` nằm ở Build Command chứ không ở Start Command?

Build chạy **một lần mỗi lần deploy**. Start chạy **mỗi lần container khởi động lại** — mà gói Free của Render cho service ngủ rồi tự dậy liên tục. Đặt migration ở Start là mỗi lần dậy lại chạy migration một lần, vừa chậm vừa dễ đụng nhau khi có nhiều container.

Lưu ý: dùng `migrate deploy` chứ **không** dùng `migrate dev`. `migrate dev` có thể xóa và tạo lại cơ sở dữ liệu — tuyệt đối không đưa vào production.

### Nạp dữ liệu mẫu (chỉ làm một lần)

Render Dashboard → service `learnquiz-api` → tab **Shell**:

```bash
npm run seed
```

### Kiểm tra

Mở `https://learnquiz-api.onrender.com/health` → phải thấy:

```json
{ "status": "ok", "db": "up", "uptime": 12.34 }
```

---

## 2. Frontend trên Vercel

1. Vercel → **Add New** → **Project** → chọn repository
2. Cấu hình:

| Trường | Giá trị |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` *(mặc định)* |
| Output Directory | `dist` *(mặc định)* |

3. **Environment Variables** — thêm:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://learnquiz-api.onrender.com/api/v1` |

4. **Deploy**

### Hai điều dễ sai ở bước này

**Biến `VITE_*` được nhúng lúc BUILD, không đọc lúc chạy.** Đổi `VITE_API_URL` xong phải **Redeploy**, không phải chỉ restart. Cũng vì vậy, mọi biến `VITE_*` đều lộ ra trình duyệt — **tuyệt đối không đặt `GEMINI_API_KEY` ở frontend**.

**React Router cần rewrite.** Không có nó thì vào thẳng `https://…/courses/5` sẽ ra 404 vì trên đĩa không có file nào tên `courses/5`. File `frontend/vercel.json` đã khai báo sẵn:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## 3. Nối hai đầu lại — bước hay bị quên nhất

Quay lại Render → `learnquiz-api` → **Environment** → sửa:

```
FE_URL = https://learnquiz.vercel.app
```

*(dán đúng URL Vercel vừa cấp, **không** có dấu `/` ở cuối)*

Bấm **Save** — Render tự deploy lại.

Thiếu bước này thì frontend gọi API sẽ dính lỗi CORS: trình duyệt báo *"has been blocked by CORS policy"*, còn backend thì không thấy lỗi gì cả vì request bị chặn ngay tại trình duyệt.

---

## 4. Chạy trọn bộ bằng Docker (để trình bày với giáo viên)

Không cần cloud, chỉ cần Docker Desktop:

```bash
docker compose -f docker-compose.full.yml up --build
```

| Thành phần | Địa chỉ |
|---|---|
| Frontend (nginx) | http://localhost:8080 |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

Nạp dữ liệu mẫu:

```bash
docker compose -f docker-compose.full.yml exec backend npm run seed
```

Cả hai image đều dùng **build hai giai đoạn**: giai đoạn đầu biên dịch, giai đoạn sau chỉ giữ lại kết quả. Image backend không chứa mã TypeScript, không chứa devDependencies và **chạy bằng user `node` chứ không phải root**.

---

## 5. Tích hợp liên tục (CI)

`.github/workflows/ci.yml` chạy tự động mỗi lần push lên `main` và mỗi Pull Request:

| Job | Nội dung |
|---|---|
| **backend** | `prisma validate` → `typecheck` → `npm test` (318 phép kiểm) → `build` |
| **frontend** | `typecheck` → `build` production |
| **security** | Chặn nếu `.env` từng bị commit · `npm audit` cả hai dự án |

Bộ kiểm thử dùng Prisma giả lập trong bộ nhớ nên **CI không cần dựng cơ sở dữ liệu** — chạy xong trong khoảng một phút.

---

## 6. Quay lui khi deploy hỏng

**Vercel** — Dashboard → Deployments → tìm bản chạy tốt gần nhất → `…` → **Promote to Production**. Tức thì, không cần build lại.

**Render** — Dashboard → service → tab Events → tìm deploy cũ → **Rollback**.

**Bằng git** (khi cần sửa hẳn mã nguồn):

```bash
git log --oneline -10
git revert <mã-commit-gây-lỗi>
git push
```

Dùng `revert` chứ không `reset --hard` trên nhánh chung: `revert` tạo commit mới đảo ngược thay đổi, lịch sử vẫn nguyên vẹn cho cả nhóm.

---

## 7. Checklist trước buổi bảo vệ

**Hạ tầng**

- [ ] `/health` trả `{"status":"ok","db":"up"}`
- [ ] Frontend tải được, không có lỗi CORS trong Console
- [ ] Migration đã áp dụng, seed đã chạy, đăng nhập được bằng tài khoản demo
- [ ] Không biến môi trường nào còn trỏ `localhost`

**Bảo mật**

- [ ] `git log --all --full-history -- "*/.env"` cho kết quả rỗng
- [ ] `npm audit` không còn lỗ hổng critical/high
- [ ] `helmet()` đã bật (kiểm tra header `x-content-type-options: nosniff`)
- [ ] Rate limit có ở `/auth/*` và `/ai/*`
- [ ] Không response nào chứa `password` hay `refreshToken`
- [ ] `NODE_ENV=production` trên Render

**Chất lượng mã**

- [ ] `npm run build` sạch lỗi ở cả hai dự án
- [ ] `npm test` đạt 100%
- [ ] Không còn `console.log` rải rác
- [ ] Mọi route async đều `try/catch` + `next(err)`

**Chống sự cố khi demo**

- [ ] Ping `/health` **trước buổi bảo vệ 30 phút** để service Render tỉnh dậy (gói Free ngủ sau 15 phút không dùng, lần gọi đầu chờ tới ~50 giây)
- [ ] Chuẩn bị ảnh chụp màn hình kết quả AI, phòng khi Gemini hết hạn mức
- [ ] Mở sẵn tab `/health` và tab Network để chứng minh `isCorrect` không rò rỉ

---

## 8. Bảng tra lỗi thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `blocked by CORS policy` | `FE_URL` trên Render sai hoặc còn dấu `/` cuối | Sửa `FE_URL`, lưu, chờ deploy lại |
| Vào thẳng `/courses/5` ra 404 | Thiếu rewrite của SPA | Kiểm tra `frontend/vercel.json` |
| `Can't reach database server` | Dùng External URL thay vì Internal | Đổi `DATABASE_URL` sang **Internal Database URL** |
| `relation "users" does not exist` | Chưa chạy migration | Thêm `npx prisma migrate deploy` vào Build Command |
| Request đầu tiên chờ ~50 giây | Service Free của Render đang ngủ | Ping `/health` trước khi demo |
| Nút AI bị mờ | Thiếu `GEMINI_API_KEY` | Thêm biến trên Render rồi deploy lại |
| AI báo 429 | Hết hạn mức Gemini | Chờ hoặc đổi key; hệ thống vẫn chạy bình thường không có AI |
| Frontend gọi `localhost:3000` | Đổi `VITE_API_URL` mà chưa build lại | **Redeploy** trên Vercel, không phải restart |

---

*LearnQuiz — Đồ án tốt nghiệp Lập trình Full-stack JavaScript K312.*
