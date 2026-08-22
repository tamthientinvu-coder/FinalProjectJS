import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QuizIcon from "@mui/icons-material/Quiz";
import { useParams, Link as RouterLink } from "react-router-dom";
import { lessonApi } from "../../api/lessonApi";
import { courseApi } from "../../api/courseApi";
import { handleApiError } from "../../utils/handleApiError";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type { LessonFull } from "../../types/lesson";

interface FormState {
  id: number; // 0 = tạo mới
  title: string;
  content: string;
  videoUrl: string;
}

const EMPTY_FORM: FormState = { id: 0, title: "", content: "", videoUrl: "" };

export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const [courseTitle, setCourseTitle] = useState("");
  const [lessons, setLessons] = useState<LessonFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<LessonFull | null>(null);

  const loadLessons = () =>
    lessonApi
      .listForEditor(courseId)
      .then((res) => setLessons(res.data.data))
      .catch((err) => setError(handleApiError(err)));

  useEffect(() => {
    setLoading(true);
    Promise.all([
      courseApi
        .getById(courseId)
        .then((res) => setCourseTitle(res.data.data.title))
        .catch(() => setCourseTitle("")),
      loadLessons(),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSave = async () => {
    if (!form) return;
    if (form.title.trim().length < 3) {
      setFormError("Tên bài học tối thiểu 3 ký tự");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim() || undefined,
        // Chuỗi rỗng không phải URL hợp lệ -> phải gửi null để backend hiểu là "bỏ trống"
        videoUrl: form.videoUrl.trim() || null,
      };
      if (form.id > 0) {
        await lessonApi.update(form.id, payload);
        setToast("Đã cập nhật bài học");
      } else {
        await lessonApi.create(courseId, payload);
        setToast("Đã thêm bài học");
      }
      setForm(null);
      await loadLessons();
    } catch (err) {
      setFormError(handleApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await lessonApi.remove(deleting.id);
      setToast("Đã xóa bài học");
      setDeleting(null);
      await loadLessons();
    } catch (err) {
      setError(handleApiError(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Đổi chỗ hai bài liền kề rồi đánh số lại 1..n cho toàn bộ danh sách
   * và gửi trọn gói lên server. Backend xử lý trong transaction 2 pha
   * nên không bao giờ vi phạm ràng buộc @@unique([courseId, order]).
   */
  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;

    const next = [...lessons];
    [next[index], next[target]] = [next[target], next[index]];

    const items = next.map((l, i) => ({ id: l.id, order: i + 1 }));
    setLessons(next.map((l, i) => ({ ...l, order: i + 1 }))); // cập nhật lạc quan cho mượt

    try {
      const res = await lessonApi.reorder(courseId, items);
      setLessons(res.data.data);
    } catch (err) {
      setError(handleApiError(err));
      await loadLessons(); // lỗi thì lấy lại trạng thái thật từ server
    }
  };

  if (loading) return <Skeleton variant="rounded" height={420} />;

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          size="small"
          component={RouterLink}
          to="/instructor/courses"
        >
          Khóa học của tôi
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Box>
          <Typography variant="h4">Soạn bài học</Typography>
          <Typography color="text.secondary">
            {courseTitle || `Khóa học #${courseId}`} · {lessons.length} bài học
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm({ ...EMPTY_FORM })}>
          Thêm bài học
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Alert severity="info">
        Thứ tự bài học quyết định lộ trình học: học viên phải hoàn thành bài trước mới mở được bài
        sau. Dùng mũi tên lên / xuống để sắp xếp.
      </Alert>

      {lessons.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Khóa học chưa có bài học nào
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Khóa học cần ít nhất 1 bài học trước khi gửi quản trị viên duyệt.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm({ ...EMPTY_FORM })}>
            Thêm bài học đầu tiên
          </Button>
        </Paper>
      ) : (
        <Paper>
          <List disablePadding>
            {lessons.map((lesson, index) => (
              <ListItem key={lesson.id} divider sx={{ gap: 1 }}>
                <Chip label={lesson.order} size="small" sx={{ fontWeight: 700, minWidth: 40 }} />
                <ListItemText
                  primary={lesson.title}
                  secondary={
                    lesson.content
                      ? `${lesson.content.slice(0, 110)}${lesson.content.length > 110 ? "…" : ""}`
                      : "Chưa có nội dung"
                  }
                />
                <Tooltip title={lesson.quiz ? `Sửa quiz: ${lesson.quiz.title}` : "Soạn quiz cho bài này"}>
                  <IconButton
                    size="small"
                    color={lesson.quiz ? "secondary" : "default"}
                    component={RouterLink}
                    to={`/instructor/lessons/${lesson.id}/quiz`}
                  >
                    <QuizIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Lên trên">
                  <span>
                    <IconButton size="small" disabled={index === 0} onClick={() => handleMove(index, -1)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Xuống dưới">
                  <span>
                    <IconButton
                      size="small"
                      disabled={index === lessons.length - 1}
                      onClick={() => handleMove(index, 1)}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Sửa">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setForm({
                        id: lesson.id,
                        title: lesson.title,
                        content: lesson.content ?? "",
                        videoUrl: lesson.videoUrl ?? "",
                      })
                    }
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => setDeleting(lesson)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* ---- Form thêm / sửa bài học ---- */}
      <Dialog open={Boolean(form)} onClose={() => setForm(null)} maxWidth="md" fullWidth>
        <DialogTitle>{form && form.id > 0 ? "Sửa bài học" : "Thêm bài học"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Tên bài học"
              fullWidth
              autoFocus
              value={form?.title ?? ""}
              onChange={(e) => form && setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Nội dung bài học"
              fullWidth
              multiline
              minRows={8}
              value={form?.content ?? ""}
              onChange={(e) => form && setForm({ ...form, content: e.target.value })}
              helperText="Nội dung này sẽ là nguồn để Gemini sinh câu hỏi quiz ở Sprint 5"
            />
            <TextField
              label="Link video (không bắt buộc)"
              fullWidth
              placeholder="https://www.youtube.com/watch?v=..."
              value={form?.videoUrl ?? ""}
              onChange={(e) => form && setForm({ ...form, videoUrl: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm(null)} disabled={busy}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={busy}>
            {busy ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa bài học"
        message={`Xóa bài "${deleting?.title}"? Quiz và tiến độ học viên của bài này cũng bị xóa theo.`}
        confirmText="Xóa"
        loading={busy}
        onCancel={() => setDeleting(null)}
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
