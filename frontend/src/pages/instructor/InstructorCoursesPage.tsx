import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Skeleton,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import BarChartIcon from "@mui/icons-material/BarChart";
import { Link as RouterLink } from "react-router-dom";
import { courseApi } from "../../api/courseApi";
import { handleApiError } from "../../utils/handleApiError";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  LEVEL_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  type CourseListItem,
} from "../../types/course";

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [deleting, setDeleting] = useState<CourseListItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    courseApi
      .listMine()
      .then((res) => setCourses(res.data.data))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmitForReview = async (course: CourseListItem) => {
    setError("");
    try {
      await courseApi.submit(course.id);
      setToast(`Đã gửi "${course.title}" đi duyệt`);
      load();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await courseApi.remove(deleting.id);
      setToast("Đã xóa khóa học");
      setDeleting(null);
      load();
    } catch (err) {
      setError(handleApiError(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Box>
          <Typography variant="h4">Khóa học của tôi</Typography>
          <Typography color="text.secondary">
            Soạn nội dung ở trạng thái nháp, xong thì gửi quản trị viên duyệt.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/instructor/courses/new"
        >
          Tạo khóa học
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Skeleton variant="rounded" height={260} />
      ) : courses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Bạn chưa có khóa học nào
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Bắt đầu bằng việc tạo khóa học đầu tiên.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/instructor/courses/new">
            Tạo khóa học
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên khóa học</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell>Độ khó</TableCell>
                <TableCell align="center">Bài học</TableCell>
                <TableCell align="center">Học viên</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {course.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{course.category?.name ?? "—"}</TableCell>
                  <TableCell>{LEVEL_LABEL[course.level]}</TableCell>
                  <TableCell align="center">{course._count.lessons}</TableCell>
                  <TableCell align="center">{course._count.enrollments}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={STATUS_COLOR[course.status]}
                      label={STATUS_LABEL[course.status]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Xem trang khóa học">
                      <IconButton size="small" component={RouterLink} to={`/courses/${course.id}`}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Sửa thông tin khóa học">
                      <IconButton
                        size="small"
                        component={RouterLink}
                        to={`/instructor/courses/${course.id}/edit`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Soạn bài học">
                      <IconButton
                        size="small"
                        color="secondary"
                        component={RouterLink}
                        to={`/instructor/courses/${course.id}/lessons`}
                      >
                        <MenuBookIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Xem thống kê học viên">
                      <IconButton
                        size="small"
                        component={RouterLink}
                        to={`/courses/${course.id}/stats`}
                      >
                        <BarChartIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip
                      title={
                        course.status === "draft" || course.status === "rejected"
                          ? "Gửi quản trị viên duyệt"
                          : "Chỉ gửi duyệt được khóa ở trạng thái nháp hoặc bị từ chối"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={course.status !== "draft" && course.status !== "rejected"}
                          onClick={() => handleSubmitForReview(course)}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip
                      title={
                        course._count.enrollments > 0
                          ? "Không xóa được vì đã có học viên đăng ký"
                          : "Xóa khóa học"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={course._count.enrollments > 0}
                          onClick={() => setDeleting(course)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa khóa học"
        message={`Xóa vĩnh viễn "${deleting?.title}"? Toàn bộ bài học và quiz bên trong cũng bị xóa theo.`}
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
