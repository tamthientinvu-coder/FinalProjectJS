import { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Skeleton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LockIcon from "@mui/icons-material/Lock";
import QuizIcon from "@mui/icons-material/Quiz";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useParams, useSearchParams, Link as RouterLink } from "react-router-dom";
import { lessonApi } from "../api/lessonApi";
import { aiApi } from "../api/aiApi";
import { useAiStatus } from "../hooks/useAiStatus";
import { handleApiError } from "../utils/handleApiError";
import type { LearnView, LessonContent } from "../types/lesson";

export default function LearnPage() {
  const { courseId } = useParams<{ courseId: string }>();
  // Bài đang mở nằm trên URL (?lesson=12) để F5 không mất chỗ đang học
  const [searchParams, setSearchParams] = useSearchParams();
  const activeLessonId = searchParams.get("lesson");

  const lessonVersion = useRef(0);
  const [view, setView] = useState<LearnView | null>(null);
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState("");
  const [lessonError, setLessonError] = useState("");
  const [marking, setMarking] = useState(false);

  // --- Tóm tắt bài học bằng AI ---
  const { aiReady } = useAiStatus();
  const [summary, setSummary] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // 1) Nạp khung màn hình học, tự chọn bài đầu tiên chưa hoàn thành
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    lessonApi.getLearnView(Number(courseId))
      .then((res) => {
        if (ignore) return;
        const data = res.data.data;
        setView(data);
        if (activeLessonId) return;
        const next = data.lessons.find((l) => l.isUnlocked && !l.isCompleted) ?? data.lessons[0];
        if (next) setSearchParams({ lesson: String(next.id) }, { replace: true });
      })
      .catch((err) => { if (!ignore) setError(handleApiError(err)); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // 2) Nạp nội dung bài đang chọn
  useEffect(() => {
    const version = ++lessonVersion.current;
    let ignore = false;
    setLesson(null);
    setSummarizing(false);
    setMarking(false);
    if (!activeLessonId) return;
    setLessonLoading(true);
    setLessonError("");
    // Đổi bài thì bỏ bản tóm tắt của bài cũ đi
    setSummary(null);
    setSummaryError("");
    lessonApi
      .getContent(Number(activeLessonId))
      .then((res) => { if (!ignore) setLesson(res.data.data); })
      .catch((err) => {
        if (ignore) return;
        setLesson(null);
        setLessonError(handleApiError(err));
      })
      .finally(() => { if (!ignore) setLessonLoading(false); });
    return () => {
      ignore = true;
      if (lessonVersion.current === version) lessonVersion.current += 1;
    };
  }, [activeLessonId, courseId]);

  const handleToggleComplete = async () => {
    if (!lesson) return;
    const version = lessonVersion.current;
    setMarking(true);
    try {
      // Backend trả về tiến độ mới -> cập nhật thanh bên và % ngay, khỏi gọi lại
      const res = await lessonApi.markComplete(lesson.id, !lesson.isCompleted);
      if (version !== lessonVersion.current) return;
      setView(res.data.data);
      setLesson({ ...lesson, isCompleted: !lesson.isCompleted });
    } catch (err) {
      if (version === lessonVersion.current) setLessonError(handleApiError(err));
    } finally {
      if (version === lessonVersion.current) setMarking(false);
    }
  };

  const goToLesson = (id: number) => setSearchParams({ lesson: String(id) });

  const handleSummarize = async () => {
    if (!lesson) return;
    const version = lessonVersion.current;
    setSummarizing(true);
    setSummaryError("");
    try {
      const res = await aiApi.summarizeLesson(lesson.id);
      if (version === lessonVersion.current) setSummary(res.data.data.bullets);
    } catch (err) {
      if (version === lessonVersion.current) setSummaryError(handleApiError(err));
    } finally {
      if (version === lessonVersion.current) setSummarizing(false);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={480} />;

  if (error || !view) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error || "Không tải được khóa học"}</Alert>
        <Box>
          <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/my-courses">
            Về khóa học của tôi
          </Button>
        </Box>
      </Stack>
    );
  }

  const currentIndex = view.lessons.findIndex((l) => l.id === Number(activeLessonId));
  const nextLesson = currentIndex >= 0 ? view.lessons[currentIndex + 1] : undefined;
  const currentNav = currentIndex >= 0 ? view.lessons[currentIndex] : undefined;

  return (
    <Stack spacing={2}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          size="small"
          component={RouterLink}
          to={view.canManage ? "/instructor/courses" : "/my-courses"}
        >
          {view.canManage ? "Khóa học của tôi (giảng viên)" : "Khóa học của tôi"}
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
          alignItems: "start",
        }}
      >
        {/* ---------- Thanh bên: danh sách bài học ---------- */}
        <Paper sx={{ p: 2, position: { md: "sticky" }, top: 88 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {view.course.title}
          </Typography>

          {view.canManage ? (
            <Chip size="small" color="secondary" label="Chế độ giảng viên" sx={{ mt: 1 }} />
          ) : (
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Tiến độ
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {view.progress.completed}/{view.progress.total} · {view.progress.percent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={view.progress.percent}
                color={view.progress.percent === 100 ? "success" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          <List dense disablePadding>
            {view.lessons.map((l) => (
              <ListItemButton
                key={l.id}
                selected={l.id === Number(activeLessonId)}
                disabled={!l.isUnlocked}
                onClick={() => goToLesson(l.id)}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {!l.isUnlocked ? (
                    <LockIcon fontSize="small" color="disabled" />
                  ) : l.isCompleted ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`${l.order}. ${l.title}`}
                  slotProps={{ primary: { variant: "body2" } }}
                />
                {l.hasQuiz && <QuizIcon fontSize="small" color="secondary" />}
              </ListItemButton>
            ))}
          </List>

          {view.lessons.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              Khóa học chưa có bài học nào.
            </Typography>
          )}
        </Paper>

        {/* ---------- Nội dung bài học ---------- */}
        <Paper sx={{ p: { xs: 2, md: 4 }, minHeight: 400 }}>
          {lessonLoading ? (
            <Stack spacing={2}>
              <Skeleton variant="text" height={48} />
              <Skeleton variant="rounded" height={280} />
            </Stack>
          ) : lessonError ? (
            <Alert severity="warning">{lessonError}</Alert>
          ) : !lesson ? (
            <Typography color="text.secondary">Chọn một bài học ở thanh bên để bắt đầu.</Typography>
          ) : (
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Bài {lesson.order}
                </Typography>
                <Typography variant="h5">{lesson.title}</Typography>
              </Box>

              {lesson.videoUrl && (
                <Alert severity="info" icon={false}>
                  Video bài học:{" "}
                  <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">
                    {lesson.videoUrl}
                  </a>
                </Alert>
              )}

              <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.9 }}>
                {lesson.content || "Bài học này chưa có nội dung."}
              </Typography>

              {summaryError && <Alert severity="warning">{summaryError}</Alert>}

              {summary && (
                <Alert severity="info" icon={<AutoAwesomeIcon fontSize="small" />}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Tóm tắt nhanh
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {summary.map((bullet, i) => (
                      <li key={i}>
                        <Typography variant="body2">{bullet}</Typography>
                      </li>
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                    Bản tóm tắt do AI tạo — vẫn nên đọc kỹ bài học đầy đủ.
                  </Typography>
                </Alert>
              )}

              <Divider />

              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }} useFlexGap>
                {!view.canManage && (
                  <Button
                    variant={lesson.isCompleted ? "outlined" : "contained"}
                    color={lesson.isCompleted ? "success" : "primary"}
                    startIcon={<CheckCircleIcon />}
                    disabled={marking}
                    onClick={handleToggleComplete}
                  >
                    {marking
                      ? "Đang lưu..."
                      : lesson.isCompleted
                        ? "Đã hoàn thành — bấm để bỏ đánh dấu"
                        : "Đánh dấu hoàn thành"}
                  </Button>
                )}

                <Tooltip
                  title={
                    aiReady
                      ? "Gemini tóm tắt bài học thành vài gạch đầu dòng"
                      : "Máy chủ chưa cấu hình GEMINI_API_KEY nên tính năng AI đang tắt"
                  }
                >
                  <span>
                    <Button
                      variant="text"
                      color="secondary"
                      startIcon={<AutoAwesomeIcon />}
                      disabled={!aiReady || summarizing || !lesson.content}
                      onClick={handleSummarize}
                    >
                      {summarizing ? "AI đang tóm tắt..." : summary ? "Tóm tắt lại" : "Tóm tắt bài học"}
                    </Button>
                  </span>
                </Tooltip>

                {currentNav?.hasQuiz && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<QuizIcon />}
                    component={RouterLink}
                    to={`/quiz/${lesson.id}`}
                  >
                    {view.canManage ? "Xem trước quiz" : "Làm quiz cuối bài"}
                  </Button>
                )}

                {nextLesson && (
                  <Button
                    variant="text"
                    disabled={!nextLesson.isUnlocked}
                    onClick={() => goToLesson(nextLesson.id)}
                  >
                    {nextLesson.isUnlocked
                      ? `Bài tiếp theo: ${nextLesson.title}`
                      : "Hoàn thành bài này để mở bài tiếp theo"}
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
        </Paper>
      </Box>
    </Stack>
  );
}
