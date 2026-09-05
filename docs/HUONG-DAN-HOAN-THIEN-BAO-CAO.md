# Hướng dẫn hoàn thiện bộ hồ sơ báo cáo đồ án

Bộ hồ sơ nằm trong `FinalProject/docs/`:

| Tệp | Nội dung |
|---|---|
| `BAO-CAO-DO-AN-LearnQuiz.docx` | Báo cáo chính — bản nộp. Mục lục là **trường tự động của Word**. |
| `BAO-CAO-DO-AN-LearnQuiz.pdf` | Bản PDF 72 trang, mục lục đã điền sẵn số trang — dùng để xem nhanh, in thử hoặc gửi qua email. |
| `SLIDE-BAO-VE-LearnQuiz.pptx` | Bộ slide bảo vệ 17 trang. |
| `hinh-ve.zip` | 10 sơ đồ dạng PNG kèm mã nguồn sơ đồ (Mermaid `.mmd`, Graphviz `.dot`) để sửa và xuất lại. |

---

## 1. Các trường thông tin cá nhân

Họ tên học viên (**VŨ TÂM THIỆN TÍN**) và giảng viên hướng dẫn (**NGUYỄN LÊ HOÀNG THÔNG**) đã được điền sẵn ở bìa chính, bìa phụ, trang Lời cảm ơn và slide bảo vệ.

**Mã học viên**: để trống ở bìa chính (trang 1) và bìa phụ (trang 2) — đây là lựa chọn đã chốt, không phải thiếu sót cần điền thêm.

Trang **Nhận xét của giảng viên hướng dẫn** để trống cho thầy ghi và ký.

## 2. Cập nhật mục lục trong Word

Báo cáo dùng ba trường tự động: **Mục lục**, **Danh mục hình vẽ**, **Danh mục bảng biểu**.

Word thường tự cập nhật ngay khi mở tệp. Nếu chưa thấy số trang:

1. Nhấn `Ctrl + A` để chọn toàn văn bản
2. Nhấn `F9`
3. Nếu Word hỏi, chọn **Update entire table**

Làm lại thao tác này **sau mỗi lần sửa nội dung** để số trang khớp lại.

## 3. Quy cách trình bày đã áp dụng

| Hạng mục | Giá trị |
|---|---|
| Khổ giấy | A4 |
| Lề | trên 2 cm · dưới 2 cm · trái 3 cm · phải 2 cm |
| Phông chữ | Times New Roman 13 pt (mã nguồn dùng Courier New 9 pt) |
| Giãn dòng | 1,5 · thụt dòng đầu 1,25 cm · canh đều hai bên |
| Đánh số trang | phần đầu sách dùng số La Mã thường; thân bài đánh số Ả Rập từ 1 |
| Chú thích | tên hình đặt **dưới** hình, tên bảng đặt **trên** bảng, canh giữa, in nghiêng |
| Sơ đồ ERD | đặt riêng một trang **khổ ngang** để đọc được toàn bộ 11 bảng |

## 4. Cấu trúc báo cáo

```
Bìa chính · Bìa phụ
Lời cảm ơn
Nhận xét của giảng viên hướng dẫn
Mục lục · Danh mục hình vẽ · Danh mục bảng biểu · Danh mục từ viết tắt
Chương 1. Tổng quan
Chương 2. Cơ sở lý thuyết và công nghệ
Chương 3. Phân tích và thiết kế hệ thống
Chương 4. Cài đặt hệ thống
Chương 5. Kiểm thử và triển khai
   (5.7.1 giải trình lựa chọn hạ tầng Vercel + Render)
Chương 6. Kết luận và hướng phát triển
Tài liệu tham khảo (16 mục)
Phụ lục A. Bảng tra cứu mã lỗi và thông báo
Phụ lục B. Lược đồ cơ sở dữ liệu (trích)
Phụ lục C. Hướng dẫn cài đặt và chạy thử
Phụ lục D. Kịch bản trình diễn khi bảo vệ
```

Toàn bộ: **72 trang · 10 hình vẽ · 43 bảng biểu**.

## 5. Nếu muốn bổ sung ảnh chụp màn hình

Báo cáo hiện dùng sơ đồ kỹ thuật, chưa có ảnh chụp giao diện. Nếu thầy/cô yêu cầu, nên chụp 6 màn hình sau (chạy hệ thống ở máy, nhấn `Windows + Shift + S`):

1. Trang danh sách khóa học có bộ lọc — minh họa cho mục 3.7
2. Màn hình học bài với thanh tiến độ và danh sách bài bị khóa — mục 4.5
3. Màn hình làm quiz — mục 4.4
4. Màn hình kết quả quiz kèm lời giải thích của AI — mục 4.8
5. Trình soạn quiz với nút *Sinh câu hỏi bằng AI* — mục 4.8
6. Trang duyệt khóa học của quản trị viên — mục 3.6

Chèn vào cuối mục tương ứng, đặt chú thích **dưới** ảnh theo mẫu `Hình 4.5. …`, rồi cập nhật lại mục lục theo bước 2.

## 6. Sửa và xuất lại sơ đồ

Giải nén `hinh-ve.zip`:

- Tệp `.mmd` là sơ đồ Mermaid — sửa và xuất tại <https://mermaid.live>
- Tệp `erd.dot` là sơ đồ ERD dạng Graphviz — sửa và xuất tại <https://dreampuf.github.io/GraphvizOnline>

Xuất ảnh PNG rồi thay vào đúng vị trí trong báo cáo.
