import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Skeleton,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Radio,
  Divider,
  Chip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { quizApi } from "../../api/quizApi";
import { aiApi } from "../../api/aiApi";
import { useAiStatus } from "../../hooks/useAiStatus";
import { handleApiError } from "../../utils/handleApiError";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type { EditorQuizView, QuizPayload } from "../../types/quiz";
import type { AiDraftQuestion } from "../../types/ai";

const CHOICES_PER_QUESTION = 4;

interface DraftChoice {
  text: string;
  isCorrect: boolean;
}
interface DraftQuestion {
  text: string;
  choices: DraftChoice[];
}

const emptyQuestion = (): DraftQuestion => ({
  text: "",
  choices: Array.from({ length: CHOICES_PER_QUESTION }, (_, i) => ({
    text: "",
    isCorrect: i === 0, // mặc định đáp án A đúng, giảng viên đổi sau
  })),
});

export default function QuizEditorPage() {
  const { id } = useParams<{ id: string }>();
  const lessonId = Number(id);
  const navigate = useNavigate();

  const { aiReady } = useAiStatus();

  const [view, setView] = useState<EditorQuizView | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Trạng thái riêng cho hộp thoại sinh câu hỏi bằng AI ---
  const [aiOpen, setAiOpen] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiContent, setAiContent] = useState("");
  const [aiDraft, setAiDraft] = useState<AiDraftQuestion[] | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [passScore, setPassScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState<string>(""); // "" = không giới hạn
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);

  useEffect(() => {
    setLoading(true);
    quizApi
      .getForEditor(lessonId)
      .then((res) => {
        const data = res.data.data;
        setView(data);
        if (data.quiz) {
          setTitle(data.quiz.title);
          setPassScore(data.quiz.passScore);
          setMaxAttempts(data.quiz.maxAttempts === null ? "" : String(data.quiz.maxAttempts));
          setQuestions(
            data.quiz.questions.map((q) => ({
              text: q.text,
              choices: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })),
            }))
          );
        } else {
          setTitle(`Kiểm tra: ${data.lesson.title}`);
        }
      })
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, [lessonId]);

  // ---------- Thao tác trên bản nháp ----------

  const patchQuestion = (index: number, patch: Partial<DraftQuestion>) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const patchChoice = (qIndex: number, cIndex: number, patch: Partial<DraftChoice>) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, choices: q.choices.map((c, j) => (j === cIndex ? { ...c, ...patch } : c)) }
          : q
      )
    );

  /** Chọn đáp án đúng: đánh dấu 1 đáp án đồng thời bỏ dấu 3 đáp án còn lại. */
  const setCorrect = (qIndex: number, cIndex: number) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, choices: q.choices.map((c, j) => ({ ...c, isCorrect: j === cIndex })) }
          : q
      )
    );

  /**
   * Kiểm tra ngay tại trình duyệt trước khi gọi API — cùng bộ luật với
   * quizSchema.ts phía server. Trùng lặp có chủ đích: báo lỗi nhanh cho
   * người dùng, còn server vẫn kiểm lại vì client luôn có thể bị bỏ qua.
   */
  const validate = (): string | null => {
    if (title.trim().length < 3) return "Tên quiz tối thiểu 3 ký tự";
    if (questions.length === 0) return "Quiz phải có ít nhất 1 câu hỏi";

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.text.trim().length < 5) return `Câu ${i + 1}: nội dung câu hỏi tối thiểu 5 ký tự`;
      if (q.choices.some((c) => !c.text.trim())) return `Câu ${i + 1}: còn đáp án bỏ trống`;
      if (q.choices.filter((c) => c.isCorrect).length !== 1) {
        return `Câu ${i + 1}: phải chọn đúng 1 đáp án đúng`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload: QuizPayload = {
        title: title.trim(),
        passScore,
        maxAttempts: maxAttempts === "" ? null : Number(maxAttempts),
        questions: questions.map((q) => ({
          text: q.text.trim(),
          choices: q.choices.map((c) => ({ text: c.text.trim(), isCorrect: c.isCorrect })),
        })),
      };

      if (view?.isLocked && view.quiz) {
        // Điểm đạt là một phần của lịch sử chấm; chỉ tên và số lượt làm còn đổi được.
        await quizApi.updateMeta(view.quiz.id, {
          title: payload.title,
          maxAttempts: payload.maxAttempts,
        });
      } else {
        await quizApi.upsert(lessonId, payload);
      }
      setToast("Đã lưu quiz");
    } catch (err) {
      setError(handleApiError(err));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  /** Gọi AI sinh nháp câu hỏi. Kết quả CHƯA vào đề, chờ giảng viên duyệt. */
  const handleAiGenerate = async () => {
    setAiBusy(true);
    setAiError("");
    setAiDraft(null);
    try {
      const res = await aiApi.generateQuiz(lessonId, {
        count: aiCount,
        content: aiContent.trim() || undefined,
      });
      setAiDraft(res.data.data.questions);
    } catch (err) {
      setAiError(handleApiError(err));
    } finally {
      setAiBusy(false);
    }
  };

  /** Chèn nháp của AI vào cuối đề để giảng viên sửa tiếp. */
  const handleAiInsert = () => {
    if (!aiDraft) return;
    setQuestions((prev) => {
      // Bỏ câu trống mặc định nếu giảng viên chưa gõ gì
      const meaningful = prev.filter((q) => q.text.trim() || q.choices.some((c) => c.text.trim()));
      return [...meaningful, ...aiDraft.map((q) => ({ text: q.text, choices: q.choices }))];
    });
    setAiOpen(false);
    setAiDraft(null);
    setToast(`Đã chèn ${aiDraft.length} câu hỏi do AI soạn — hãy đọc lại trước khi lưu`);
  };

  const handleDelete = async () => {
    if (!view?.quiz) return;
    setSaving(true);
    try {
      await quizApi.remove(view.quiz.id);
      navigate(`/instructor/courses/${view.lesson.courseId}/lessons`, { replace: true });
    } catch (err) {
      setError(handleApiError(err));
      setDeleteOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={560} />;
  if (!view) return <Alert severity="error">{error || "Không tải được quiz"}</Alert>;

  const locked = view.isLocked;

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          size="small"
          component={RouterLink}
          to={`/instructor/courses/${view.lesson.courseId}/lessons`}
        >
          Danh sách bài học
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Box>
          <Typography variant="h4">{view.quiz ? "Sửa quiz" : "Soạn quiz"}</Typography>
          <Typography color="text.secondary">Bài học: {view.lesson.title}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {view.quiz && (
            <Button color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>
              Xóa quiz
            </Button>
          )}
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}>
            {saving ? "Đang lưu..." : "Lưu quiz"}
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {locked && (
        <Alert severity="warning">
          Quiz đã có <strong>{view.quiz?._count.submissions} lượt làm bài</strong> nên bộ câu hỏi bị
          khóa để giữ nguyên kết quả của học viên. Bạn vẫn đổi được tên quiz, điểm đạt và số lượt
          làm. Muốn thay đề, hãy xóa quiz — thao tác này xóa luôn toàn bộ kết quả cũ.
        </Alert>
      )}

      {/* ---------- Thông tin chung ---------- */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Thông tin chung
        </Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" } }}>
          <TextField
            label="Tên quiz"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Điểm đạt"
            type="number"
            fullWidth
            value={passScore}
            onChange={(e) => setPassScore(Number(e.target.value))}
            disabled={locked}
            helperText={locked ? "Đã có bài nộp nên điểm đạt được giữ cố định" : "Từ 0 đến 100"}
          />
          <TextField
            select
            label="Số lượt làm tối đa"
            fullWidth
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            helperText="Bỏ trống là không giới hạn"
          >
            <MenuItem value="">Không giới hạn</MenuItem>
            {[1, 2, 3, 5, 10].map((n) => (
              <MenuItem key={n} value={String(n)}>
                {n} lượt
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* ---------- Câu hỏi ---------- */}
      {questions.map((question, qIndex) => (
        <Paper key={qIndex} sx={{ p: 3, opacity: locked ? 0.7 : 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Chip label={`Câu ${qIndex + 1}`} color="primary" sx={{ fontWeight: 700 }} />
            <Tooltip title={questions.length === 1 ? "Quiz phải có ít nhất 1 câu" : "Xóa câu hỏi"}>
              <span>
                <IconButton
                  color="error"
                  size="small"
                  disabled={locked || questions.length === 1}
                  onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIndex))}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <TextField
            label="Nội dung câu hỏi"
            fullWidth
            multiline
            minRows={2}
            disabled={locked}
            value={question.text}
            onChange={(e) => patchQuestion(qIndex, { text: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Bấm vào nút tròn bên trái để chọn đáp án đúng (đúng 1 đáp án).
          </Typography>

          <Stack spacing={1}>
            {question.choices.map((choice, cIndex) => (
              <Box key={cIndex} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Radio
                  checked={choice.isCorrect}
                  disabled={locked}
                  onChange={() => setCorrect(qIndex, cIndex)}
                  color="success"
                />
                <TextField
                  fullWidth
                  size="small"
                  disabled={locked}
                  label={`Đáp án ${String.fromCharCode(65 + cIndex)}`}
                  value={choice.text}
                  onChange={(e) => patchChoice(qIndex, cIndex, { text: e.target.value })}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      ))}

      {!locked && (
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }} useFlexGap>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
          >
            Thêm câu hỏi
          </Button>

          <Tooltip
            title={
              aiReady
                ? "Gemini đọc nội dung bài học và soạn nháp câu hỏi"
                : "Máy chủ chưa cấu hình GEMINI_API_KEY nên tính năng AI đang tắt"
            }
          >
            <span>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<AutoAwesomeIcon />}
                disabled={!aiReady}
                onClick={() => {
                  setAiOpen(true);
                  setAiDraft(null);
                  setAiError("");
                }}
              >
                Sinh câu hỏi bằng AI
              </Button>
            </span>
          </Tooltip>
        </Stack>
      )}

      {/* ---------- Hộp thoại sinh câu hỏi bằng AI ---------- */}
      <Dialog open={aiOpen} onClose={() => setAiOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Sinh câu hỏi bằng AI</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {aiError && <Alert severity="error">{aiError}</Alert>}

            <Alert severity="info">
              AI chỉ soạn <strong>bản nháp</strong>. Câu hỏi chưa được lưu — giảng viên đọc lại,
              sửa nếu cần rồi mới bấm Lưu quiz. Đầu ra của AI cũng phải qua đúng bộ kiểm tra như
              câu hỏi gõ tay: đúng 4 đáp án, đúng 1 đáp án đúng.
            </Alert>

            <TextField
              select
              label="Số câu hỏi"
              value={aiCount}
              onChange={(e) => setAiCount(Number(e.target.value))}
              sx={{ maxWidth: 220 }}
            >
              {[3, 5, 8, 10].map((n) => (
                <MenuItem key={n} value={n}>
                  {n} câu
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Nội dung nguồn (không bắt buộc)"
              fullWidth
              multiline
              minRows={4}
              value={aiContent}
              onChange={(e) => setAiContent(e.target.value)}
              helperText="Bỏ trống thì AI dùng nội dung bài học đã lưu. Dán vào đây nếu bạn vừa sửa mà chưa lưu."
            />

            {aiDraft && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  AI đề xuất {aiDraft.length} câu hỏi:
                </Typography>
                <Stack spacing={1.5}>
                  {aiDraft.map((q, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {i + 1}. {q.text}
                      </Typography>
                      <Stack spacing={0.5}>
                        {q.choices.map((c, j) => (
                          <Typography
                            key={j}
                            variant="body2"
                            sx={{ color: c.isCorrect ? "success.main" : "text.secondary" }}
                          >
                            {String.fromCharCode(65 + j)}. {c.text}
                            {c.isCorrect && " ✓"}
                          </Typography>
                        ))}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiOpen(false)} disabled={aiBusy}>
            Đóng
          </Button>
          <Button onClick={handleAiGenerate} disabled={aiBusy} startIcon={<AutoAwesomeIcon />}>
            {aiBusy ? "AI đang soạn..." : aiDraft ? "Sinh lại" : "Sinh câu hỏi"}
          </Button>
          <Button variant="contained" onClick={handleAiInsert} disabled={!aiDraft || aiBusy}>
            Chèn vào đề
          </Button>
        </DialogActions>
      </Dialog>

      <Divider />

      <Box>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}>
          {saving ? "Đang lưu..." : "Lưu quiz"}
        </Button>
      </Box>

      <ConfirmDialog
        open={deleteOpen}
        title="Xóa quiz"
        message={
          locked
            ? `Quiz này đã có ${view.quiz?._count.submissions} lượt làm bài. Xóa quiz sẽ xóa vĩnh viễn toàn bộ điểm số và bài làm của học viên. Chắc chắn xóa?`
            : "Xóa quiz này? Toàn bộ câu hỏi và đáp án sẽ mất."
        }
        confirmText="Xóa quiz"
        loading={saving}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
      />
    </Stack>
  );
}
