# HỒ SƠ ĐẶT IN — ĐỒ ÁN TỐT NGHIỆP "LearnQuiz"

**Full Stack JavaScript K312** · Bản lập ngày 09/09/2026 · Bảo vệ 11/09/2026

---

## 1. Nơi in đã chọn

**VIGROUP (vigcenter.com) — Quận 10, gần ĐH Bách Khoa**

Lý do chọn: chuyên phục vụ đồ án/luận văn của khối kỹ thuật, quen quy cách bìa cứng
ép kim mạ chữ vàng, nhận **tách trang in màu / đen trắng** (yếu tố quyết định chi phí),
và hỗ trợ chỉnh file trước khi in.

> **Cần xác nhận qua điện thoại trước khi mang file tới**: địa chỉ chính xác, giờ nhận,
> thời gian trả hàng gấp (cần lấy trong ngày 10/09), và đơn giá thực tế.

---

## 2. Bộ file giao cho nhà in

Toàn bộ nằm trong thư mục `docs/IN-AN/`:

| File | Nội dung | Chỉ thị in |
|---|---|---|
| `00_MASTER_73trang.pdf` | Bản đầy đủ 73 trang A4 | **Chỉ để đối chiếu**, không in trực tiếp |
| `01_DEN-TRANG_63trang.pdf` | 63 trang, đã ép về grayscale tuyệt đối | In **đen trắng**, giấy Fort 100gsm |
| `02_MAU_10trang.pdf` | 10 trang có sơ đồ / ảnh giao diện | In **màu**, giấy Fort 100gsm hoặc C120 |
| `03_GAP-A3_2trang.pdf` | Sơ đồ kiến trúc + ERD phóng khổ A3 | In **màu A3**, gập đôi kẹp vào ruột |
| `04_THE-QR_148x105mm.pdf` | Thẻ truy cập nhanh (A6 ngang) | In **màu 1 mặt**, giấy 300gsm cán màng mờ |

Định dạng: PDF 1.6/1.7, **toàn bộ font đã nhúng (embedded + subset)**, khổ A4 chuẩn
595×842 pt. File `01` đã kiểm chứng **0/63 trang còn mực màu** — nhà in không thể tính
nhầm sang giá màu.

---

## 3. Bản đồ trang — thứ tự đóng cuốn

Đánh số theo bản gốc 73 trang. Ghép xen kẽ đúng thứ tự sau:

```
Trang MÀU  (file 02):  28 · 31 · 33 · 42 · 44 · 45 · 48 · 51 · 54 · 59
Trang ĐEN TRẮNG (file 01): tất cả các trang còn lại
  1–27 · 29–30 · 32 · 34–41 · 43 · 46–47 · 49–50 · 52–53 · 55–58 · 60–73
```

Nội dung 10 trang màu: sơ đồ trường hợp sử dụng (28), sơ đồ kiến trúc hệ thống (31),
lược đồ quan hệ thực thể ERD (33), và 7 trang ảnh chụp giao diện / luồng dữ liệu
(42, 44, 45, 48, 51, 54, 59).

### Nếu in 2 mặt (khuyến nghị — cuốn mỏng, chuyên nghiệp hơn)

73 trang = **37 tờ**. Không có tờ nào chứa 2 trang màu, nên chia gọn:

```
Tờ in MÀU 2 mặt (10 tờ): tờ 14, 16, 17, 21, 22, 23, 24, 26, 27, 30
Tờ in ĐEN TRẮNG (27 tờ): các tờ còn lại
```

(Tờ thứ *k* = trang 2k−1 và 2k. Ví dụ tờ 14 = trang 27–28.)

---

## 4. Quy cách đóng cuốn

### 4.1 Bản lưu chiểu — bìa cứng ép kim

- Bìa cứng, ép kim (mạ chữ nhũ vàng) theo mẫu quy định của trường
- Gáy ép kim: tên đề tài + họ tên + năm
- Ruột: giấy Fort 100gsm (dày, không hằn mực mặt sau)
- Trang gập A3 kẹp ở vị trí sơ đồ kiến trúc (sau trang 31) và ERD (sau trang 33)
- Thẻ QR kẹp ở đầu cuốn, sau bìa lót

### 4.2 Bản cho hội đồng — bìa mềm

- Bìa Couche 300gsm, in màu, **cán màng mờ**
- Gáy keo nhiệt phẳng (perfect binding) — dáng sách kỹ thuật, không lò xo
- Ruột: giấy Fort 100gsm, in 2 mặt
- Mỗi bản kèm 01 thẻ QR

### 4.3 Thẻ QR truy cập nhanh

- Khổ A6 ngang 148×105 mm, giấy 300gsm, cán màng mờ, in 1 mặt
- 3 mã QR: Live Demo (Vercel) · Mã nguồn (GitHub) · API health check (Render)
- Số lượng: bằng số bản + 5 thẻ dự phòng phát cho hội đồng

---

## 5. Ước tính chi phí

> Đơn giá tham khảo mặt bằng TP.HCM 2026 — **phải xác nhận lại với Vigroup**.

| Hạng mục | Đơn giá tham khảo | Ghi chú |
|---|---|---|
| In đen trắng A4 (Fort 100gsm) | 500 – 800 đ/mặt | 63 mặt/bản |
| In màu A4 chất lượng cao | 3.000 – 5.000 đ/mặt | 10 mặt/bản |
| In màu A3 (trang gập) | 8.000 – 15.000 đ/tờ | 2 tờ/bản |
| Đóng bìa cứng ép kim mạ vàng | 60.000 – 120.000 đ/cuốn | chỉ bản lưu chiểu |
| Bìa Couche 300gsm cán mờ + gáy keo | 25.000 – 45.000 đ/cuốn | bản hội đồng |
| Thẻ QR A6 300gsm cán mờ | 3.000 – 6.000 đ/thẻ | số lượng ít |

**Điểm tiết kiệm quyết định**: nếu để nguyên bản gốc, máy RIP của nhà in nhận diện
**54/73 trang là trang màu** (do tiêu đề, viền và nền khối mã đều dùng màu xanh navy
`#1F3864`). Sau khi tách, chỉ còn **10 trang màu thật**. Chênh lệch khoảng
**44 trang × ~3.500 đ ≈ 154.000 đ mỗi bản** — in 5 bản là tiết kiệm khoảng 770.000 đ.

---

## 6. Tiến độ

| Thời điểm | Việc |
|---|---|
| 09/09 chiều | Chốt số bản, gọi Vigroup xác nhận giá + thời gian trả |
| 10/09 sáng | Mang/gửi bộ file, duyệt bản in thử (proof) 1 trang màu + 1 trang đen trắng |
| 10/09 chiều | Nhận hàng, kiểm tra thứ tự trang và vị trí trang gập |
| 11/09 | Bảo vệ |

**Kiểm tra khi nhận hàng**: đúng thứ tự 10 trang màu · trang gập A3 gập đúng chiều,
không bị xén mất mép · ép kim gáy không lệch · thẻ QR quét thử được cả 3 mã.
