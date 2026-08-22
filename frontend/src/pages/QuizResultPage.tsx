import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Skeleton,
  Chip,
  Divider,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ReplayIcon from "@mui/icons-material/Replay";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useParams, Link as RouterLink } from "react-router-dom";
import { quizApi } from "../api/quizApi";
import { aiApi } from "../api/aiApi";
import { useAiStatus } from "../hooks/useAiStatus";
import { handleApiError } from "../utils/handleApiError";
import type { SubmissionResult } from "../types/quiz";

export default function QuizResultPage() {
  const { submissionId } = useParams<{ submissionId: string }>();

  const { aiReady } = useAiStatus();

  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** Lời giải thích của AI theo từng câu hỏi: questionId -> nội dung. */
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [explaining, setExplaining] = useState<number | null>(null);
  const [aiErrors, setAiErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!submissionId) return;
    setLoading(true);
    quizApi
      .getSubmission(Number(submissionId))
      .then((res) => setResult(res.data.data))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const handleExplain = async (questionId: number) => {
    if (!result) return;
    setExplaining(questionId);
    setAiErrors((prev) => ({ ...prev, [questionId]: "" }));
    try {
      const res = await aiApi.explainAnswer(result.submission.id, questionId);
      setExplanations((prev) => ({ ...prev, [questionId]: res.data.data.explanation }));
    } catch (err) {
      setAiErrors((prev) => ({ ...prev, [questionId]: handleApiError(err) }));
    } finally {
      setExplaining(null);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={520} />;

  if (error || !result) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error || "Không tìm thấy bài làm"}</Alert>
        <Box>
          <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/my-courses">
            Về khóa học của tôi
          </Button>
        </Box>
      </Stack>
    );
  }

  const { submission, quiz, lesson, questions } = result;
  const canRetry = quiz.maxAttempts === null || submission.attemptNo < quiz.maxAttempts;

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          size="small"
          component={RouterLink}
          to={`/learn/${lesson.courseId}?lesson=${lesson.id}`}
        >
          Quay lại bài học
        </Button>
      </Box>

      {/* ---------- Bảng điểm ---------- */}
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="overline" color="text.secondary">
          {lesson.title} · {quiz.title} · Lượt làm thứ {submission.attemptNo}
        </Typography>

        <Typography
          variant="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: 64, md: 88 },
            color: submission.passed ? "success.main" : "error.main",
            lineHeight: 1.1,
          }}
        >
          {submission.score}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Đúng {submission.correctCount}/{submission.totalQuestions} câu · Ngưỡng đạt{" "}
          {quiz.passScore} điểm
        </Typography>

        <Alert
          severity={submission.passed ? "success" : "warning"}
          sx={{ justifyContent: "center", mb: 3 }}
        >
          {submission.passed
            ? "Chúc mừng, bạn đã đạt bài kiểm tra này."
            : "Chưa đạt. Xem lại các câu sai bên dưới rồi thử lại nhé."}
        </Alert>

        <Stack direction="row" spacing={2} sx={{ justifyContent: "center", flexWrap: "wrap" }} useFlexGap>
          {canRetry && (
            <Button
              variant="contained"
              startIcon={<ReplayIcon />}
              component={RouterLink}
              to={`/quiz/${lesson.id}`}
            >
              Làm lại
            </Button>
          )}
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/learn/${lesson.courseId}?lesson=${lesson.id}`}
          >
            Tiếp tục học
          </Button>
        </Stack>
      </Paper>

      {/* ---------- Xem lại từng câu ---------- */}
      <Typography variant="h6">Xem lại đáp án</Typography>

      {questions.map((question) => {
        const correctChoice = question.choices.find((c) => c.isCorrect);
        const skipped = question.selectedChoiceId === null;

        return (
          <Paper
            key={question.id}
            sx={{
              p: 3,
              borderLeft: 5,
              borderColor: question.isCorrect ? "success.main" : "error.main",
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Câu {question.order}
              </Typography>
              <Chip
                size="small"
                color={question.isCorrect ? "success" : "error"}
                label={question.isCorrect ? "Đúng" : skipped ? "Bỏ trống" : "Sai"}
              />
            </Stack>

            <Typography sx={{ mb: 1.5, whiteSpace: "pre-line" }}>{question.text}</Typography>

            <List dense disablePadding>
              {question.choices.map((choice) => {
                const isSelected = choice.id === question.selectedChoiceId;
                const isRight = choice.isCorrect;

                return (
                  <ListItem
                    key={choice.id}
                    sx={{
                      borderRadius: 1,
                      bgcolor: isRight
                        ? "success.light"
                        : isSelected
                          ? "error.light"
                          : "transparent",
                      opacity: isRight || isSelected ? 1 : 0.75,
                      mb: 0.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {isRight ? (
                        <CheckCircleIcon fontSize="small" color="success" />
                      ) : isSelected ? (
                        <CancelIcon fontSize="small" color="error" />
                      ) : (
                        <RadioButtonUncheckedIcon fontSize="small" color="disabled" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={choice.text}
                      secondary={
                        isRight && isSelected
                          ? "Đáp án đúng — bạn đã chọn"
                          : isRight
                            ? "Đáp án đúng"
                            : isSelected
                              ? "Bạn đã chọn"
                              : undefined
                      }
                    />
                  </ListItem>
                );
              })}
            </List>

            {!question.isCorrect && correctChoice && (
              <>
                <Divider sx={{ my: 1.5 }} />

                {(() => {
                  // Ưu tiên lời giải thích đã lưu sẵn trong CSDL, rồi tới bản vừa lấy về
                  const explanation = question.aiExplanation ?? explanations[question.id];
                  if (explanation) {
                    return (
                      <Alert severity="info" icon={<AutoAwesomeIcon fontSize="small" />}>
                        {explanation}
                        <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                          Nội dung do AI đề xuất, cần kiểm tra lại với bài học.
                        </Typography>
                      </Alert>
                    );
                  }
                  return (
                    <Stack spacing={1}>
                      {aiErrors[question.id] && (
                        <Alert severity="warning">{aiErrors[question.id]}</Alert>
                      )}
                      <Box>
                        <Tooltip
                          title={
                            aiReady
                              ? "Gemini giải thích dựa trên nội dung bài học"
                              : "Máy chủ chưa cấu hình GEMINI_API_KEY nên tính năng AI đang tắt"
                          }
                        >
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              startIcon={<AutoAwesomeIcon />}
                              disabled={!aiReady || explaining === question.id}
                              onClick={() => handleExplain(question.id)}
                            >
                              {explaining === question.id ? "AI đang giải thích..." : "Vì sao sai?"}
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    </Stack>
                  );
                })()}
              </>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}
