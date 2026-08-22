import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Skeleton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { quizApi } from "../api/quizApi";
import { handleApiError } from "../utils/handleApiError";
import ConfirmDialog from "../components/common/ConfirmDialog";
import type { StudentQuizView } from "../types/quiz";

export default function QuizPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [view, setView] = useState<StudentQuizView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /** questionId -> choiceId đã chọn. Câu chưa chọn thì không có mặt trong map. */
  const [selected, setSelected] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    quizApi
      .getForStudent(Number(lessonId))
      .then((res) => setView(res.data.data))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleSubmit = async () => {
    if (!view) return;
    setConfirmOpen(false);
    setSubmitting(true);
    setError("");
    try {
      // Gửi ĐỦ mọi câu hỏi, câu chưa chọn thì choiceId = null.
      // Không lọc bớt để server luôn biết tổng số câu của bài làm.
      const answers = view.questions.map((q) => ({
        questionId: q.id,
        choiceId: selected[q.id] ?? null,
      }));
      const res = await quizApi.submit(view.quiz.id, answers);
      navigate(`/quiz-result/${res.data.data.submission.id}`, { replace: true });
    } catch (err) {
      setError(handleApiError(err));
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={520} />;

  if (error && !view) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error}</Alert>
        <Box>
          <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/my-courses">
            Về khóa học của tôi
          </Button>
        </Box>
      </Stack>
    );
  }

  if (!view) return null;

  const answeredCount = view.questions.filter((q) => selected[q.id] !== undefined).length;
  const totalCount = view.questions.length;
  const allAnswered = answeredCount === totalCount;

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          size="small"
          component={RouterLink}
          to={`/learn/${view.lesson.courseId}?lesson=${view.lesson.id}`}
        >
          Quay lại bài học
        </Button>
      </Box>

      {/* ---------- Đầu trang ---------- */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="overline" color="text.secondary">
          {view.lesson.title}
        </Typography>
        <Typography variant="h4" gutterBottom>
          {view.quiz.title}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
          <Chip size="small" label={`${totalCount} câu hỏi`} />
          <Chip size="small" color="primary" label={`Đạt từ ${view.quiz.passScore} điểm`} />
          <Chip
            size="small"
            variant="outlined"
            label={
              view.quiz.maxAttempts === null
                ? `Đã làm ${view.attempts.used} lượt · không giới hạn`
                : `Lượt ${view.attempts.used}/${view.quiz.maxAttempts}`
            }
          />
          {view.attempts.best && (
            <Chip size="small" color="success" label={`Điểm cao nhất: ${view.attempts.best.score}`} />
          )}
        </Stack>

        {view.attempts.history.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Lịch sử làm bài
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lượt</TableCell>
                  <TableCell align="center">Điểm</TableCell>
                  <TableCell align="right">Xem lại</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {view.attempts.history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>Lần {h.attemptNo}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        color={h.score >= view.quiz.passScore ? "success" : "default"}
                        label={h.score}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" component={RouterLink} to={`/quiz-result/${h.id}`}>
                        Xem lại
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {view.isPreview && (
        <Alert severity="info">
          Bạn đang xem trước đề với tư cách giảng viên. Đề hiển thị đúng như học viên nhìn thấy —
          không có đánh dấu đáp án đúng — và bạn không nộp bài được.
        </Alert>
      )}

      {!view.attempts.canAttempt && !view.isPreview && (
        <Alert severity="warning">
          Bạn đã dùng hết {view.quiz.maxAttempts} lượt làm bài cho quiz này. Vẫn xem lại được các bài
          đã nộp ở bảng trên.
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {/* ---------- Thanh tiến độ trả lời ---------- */}
      <Paper sx={{ p: 2, position: "sticky", top: 72, zIndex: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Đã trả lời
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {answeredCount}/{totalCount} câu
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={totalCount === 0 ? 0 : (answeredCount / totalCount) * 100}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* ---------- Danh sách câu hỏi ---------- */}
      {view.questions.map((question) => (
        <Paper key={question.id} sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            Câu {question.order}
            {selected[question.id] === undefined && (
              <Chip size="small" label="Chưa chọn" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Typography sx={{ mb: 2, whiteSpace: "pre-line" }}>{question.text}</Typography>

          <FormControl disabled={!view.attempts.canAttempt || submitting}>
            <RadioGroup
              value={selected[question.id] ?? ""}
              onChange={(e) =>
                setSelected((prev) => ({ ...prev, [question.id]: Number(e.target.value) }))
              }
            >
              {question.choices.map((choice) => (
                <FormControlLabel
                  key={choice.id}
                  value={choice.id}
                  control={<Radio />}
                  label={choice.text}
                  sx={{ py: 0.25 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Paper>
      ))}

      {/* ---------- Nộp bài ---------- */}
      {view.attempts.canAttempt && (
        <Paper sx={{ p: 3 }}>
          {!allAnswered && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Còn {totalCount - answeredCount} câu chưa chọn đáp án. Câu bỏ trống được tính là sai.
            </Alert>
          )}
          <Button
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            disabled={submitting}
            onClick={() => setConfirmOpen(true)}
          >
            {submitting ? "Đang chấm điểm..." : "Nộp bài"}
          </Button>
        </Paper>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Nộp bài"
        message={
          allAnswered
            ? "Nộp bài ngay bây giờ? Điểm sẽ hiện ngay sau khi nộp."
            : `Bạn còn ${totalCount - answeredCount} câu chưa trả lời. Các câu này tính là sai. Vẫn nộp chứ?`
        }
        confirmText="Nộp bài"
        loading={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
      />

      <Divider />
    </Stack>
  );
}
