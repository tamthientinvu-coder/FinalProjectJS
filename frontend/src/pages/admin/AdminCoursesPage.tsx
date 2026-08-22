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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Badge,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import SearchIcon from "@mui/icons-material/Search";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { handleApiError } from "../../utils/handleApiError";
import { LEVEL_LABEL, STATUS_COLOR, STATUS_LABEL, type CourseStatus } from "../../types/course";
import type { AdminCourseItem } from "../../types/admin";

const LIMIT = 10;

/**
 * Tab "Tất cả" dùng giá trị "all" chứ KHÔNG dùng chuỗi rỗng.
 * Chuỗi rỗng sẽ bị xóa khỏi URL, mà thiếu tham số status thì trang lại
 * quay về mặc định "pending" - bấm "Tất cả" xong vẫn thấy tab Chờ duyệt.
 */
const ALL = "all";

const TABS: { value: string; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đang hiển thị" },
  { value: "draft", label: "Bản nháp" },
  { value: "rejected", label: "Bị từ chối" },
  { value: ALL, label: "Tất cả" },
];

/** Hộp thoại nhập lý do - dùng chung cho Từ chối và Gỡ khóa học. */
interface ReasonDialogState {
  course: AdminCourseItem;
  action: "reject" | "unpublish";
}

export default function AdminCoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "pending";
  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";

  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const [searchInput, setSearchInput] = useState(search);
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    adminApi
      // "all" là quy ước của giao diện; backend hiểu "không lọc" là bỏ trống
      .listCourses({
        status: status === ALL ? "" : (status as CourseStatus),
        search,
        page,
        limit: LIMIT,
      })
      .then((res) => {
        setCourses(res.data.data);
        setCounts(res.data.counts ?? {});
        setTotalPages(res.data.meta?.totalPages ?? 1);
      })
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page, search]);

  const updateParams = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next);
  };

  const handlePublish = async (course: AdminCourseItem) => {
    setBusy(true);
    setError("");
    try {
      await adminApi.publishCourse(course.id);
      setToast(`Đã duyệt và công khai "${course.title}"`);
      load();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReasonSubmit = async () => {
    if (!reasonDialog) return;
    if (reason.trim().length < 10) {
      setReasonError("Lý do tối thiểu 10 ký tự để giảng viên biết đường sửa");
      return;
    }
    setBusy(true);
    setReasonError("");
    try {
      if (reasonDialog.action === "reject") {
        await adminApi.rejectCourse(reasonDialog.course.id, reason.trim());
        setToast("Đã từ chối khóa học");
      } else {
        await adminApi.unpublishCourse(reasonDialog.course.id, reason.trim());
        setToast("Đã gỡ khóa học khỏi trang công khai");
      }
      setReasonDialog(null);
      setReason("");
      load();
    } catch (err) {
      setReasonError(handleApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const openReason = (course: AdminCourseItem, action: "reject" | "unpublish") => {
    setReasonDialog({ course, action });
    setReason("");
    setReasonError("");
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Duyệt khóa học
        </Typography>
        <Typography color="text.secondary">
          Khóa học chỉ hiển thị công khai sau khi được quản trị viên duyệt. Khóa chờ lâu nhất xếp
          lên đầu.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper>
        <Tabs
          value={status}
          onChange={(_, value) => updateParams({ status: value })}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={
                tab.value === ALL ? (
                  tab.label
                ) : (
                  <Badge badgeContent={counts[tab.value] ?? 0} color="primary" sx={{ pr: 1.5 }}>
                    {tab.label}
                  </Badge>
                )
              }
            />
          ))}
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            fullWidth
            label="Tìm theo tên khóa học hoặc tên giảng viên"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ search: searchInput.trim() });
            }}
            slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> } }}
          />
        </Box>
      </Paper>

      {loading ? (
        <Skeleton variant="rounded" height={300} />
      ) : courses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Không có khóa học nào
          </Typography>
          <Typography color="text.secondary">
            {status === "pending"
              ? "Hàng đợi duyệt đang trống — không còn khóa học nào chờ xử lý."
              : "Thử chuyển sang tab khác hoặc xóa từ khóa tìm kiếm."}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Khóa học</TableCell>
                <TableCell>Giảng viên</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell align="center">Bài học</TableCell>
                <TableCell align="center">Học viên</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {course.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {LEVEL_LABEL[course.level]}
                    </Typography>
                    {course.rejectReason && (
                      <Typography variant="caption" color="error" sx={{ display: "block" }}>
                        Lý do: {course.rejectReason}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{course.instructor.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {course.instructor.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{course.category?.name ?? "—"}</TableCell>
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
                    <Tooltip title="Xem nội dung khóa học">
                      <IconButton size="small" component={RouterLink} to={`/courses/${course.id}`}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip
                      title={
                        course.status === "pending"
                          ? "Duyệt và công khai"
                          : "Chỉ duyệt được khóa đang chờ duyệt"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={busy || course.status !== "pending"}
                          onClick={() => handlePublish(course)}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip
                      title={
                        course.status === "pending"
                          ? "Từ chối kèm lý do"
                          : "Chỉ từ chối được khóa đang chờ duyệt"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={busy || course.status !== "pending"}
                          onClick={() => openReason(course, "reject")}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip
                      title={
                        course.status === "published"
                          ? "Gỡ khỏi trang công khai"
                          : "Chỉ gỡ được khóa đang hiển thị"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="warning"
                          disabled={busy || course.status !== "published"}
                          onClick={() => openReason(course, "unpublish")}
                        >
                          <UnpublishedIcon fontSize="small" />
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

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, value) => updateParams({ page: String(value) })}
          />
        </Box>
      )}

      {/* ---- Hộp thoại nhập lý do ---- */}
      <Dialog open={Boolean(reasonDialog)} onClose={() => setReasonDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reasonDialog?.action === "reject" ? "Từ chối khóa học" : "Gỡ khóa học khỏi trang công khai"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {reasonError && <Alert severity="error">{reasonError}</Alert>}
            <Typography variant="body2" color="text.secondary">
              {reasonDialog?.action === "reject"
                ? `Giảng viên sẽ thấy lý do này trên trang khóa học "${reasonDialog?.course.title}" và sửa rồi gửi duyệt lại.`
                : `Học viên đã đăng ký vẫn học tiếp được; chỉ chặn người mới đăng ký "${reasonDialog?.course.title}".`}
            </Typography>
            <TextField
              label="Lý do"
              fullWidth
              multiline
              minRows={3}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              helperText={`${reason.trim().length}/10 ký tự tối thiểu`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonDialog(null)} disabled={busy}>
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleReasonSubmit} disabled={busy}>
            {busy ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </Stack>
  );
}
