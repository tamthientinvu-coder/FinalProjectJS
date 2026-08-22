import * as yup from "yup";

const CHOICES_PER_QUESTION = 4;

const choiceSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required("Nội dung đáp án không được để trống")
    .max(500, "Đáp án tối đa 500 ký tự"),
  isCorrect: yup.boolean().default(false),
});

export const questionSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required("Nội dung câu hỏi không được để trống")
    .min(5, "Câu hỏi tối thiểu 5 ký tự")
    .max(1000, "Câu hỏi tối đa 1000 ký tự"),
  choices: yup
    .array()
    .of(choiceSchema)
    .length(CHOICES_PER_QUESTION, `Mỗi câu hỏi phải có đúng ${CHOICES_PER_QUESTION} đáp án`)
    .required()
    // Đề tài quy định trắc nghiệm 1 đáp án đúng: không được 0, không được 2.
    .test("exactly-one-correct", "Mỗi câu hỏi phải có đúng 1 đáp án đúng", (choices) => {
      if (!choices) return false;
      return choices.filter((c) => c?.isCorrect).length === 1;
    }),
});

/**
 * Tạo mới hoặc thay thế toàn bộ quiz của một bài học.
 * Dùng PUT (thay thế trọn gói) chứ không PATCH: bộ câu hỏi là một khối
 * thống nhất, sửa lắt nhắt từng câu dễ để lại trạng thái nửa vời.
 */
export const upsertQuizSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required("Tên quiz không được để trống")
    .min(3, "Tên quiz tối thiểu 3 ký tự")
    .max(200, "Tên quiz tối đa 200 ký tự"),
  passScore: yup
    .number()
    .typeError("Điểm đạt phải là số")
    .integer("Điểm đạt phải là số nguyên")
    .min(0, "Điểm đạt từ 0 đến 100")
    .max(100, "Điểm đạt từ 0 đến 100")
    .default(70),
  // null = làm lại không giới hạn
  maxAttempts: yup
    .number()
    .typeError("Số lượt làm phải là số")
    .integer("Số lượt làm phải là số nguyên")
    .min(1, "Số lượt làm tối thiểu là 1")
    .max(20, "Số lượt làm tối đa là 20")
    .nullable()
    .default(null),
  questions: yup
    .array()
    .of(questionSchema)
    .min(1, "Quiz phải có ít nhất 1 câu hỏi")
    .max(50, "Quiz tối đa 50 câu hỏi")
    .required("Thiếu danh sách câu hỏi"),
});

/** Chỉ sửa thông tin chung, không đụng tới bộ câu hỏi. */
export const updateQuizMetaSchema = yup.object({
  title: yup.string().trim().min(3, "Tên quiz tối thiểu 3 ký tự").max(200).optional(),
  passScore: yup
    .number()
    .typeError("Điểm đạt phải là số")
    .integer()
    .min(0, "Điểm đạt từ 0 đến 100")
    .max(100, "Điểm đạt từ 0 đến 100")
    .optional(),
  maxAttempts: yup
    .number()
    .typeError("Số lượt làm phải là số")
    .integer()
    .min(1, "Số lượt làm tối thiểu là 1")
    .max(20, "Số lượt làm tối đa là 20")
    .nullable()
    .optional(),
});

/**
 * Bài làm học viên gửi lên.
 * choiceId cho phép null để học viên được bỏ trống câu chưa biết
 * (bỏ trống tính là sai, không phải lỗi dữ liệu).
 */
export const submitQuizSchema = yup.object({
  answers: yup
    .array()
    .of(
      yup.object({
        questionId: yup
          .number()
          .typeError("Mã câu hỏi không hợp lệ")
          .integer("Mã câu hỏi phải là số nguyên")
          .positive("Mã câu hỏi phải là số dương")
          .required("Thiếu mã câu hỏi"),
        choiceId: yup
          .number()
          .typeError("Mã đáp án không hợp lệ")
          .integer("Mã đáp án phải là số nguyên")
          .positive("Mã đáp án phải là số dương")
          .nullable()
          .default(null),
      })
    )
    .min(1, "Bài làm không được rỗng")
    .required("Thiếu danh sách câu trả lời")
    .test("no-duplicate-question", "Có câu hỏi bị trả lời hai lần", (answers) => {
      if (!answers) return false;
      const ids = answers.map((a) => a?.questionId);
      return new Set(ids).size === ids.length;
    }),
});

/**
 * Dùng để kiểm tra ĐẦU RA CỦA AI trước khi đưa cho giảng viên xem.
 * Cố ý dùng lại đúng `questionSchema` của dữ liệu người dùng nhập tay:
 * AI cũng chỉ là một nguồn đầu vào không đáng tin, không được hưởng
 * ngoại lệ nào về luật ra đề (đúng 4 đáp án, đúng 1 đáp án đúng).
 */
export const aiQuestionsSchema = yup
  .array()
  .of(questionSchema)
  .min(1, "AI không sinh được câu hỏi nào")
  .max(20, "AI sinh quá nhiều câu hỏi")
  .required("AI không trả về danh sách câu hỏi");
