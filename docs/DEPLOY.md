# HƯỚNG DẪN TRIỂN KHAI — LEARNQUIZ

> Đưa hệ thống từ máy cá nhân lên Internet: **Backend + PostgreSQL trên Render**, **Frontend trên Vercel**.
> Toàn bộ dùng gói miễn phí, không cần thẻ tín dụng. Hướng dẫn theo từng cú nhấp chuột — làm theo đúng thứ tự, không bỏ bước.

**Thời gian dự kiến:** 25–35 phút cho lần triển khai đầu tiên (chủ yếu là thời gian Render dựng máy chủ).

---

## Mục lục

0. [Chuẩn bị](#0-chuẩn-bị)
1. [Đẩy mã nguồn lên GitHub](#1-đẩy-mã-nguồn-lên-github-bỏ-qua-nếu-đã-làm)
2. [Lấy API key Google Gemini](#2-lấy-api-key-google-gemini)
3. [Backend + Cơ sở dữ liệu trên Render](#3-backend--cơ-sở-dữ-liệu-trên-render)
4. [Frontend trên Vercel](#4-frontend-trên-vercel)
5. [Nối hai đầu lại — bước hay bị quên nhất](#5-nối-hai-đầu-lại--bước-hay-bị-quên-nhất)
6. [Kiểm tra toàn diện sau khi deploy](#6-kiểm-tra-toàn-diện-sau-khi-deploy)
7. [Chạy trọn bộ bằng Docker (phương án dự phòng)](#7-chạy-trọn-bộ-bằng-docker-phương-án-dự-phòng)
8. [Tích hợp liên tục (CI)](#8-tích-hợp-liên-tục-ci)
9. [Quay lui khi deploy hỏng](#9-quay-lui-khi-deploy-hỏng)
10. [Checklist trước buổi bảo vệ](#10-checklist-trước-buổi-bảo-vệ)
11. [Bảng tra lỗi thường gặp](#11-bảng-tra-lỗi-thường-gặp)

---

## 0. Chuẩn bị

| Việc cần làm | Ghi chú |
|---|---|
| Tài khoản [GitHub](https://github.com) | Miễn phí, dùng để lưu mã nguồn và cho Render/Vercel đọc |
| Tài khoản [render.com](https://render.com) | Đăng nhập bằng **Sign in with GitHub** — không cần tạo mật khẩu riêng |
| Tài khoản [vercel.com](https://vercel.com) | Đăng nhập bằng **Continue with GitHub** |
| Tài khoản [aistudio.google.com](https://aistudio.google.com) | Đăng nhập bằng Gmail bất kỳ, dùng để lấy API key Gemini |
| Docker Desktop (tuỳ chọn) | Chỉ cần nếu muốn có phương án dự phòng offline ở Bước 7 |

Nếu đã có sẵn repository trên GitHub và đã có API key Gemini, **bỏ qua Bước 1 và 2**, đi thẳng vào Bước 3.

---

## 1. Đẩy mã nguồn lên GitHub (bỏ qua nếu đã làm)

### 1.1. Kiểm tra `.env` chưa từng bị commit

Việc này làm **trước tiên**, kể cả khi repo đã tồn tại từ lâu:

```bash
cd FinalProject
git log --all --full-history -- "*/.env" ".env"
```

Kết quả phải **rỗng** (không in ra dòng nào). Nếu có kết quả nghĩa là secret đã lộ ra GitHub — phải gỡ khỏi lịch sử git (`git filter-repo` hoặc tạo repo mới) **và đổi toàn bộ secret liên quan** (JWT secret, mật khẩu DB, API key), vì bất cứ thứ gì từng lên GitHub — kể cả sau khi xoá — đều phải coi như đã công khai.

Tệp `.gitignore` ở gốc dự án đã chặn sẵn `.env`, `.env.local`, `.env.*.local` — không cần sửa gì thêm.

### 1.2. Tạo repository trên GitHub

1. Đăng nhập [github.com](https://github.com) → góc trên bên phải, bấm dấu **+** → **New repository**
2. Đặt tên, ví dụ `learnquiz` → chọn **Private** (khuyến nghị trong lúc chưa bảo vệ xong) hoặc **Public**
3. **Không** tick "Add a README file" (dự án đã có sẵn) → bấm **Create repository**
4. GitHub hiện ra một trang có sẵn các dòng lệnh — copy đoạn dưới mục **"…or push an existing repository from the command line"**

### 1.3. Đẩy mã nguồn

Trong thư mục gốc dự án (`FinalProject/`):

```bash
git init                                          # nếu chưa từng git init
git add .
git commit -m "Initial commit — LearnQuiz"
git branch -M main
git remote add origin https://github.com/<ten-tai-khoan>/learnquiz.git
git push -u origin main
```

Thay `<ten-tai-khoan>` bằng tên tài khoản GitHub thật. Sau khi chạy xong, tải lại trang GitHub — phải thấy đủ hai thư mục `backend/`, `frontend/` và tệp `render.yaml` ở gốc.

**Kiểm tra lại lần nữa trên GitHub:** vào tab **Code**, gõ `.env` vào ô tìm kiếm của repo (phím `t` để bật tìm tệp nhanh) — không được ra kết quả nào ngoài `.env.example`.

---

## 2. Lấy API key Google Gemini

1. Vào [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → đăng nhập Gmail
2. Bấm **Create API key**
3. Chọn **Create API key in new project** (nếu chưa có project Google Cloud nào)
4. Copy chuỗi key hiện ra (dạng `AIzaSy...`) — **dán ngay vào một chỗ ghi chú tạm**, màn hình này không hiện lại đầy đủ key sau khi đóng
5. Gói miễn phí (Free tier) của Gemini đã đủ dùng cho việc demo — không cần thẻ tín dụng

Key này sẽ dùng ở Bước 3, mục biến môi trường `GEMINI_API_KEY`.

---

## 3. Backend + Cơ sở dữ liệu trên Render

### Cách A — Dùng Blueprint (khuyến nghị, nhanh nhất)

Dự án đã có sẵn `render.yaml` ở thư mục gốc, khai báo đủ cả CSDL lẫn API — Render đọc tệp này và tự dựng mọi thứ.

1. Đăng nhập [dashboard.render.com](https://dashboard.render.com)
2. Góc trên bên phải → bấm nút tím **New** → chọn **Blueprint** trong danh sách sổ xuống
3. Nếu đây là lần đầu Render truy cập GitHub: bấm **Configure account** → chọn **Only select repositories** → tick vào repo `learnquiz` → **Install**
4. Quay lại màn hình Blueprint, chọn repository `learnquiz` trong danh sách → bấm **Connect**
5. Render tự đọc `render.yaml` và hiện ra bản xem trước gồm **2 tài nguyên**: database `learnquiz-db` và web service `learnquiz-api`
6. Đặt tên cho Blueprint (không quan trọng, ví dụ `learnquiz`) → kéo xuống dưới
7. Render sẽ hỏi giá trị cho các biến có `sync: false` trong `render.yaml` — đúng 2 ô:
   - `FE_URL` — tạm điền `http://localhost:5173` (sẽ sửa lại ở Bước 5, vì lúc này Vercel chưa deploy)
   - `GEMINI_API_KEY` — dán key vừa lấy ở Bước 2
   *(Các biến còn lại như `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` có `generateValue: true` nên Render tự sinh chuỗi ngẫu nhiên, không cần điền.)*
8. Bấm **Apply**
9. Render chuyển sang màn hình build log — chờ khoảng **3–5 phút**. Ba việc diễn ra tuần tự, theo dõi được trong log:
   - Tạo PostgreSQL (trạng thái chuyển từ *Creating* → *Available*)
   - `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build` cho web service
   - Container khởi động, Render tự gọi `healthCheckPath: /health` để xác nhận service sống
10. Khi cả hai thẻ tài nguyên chuyển sang chấm tròn **xanh lá**, việc dựng hạ tầng đã xong

Copy URL của web service (dạng `https://learnquiz-api.onrender.com`, hiện ngay dưới tên service) — sẽ dùng ở Bước 4 và 5.

### Cách B — Tạo tay từng bước

Dùng khi muốn kiểm soát từng biến, hoặc khi `render.yaml` không áp dụng được (ví dụ tài khoản Render dạng tổ chức có giới hạn Blueprint).

<details>
<summary>Bấm để xem hướng dẫn tạo tay</summary>

#### B1. Tạo cơ sở dữ liệu

1. Dashboard → **New** → **PostgreSQL**
2. Điền:

| Trường | Giá trị |
|---|---|
| Name | `learnquiz-db` |
| Database | `learnquiz_db` |
| User | `learnquiz` |
| Region | Singapore *(gần Việt Nam nhất, giảm độ trễ)* |
| PostgreSQL Version | mặc định (16) |
| Plan | **Free** |

3. Bấm **Create Database**
4. Chờ trạng thái chuyển thành **Available** (khoảng 1 phút)
5. Trong trang chi tiết database, cuộn xuống mục **Connections** → copy chuỗi **Internal Database URL** (không phải External — xem lý do ở Bước 11)

#### B2. Tạo web service

1. Dashboard → **New** → **Web Service**
2. Chọn repository `learnquiz` → **Connect**
3. Điền:

| Trường | Giá trị |
|---|---|
| Name | `learnquiz-api` |
| Region | Singapore |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build` |
| Start Command | `node dist/index.js` |
| Plan | Free |

4. Kéo xuống mục **Health Check Path** (trong phần *Advanced*) → điền `/health`
5. Mục **Environment Variables** → bấm **Add Environment Variable** cho từng dòng:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Internal Database URL vừa copy ở B1 |
| `JWT_ACCESS_SECRET` | bấm nút **Generate** bên cạnh ô (Render tự sinh chuỗi ngẫu nhiên) |
| `JWT_REFRESH_SECRET` | bấm **Generate** — phải là chuỗi **khác** với `JWT_ACCESS_SECRET` |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |
| `FE_URL` | tạm `http://localhost:5173`, sửa lại ở Bước 5 |
| `GEMINI_API_KEY` | key lấy ở Bước 2 |
| `GEMINI_MODEL` | `gemini-2.0-flash` |

6. Bấm **Create Web Service** ở cuối trang
7. Theo dõi tab **Logs** — chờ tới khi thấy dòng server khởi động thành công và chấm trạng thái chuyển xanh lá

</details>

### Vì sao `migrate deploy` nằm ở Build Command chứ không ở Start Command?

Build chạy **một lần mỗi lần deploy**. Start chạy **mỗi lần container khởi động lại** — mà gói Free của Render cho service ngủ rồi tự dậy liên tục (xem Bước 6). Đặt migration ở Start là mỗi lần dậy lại chạy migration một lần, vừa chậm vừa dễ đụng nhau nếu có nhiều container cùng khởi động.

Lưu ý: dùng `migrate deploy` chứ **không** dùng `migrate dev`. `migrate dev` có thể xoá và tạo lại cơ sở dữ liệu — tuyệt đối không đưa vào production.

### Nạp dữ liệu mẫu (chỉ làm một lần)

1. Dashboard Render → mở service `learnquiz-api`
2. Chọn tab **Shell** ở thanh menu ngang phía trên
3. Chờ vài giây để shell kết nối vào container đang chạy, rồi gõ:

```bash
npm run seed
```

4. Thấy log in ra danh sách tài khoản/khoá học mẫu đã tạo là xong. Lệnh này **an toàn để chạy lại** nếu seed dùng `upsert`, nhưng thông thường chỉ cần chạy đúng một lần sau lần deploy đầu tiên.

### Kiểm tra

Mở tab trình duyệt mới, dán:

```
https://learnquiz-api.onrender.com/health
```

*(thay bằng URL thật của service)* — phải thấy:

```json
{ "status": "ok", "db": "up", "uptime": 12.34 }
```

Nếu `db` không phải `"up"`, xem mục [Bảng tra lỗi](#11-bảng-tra-lỗi-thường-gặp).

---

## 4. Frontend trên Vercel

1. Đăng nhập [vercel.com/new](https://vercel.com/new)
2. Nếu chưa cấp quyền GitHub: bấm **Add GitHub Account** → chọn repo `learnquiz` → **Install**
3. Trong danh sách repository hiện ra, tìm `learnquiz` → bấm **Import**
4. Màn hình **Configure Project** hiện ra:

| Trường | Giá trị |
|---|---|
| Project Name | tuỳ ý, ví dụ `learnquiz` (sẽ quyết định domain `learnquiz.vercel.app`) |
| Framework Preset | **Vite** *(Vercel thường tự nhận diện đúng)* |
| Root Directory | bấm **Edit** bên cạnh → gõ `frontend` → **Continue** |
| Build Command | để nguyên mặc định `npm run build` |
| Output Directory | để nguyên mặc định `dist` |
| Install Command | để nguyên mặc định |

5. Bấm mũi tên mở rộng mục **Environment Variables** → thêm:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://learnquiz-api.onrender.com/api/v1` *(URL Render ở Bước 3, nhớ thêm đuôi `/api/v1`)* |

6. Bấm **Deploy**
7. Vercel build trong khoảng 30–60 giây, xong hiện màn hình pháo giấy 🎉 kèm ảnh chụp trang web và nút **Continue to Dashboard**
8. Domain chính thức hiện ở đầu trang dashboard, dạng `https://learnquiz.vercel.app` — copy lại, dùng ở Bước 5

### Hai điều dễ sai ở bước này

**Biến `VITE_*` được nhúng lúc BUILD, không đọc lúc chạy.** Đổi `VITE_API_URL` xong phải vào tab **Deployments** → bấm **⋯** ở bản mới nhất → **Redeploy**, chứ không phải chỉ chờ hay bấm restart — restart không tồn tại với Vercel vì đây là static hosting, không có tiến trình để restart. Cũng chính vì biến build-time bị nhúng thẳng vào file JS công khai, **tuyệt đối không đặt `GEMINI_API_KEY` ở đây** dù chỉ để thử — bất kỳ ai mở DevTools → tab Sources đều đọc được.

**React Router cần rewrite.** Không có nó thì gõ thẳng `https://…/courses/5` vào thanh địa chỉ sẽ ra lỗi 404 của Vercel, vì trên đĩa không tồn tại file nào tên `courses/5` — chỉ có `index.html` và JS bundle, còn việc hiển thị đúng trang là do React Router xử lý *sau khi* đã tải xong ở trình duyệt. File `frontend/vercel.json` đã khai báo sẵn, không cần chỉnh:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## 5. Nối hai đầu lại — bước hay bị quên nhất

1. Quay lại [dashboard.render.com](https://dashboard.render.com) → mở service `learnquiz-api`
2. Chọn tab **Environment** ở menu ngang
3. Tìm dòng `FE_URL` → bấm vào ô giá trị → sửa thành:

```
https://learnquiz.vercel.app
```

*(dán đúng domain Vercel vừa cấp ở Bước 4, **không** có dấu `/` ở cuối)*

4. Bấm **Save Changes** ở góc dưới bên phải
5. Render tự động deploy lại (không cần build lại toàn bộ, chỉ khởi động lại container với biến môi trường mới) — chờ chấm trạng thái chuyển lại màu xanh lá, khoảng 30–60 giây

Thiếu bước này thì frontend gọi API sẽ dính lỗi CORS: mở trang web, bấm F12 mở DevTools → tab Console sẽ thấy dòng đỏ *"has been blocked by CORS policy"* — còn phía Render Logs thì **không hề báo lỗi gì**, vì request đã bị chính trình duyệt chặn lại trước khi rời máy người dùng. Đây là nguyên nhân số một khiến người mới triển khai tưởng backend bị hỏng trong khi thực ra backend hoàn toàn bình thường.

---

## 6. Kiểm tra toàn diện sau khi deploy

Làm tuần tự, đừng bỏ qua bước nào — mỗi bước xác nhận một tầng khác nhau của hệ thống:

1. **Tầng mạng/CSDL:** mở `https://learnquiz-api.onrender.com/health` → phải ra `{"status":"ok","db":"up"}`
2. **Tầng CORS:** mở `https://learnquiz.vercel.app`, bấm F12 → tab **Console** → tải lại trang (F5) → không được có dòng đỏ nào nhắc tới CORS
3. **Tầng dữ liệu mẫu:** đăng nhập bằng tài khoản demo (xem `README.md` mục tài khoản mẫu) — phải vào được, thấy danh sách khoá học
4. **Tầng nghiệp vụ:** mở một khoá học, làm thử một bài quiz, nộp bài — phải nhận được điểm và không thấy trường `isCorrect` nào bị lộ ra trước khi nộp (kiểm tra bằng tab **Network** của DevTools, xem response của API lấy câu hỏi)
5. **Tầng AI (nếu bật):** vào trang soạn quiz với vai trò giảng viên/quản trị → bấm **Sinh câu hỏi bằng AI** → phải nhận được câu hỏi soạn sẵn trong vài giây; nếu báo lỗi 429 nghĩa là hết hạn mức Gemini miễn phí, không phải lỗi hệ thống

Chỉ khi cả 5 bước trên đều đạt thì mới coi là triển khai thành công.

---

## 7. Chạy trọn bộ bằng Docker (phương án dự phòng)

Dùng khi mạng tại nơi bảo vệ đồ án không ổn định, hoặc muốn trình diễn mà không phụ thuộc Render/Vercel còn sống hay không. Chỉ cần máy tính cá nhân đã cài Docker Desktop, **không cần Internet** sau khi đã tải image lần đầu.

1. Mở Terminal (hoặc PowerShell trên Windows) tại thư mục gốc `FinalProject/`
2. Chạy:

```bash
docker compose -f docker-compose.full.yml up --build
```

3. Lần đầu chạy mất khoảng 2–4 phút để build hai image (backend, frontend) và tải image PostgreSQL. Các lần sau chạy lại chỉ mất vài giây nếu không đổi mã nguồn.
4. Chờ tới khi thấy log đứng yên với dòng dạng `Server is running on port 3000` — nghĩa là cả ba container đã chạy: `learnquiz_db_full`, `learnquiz_api`, `learnquiz_web`

| Thành phần | Địa chỉ |
|---|---|
| Frontend (nginx) | http://localhost:8080 |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

5. **Nạp dữ liệu mẫu** — mở một cửa sổ Terminal khác (để cửa sổ đầu tiên tiếp tục chạy), gõ:

```bash
docker compose -f docker-compose.full.yml exec backend npm run seed
```

6. Mở trình duyệt tại `http://localhost:8080`, đăng nhập thử như Bước 6

**Dừng hệ thống:** quay lại cửa sổ Terminal đầu tiên, bấm `Ctrl + C`, rồi:

```bash
docker compose -f docker-compose.full.yml down
```

*(thêm cờ `-v` ở cuối nếu muốn xoá luôn dữ liệu đã nạp, để lần sau chạy lại từ đầu)*

**Vì sao image an toàn hơn chạy `npm run dev` trực tiếp:** cả hai image đều dùng **build hai giai đoạn** (multi-stage) — giai đoạn đầu biên dịch TypeScript, giai đoạn sau chỉ giữ lại kết quả đã build. Image backend cuối cùng không chứa mã nguồn TypeScript, không chứa `devDependencies`, và **chạy bằng user `node` chứ không phải root** — nếu có lỗ hổng trong container, kẻ tấn công cũng không có quyền root ngay từ đầu.

---

## 8. Tích hợp liên tục (CI)

`.github/workflows/ci.yml` chạy tự động mỗi lần push lên `main` và mỗi khi mở Pull Request — xem kết quả tại tab **Actions** trên GitHub:

| Job | Nội dung |
|---|---|
| **backend** | `prisma validate` → `typecheck` → `npm test` (318 phép kiểm) → `build` |
| **frontend** | `typecheck` → `build` production |
| **security** | Chặn nếu `.env` từng bị commit · `npm audit` cả hai dự án |

Bộ kiểm thử dùng Prisma giả lập trong bộ nhớ nên **CI không cần dựng cơ sở dữ liệu thật** — chạy xong trong khoảng một phút. Nếu một job báo đỏ (❌) trên GitHub, bấm vào job đó để xem log chi tiết trước khi push tiếp.

---

## 9. Quay lui khi deploy hỏng

**Vercel:**
1. Dashboard project → tab **Deployments**
2. Tìm bản chạy tốt gần nhất (có chấm xanh, thường là bản trước bản vừa hỏng)
3. Bấm **⋯** ở cuối dòng → **Promote to Production**
4. Có hiệu lực tức thì, **không cần build lại** — vì Vercel giữ lại mọi bản build cũ

**Render:**
1. Mở service → tab **Events**
2. Tìm deploy cũ đã chạy ổn định
3. Bấm **Rollback to this deploy**
4. Render dựng lại container từ đúng commit đó — mất khoảng 1–2 phút, không phải tức thì như Vercel

**Bằng git** (khi cần sửa hẳn mã nguồn thay vì chỉ quay lại bản cũ):

```bash
git log --oneline -10
git revert <mã-commit-gây-lỗi>
git push
```

Dùng `revert` chứ không `reset --hard` trên nhánh chung: `revert` tạo ra một commit **mới** đảo ngược thay đổi lỗi, lịch sử của cả nhóm vẫn nguyên vẹn; `reset --hard` xoá lịch sử và sẽ làm hỏng bản sao của người khác nếu họ đã pull commit cũ.

---

## 10. Checklist trước buổi bảo vệ

**Hạ tầng**

- [ ] `/health` trả `{"status":"ok","db":"up"}`
- [ ] Frontend tải được, không có lỗi CORS trong Console
- [ ] Migration đã áp dụng, seed đã chạy, đăng nhập được bằng tài khoản demo
- [ ] Không biến môi trường nào còn trỏ `localhost`

**Bảo mật**

- [ ] `git log --all --full-history -- "*/.env"` cho kết quả rỗng
- [ ] `npm audit` không còn lỗ hổng critical/high
- [ ] `helmet()` đã bật (kiểm tra header `x-content-type-options: nosniff` bằng tab Network)
- [ ] Rate limit có ở `/auth/*` và `/ai/*`
- [ ] Không response nào chứa `password` hay `refreshToken`
- [ ] `NODE_ENV=production` trên Render

**Chất lượng mã**

- [ ] `npm run build` sạch lỗi ở cả hai dự án
- [ ] `npm test` đạt 100% (318/318)
- [ ] Không còn `console.log` rải rác
- [ ] Mọi route async đều `try/catch` + `next(err)`

**Chống sự cố khi demo**

- [ ] Ping `/health` **trước buổi bảo vệ 15–30 phút** để service Render tỉnh dậy (gói Free ngủ sau 15 phút không dùng, lần gọi đầu chờ tới ~30–50 giây)
- [ ] Chuẩn bị sẵn ảnh chụp màn hình kết quả AI, phòng khi Gemini hết hạn mức miễn phí đúng lúc demo
- [ ] Mở sẵn tab `/health` và tab Network để chứng minh `isCorrect` không rò rỉ
- [ ] Cài sẵn Docker Desktop và thử chạy `docker compose -f docker-compose.full.yml up --build` **ít nhất một lần trước ngày bảo vệ** — đừng để lần chạy đầu tiên là ngay tại hội đồng
- [ ] Có bản in hoặc file PDF của báo cáo phòng khi máy chiếu không kết nối được Internet

---

## 11. Bảng tra lỗi thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `blocked by CORS policy` trong Console | `FE_URL` trên Render sai hoặc còn dấu `/` cuối | Vào Render → Environment → sửa `FE_URL` → Save, chờ deploy lại |
| Vào thẳng `/courses/5` ra 404 | Thiếu rewrite của SPA | Kiểm tra `frontend/vercel.json` có đúng nội dung như Bước 4 |
| `Can't reach database server` trong log Render | Dùng External Database URL thay vì Internal | Đổi `DATABASE_URL` sang **Internal Database URL** (Database → tab Connections) |
| `relation "users" does not exist` | Chưa chạy migration | Kiểm tra Build Command có `npx prisma migrate deploy`; xem lại tab Logs xem bước này có chạy không |
| Request đầu tiên chờ ~30–50 giây | Service Free của Render đang ngủ (sau 15 phút không có request) | Ping `/health` trước khi demo, hoặc set thêm dịch vụ ping ngoài (uptimerobot.com, tuỳ chọn) |
| Nút "Sinh câu hỏi bằng AI" bị mờ/không bấm được | Thiếu `GEMINI_API_KEY` trên Render | Thêm biến ở tab Environment rồi Save (Render tự deploy lại) |
| AI báo lỗi 429 | Hết hạn mức miễn phí Gemini trong ngày | Chờ reset hạn mức hoặc đổi key khác; hệ thống vẫn chạy bình thường, chỉ tính năng AI tạm ngưng |
| Frontend vẫn gọi `localhost:3000` dù đã sửa `VITE_API_URL` | Đổi biến nhưng chưa Redeploy | Vercel → Deployments → **⋯** → **Redeploy**, không phải chỉ chờ hay restart |
| Build Render báo lỗi `prisma generate` không tìm thấy engine | Thiếu bước `npx prisma generate` trong Build Command, hoặc cache Render cũ | Xoá cache: Render → Settings → **Clear build cache & deploy** |
| Deploy Vercel báo `Root Directory` không tìm thấy `package.json` | Chưa đổi Root Directory thành `frontend` | Vercel → Settings → General → **Root Directory** → sửa thành `frontend` → Save → Redeploy |
| Seed chạy báo lỗi `Unique constraint failed` | Đã seed trước đó rồi chạy lại | Bỏ qua nếu script seed dùng `upsert` (an toàn); nếu không, chỉ seed một lần duy nhất sau deploy đầu tiên |

---

*LearnQuiz — Đồ án tốt nghiệp Lập trình Full-stack JavaScript K312.*
