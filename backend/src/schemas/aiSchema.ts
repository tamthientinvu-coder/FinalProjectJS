import * as yup from "yup";

export const generateQuizSchema = yup.object({
  count: yup
    .number()
    .typeError("Số câu hỏi phải là số")
    .integer("Số câu hỏi phải là số nguyên")
    .min(1, "Sinh tối thiểu 1 câu hỏi")
    .max(10, "Mỗi lần sinh tối đa 10 câu hỏi")
    .default(5),
  /**
   * Nội dung giảng viên vừa gõ trong form nhưng CHƯA lưu.
   * Cho phép sinh câu hỏi ngay khi đang soạn, không bắt phải lưu bài học trước.
   */
  content: yup.string().trim().max(50000, "Nội dung tối đa 50.000 ký tự").optional(),
});

export const explainAnswerSchema = yup.object({
  submissionId: yup
    .number()
    .typeError("Mã bài làm không hợp lệ")
    .integer()
    .positive()
    .required("Thiếu mã bài làm"),
  questionId: yup
    .number()
    .typeError("Mã câu hỏi không hợp lệ")
    .integer()
    .positive()
    .required("Thiếu mã câu hỏi"),
});
