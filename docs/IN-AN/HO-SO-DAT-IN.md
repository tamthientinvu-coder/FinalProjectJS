# HỒ SƠ ĐẶT IN — ĐỒ ÁN TỐT NGHIỆP "LearnQuiz"

**Full Stack JavaScript K312** · Lập ngày 09/09/2026 · Bảo vệ 11/09/2026
**Số bản:** 01 bìa cứng ép kim (lưu chiểu) + 03 bìa mềm (hội đồng)

---

## 1. Nơi in

**VIGROUP — vigcenter.com** · Quận 10, gần ĐH Bách Khoa

Chọn vì ba lý do: quen quy cách bìa cứng ép kim mạ chữ vàng của khối kỹ thuật,
nhận **tách trang màu / đen trắng** (yếu tố quyết định chi phí ở đồ án nhiều sơ đồ),
và hỗ trợ chỉnh file trước khi in.

> Gọi xác nhận trước khi mang file: địa chỉ chính xác, đơn giá thực tế,
> và **thời gian trả hàng** — cần lấy chậm nhất chiều 10/09.

---

## 2. Bộ file giao nhà in — `docs/IN-AN/`

| File | Nội dung | Chỉ thị in |
|---|---|---|
| `00_MASTER_73trang.pdf` | Bản đầy đủ 73 trang A4 | **Chỉ đối chiếu**, không in |
| `01_DEN-TRANG_63trang.pdf` | 63 trang, đã ép grayscale tuyệt đối | Đen trắng, Fort 100gsm |
| `02_MAU_10trang.pdf` | 10 trang sơ đồ / ảnh giao diện | **Màu**, Fort 100gsm hoặc C120 |
| `03_GAP-A3_2trang.pdf` | Sơ đồ kiến trúc + ERD phóng A3 | Màu A3, gập đôi kẹp ruột |
| `04_THE-QR_148x105mm.pdf` | Thẻ truy cập nhanh (A6 ngang) | Màu 1 mặt, 300gsm cán màng mờ |

Kỹ thuật: PDF 1.6/1.7 · khổ A4 chuẩn 595×842 pt · **toàn bộ font đã nhúng (embedded
+ subset)** · file `01` đã kiểm chứng máy **0/63 trang còn mực màu** nên nhà in không
thể tính nhầm sang giá màu.

Tái tạo lại toàn bộ bộ file sau khi sửa báo cáo: `bash scripts/tao-bo-in.sh`

---

## 3. Bản đồ trang — thứ tự đóng cuốn

Đánh số theo bản gốc 73 trang.

```
Trang MÀU (file 02) — 10 trang:
    28 · 31 · 33 · 42 · 44 · 45 · 48 · 51 · 54 · 59

Trang ĐEN TRẮNG (file 01) — 63 trang:
    1–27 · 29–30 · 32 · 34–41 · 43 · 46–47 · 49–50 · 52–53 · 55–58 · 60–73
```

Nội dung 10 trang màu: sơ đồ trường hợp sử dụng (28) · sơ đồ kiến trúc hệ thống (31) ·
lược đồ quan hệ thực thể ERD (33) · bảy trang ảnh giao diện và luồng dữ liệu
(42, 44, 45, 48, 51, 54, 59).

### Nếu in 2 mặt (khuyến nghị)

73 trang = **37 tờ**. Không tờ nào chứa hai trang màu, nên chia gọn:

```
Tờ in MÀU (10 tờ)      : 14, 16, 17, 21, 22, 23, 24, 26, 27, 30
Tờ in ĐEN TRẮNG (27 tờ): các tờ còn lại
```

Tờ thứ *k* = trang 2k−1 và 2k (ví dụ tờ 14 = trang 27–28).

---

## 4. Quy cách đóng cuốn

### 4.1 Bản lưu chiểu — 01 cuốn bìa cứng

- Bìa cứng, ép kim mạ chữ nhũ vàng theo mẫu quy định của trường
- Gáy ép kim: tên đề tài · họ tên · năm
- Ruột giấy Fort 100gsm (dày, không hằn mực mặt sau)
- Trang gập A3 kẹp sau trang 31 (kiến trúc) và sau trang 33 (ERD)
- Thẻ QR kẹp đầu cuốn, ngay sau bìa lót

### 4.2 Bản hội đồng — 03 cuốn bìa mềm

- Bìa Couche 300gsm in màu, **cán màng mờ**
- **Gáy keo nhiệt phẳng** (perfect binding) — dáng sách kỹ thuật, không lò xo
- Ruột Fort 100gsm, in 2 mặt
- Mỗi cuốn kèm 01 thẻ QR

### 4.3 Thẻ QR truy cập nhanh

- A6 ngang 148×105 mm · 300gsm · cán màng mờ · in 1 mặt
- Ba mã: Live Demo (Vercel) · Mã nguồn (GitHub) · API health check (Render)
- **Số lượng: 09 thẻ** (04 kẹp cuốn + 05 dự phòng phát tại buổi bảo vệ)

---

## 5. Ước tính chi phí — 4 cuốn

> Đơn giá tham khảo mặt bằng TP.HCM 2026, **phải xác nhận lại với Vigroup**.

| Hạng mục | Khối lượng | Đơn giá tham khảo | Thành tiền |
|---|---:|---:|---:|
| In đen trắng A4 (Fort 100gsm) | 63 × 4 = 252 mặt | 500 – 800 đ | 126.000 – 201.600 |
| In màu A4 | 10 × 4 = 40 mặt | 3.000 – 5.000 đ | 120.000 – 200.000 |
| In màu A3 (trang gập) | 2 × 4 = 8 tờ | 8.000 – 15.000 đ | 64.000 – 120.000 |
| Bìa cứng ép kim mạ vàng | 1 cuốn | 60.000 – 120.000 đ | 60.000 – 120.000 |
| Bìa Couche 300gsm + gáy keo | 3 cuốn | 25.000 – 45.000 đ | 75.000 – 135.000 |
| Thẻ QR A6 300gsm cán mờ | 9 thẻ | 3.000 – 6.000 đ | 27.000 – 54.000 |
| **Tổng** | | | **≈ 472.000 – 831.000 đ** |

### Vì sao phải tách file

Để nguyên bản gốc, máy RIP của nhà in nhận diện **54/73 trang là trang màu** — do tiêu
đề, viền và nền khối mã đều dùng xanh navy `#1F3864`, dù mắt thường thấy như đen trắng.
Sau khi tách còn **10 trang màu thật**.

Chênh lệch: 44 trang × ~3.500 đ ≈ **154.000 đ mỗi cuốn**, bốn cuốn ≈ **616.000 đ**.

---

## 6. Tiến độ

| Thời điểm | Việc |
|---|---|
| 09/09 chiều | Gọi Vigroup: chốt giá, chốt giờ trả hàng |
| 10/09 sáng | Gửi bộ file · duyệt bản in thử: 1 trang màu + 1 trang đen trắng + 1 thẻ QR |
| 10/09 chiều | Nhận hàng, nghiệm thu |
| 11/09 | Bảo vệ |

**Nghiệm thu khi nhận hàng**

- Đúng thứ tự 10 trang màu, không lệch trang
- Trang gập A3 gập đúng chiều, mép gập không bị xén mất nội dung
- Ép kim gáy và bìa không lệch, chữ không bong
- Quét thử cả ba mã QR trên thẻ bằng điện thoại
- Lật ngẫu nhiên 5 trang có khối mã: chữ Courier phải sắc nét, nền xám nhạt đều
