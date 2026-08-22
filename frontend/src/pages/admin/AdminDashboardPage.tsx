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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SchoolIcon from "@mui/icons-material/School";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import QuizIcon from "@mui/icons-material/Quiz";
import { Link as RouterLink } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { handleApiError } from "../../utils/handleApiError";
import { STATUS_COLOR, STATUS_LABEL, type CourseStatus } from "../../types/course";
import type { OverviewStats } from "../../types/admin";

/** Thẻ số liệu: một con số lớn, một nhãn, một dòng chú thích. */
function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", mb: 1 }}>
        {icon}
        <Typography variant="body2">{label}</Typography>
      </Stack>
      <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

/** Thanh tỷ lệ đơn giản - không dùng thư viện biểu đồ để bundle nhẹ. */
function Breakdown({ rows, total }: { rows: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <Stack spacing={1.5}>
      {rows.map((row) => (
        <Box key={row.label}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2">{row.label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {row.value}
              {total > 0 && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  ({Math.round((row.value / total) * 100)}%)
                </Typography>
              )}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={total === 0 ? 0 : (row.value / total) * 100}
            sx={{ height: 8, borderRadius: 4, bgcolor: "grey.200", "& .MuiLinearProgress-bar": { bgcolor: row.color } }}
          />
        </Box>
      ))}
    </Stack>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getOverviewStats()
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton variant="rounded" height={520} />;
  if (error || !stats) return <Alert severity="error">{error || "Không tải được thống kê"}</Alert>;

  const statusRows: { label: string; value: number; color: string }[] = (
    ["published", "pending", "draft", "rejected"] as CourseStatus[]
  ).map((s) => ({
    label: STATUS_LABEL[s],
    value: stats.courses[s],
    color:
      s === "published" ? "#2e7d32" : s === "pending" ? "#ed6c02" : s === "rejected" ? "#d32f2f" : "#90a4ae",
  }));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Tổng quan hệ thống
        </Typography>
        <Typography color="text.secondary">
          Số liệu được tính trực tiếp trong cơ sở dữ liệu bằng <code>groupBy</code> và{" "}
          <code>_avg</code>, không kéo toàn bộ bản ghi về máy chủ ứng dụng.
        </Typography>
      </Box>

      {stats.courses.pending > 0 && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/admin/courses?status=pending">
              Xử lý ngay
            </Button>
          }
        >
          Có <strong>{stats.courses.pending}</strong> khóa học đang chờ duyệt.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        }}
      >
        <StatCard
          icon={<PeopleAltIcon fontSize="small" />}
          label="Người dùng"
          value={stats.users.total}
          hint={`${stats.users.student} học viên · ${stats.users.instructor} giảng viên · ${stats.users.admin} quản trị`}
        />
        <StatCard
          icon={<SchoolIcon fontSize="small" />}
          label="Khóa học"
          value={stats.courses.total}
          hint={`${stats.courses.published} đang hiển thị công khai`}
        />
        <StatCard
          icon={<HowToRegIcon fontSize="small" />}
          label="Lượt đăng ký học"
          value={stats.enrollments}
          hint="Tổng số cặp học viên – khóa học"
        />
        <StatCard
          icon={<QuizIcon fontSize="small" />}
          label="Điểm trung bình"
          value={stats.avgScore === null ? "—" : stats.avgScore}
          hint={`${stats.submissions} lượt làm quiz`}
        />
      </Box>

      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Khóa học theo trạng thái
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Breakdown rows={statusRows} total={stats.courses.total} />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Người dùng theo vai trò
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Breakdown
            rows={[
              { label: "Học viên", value: stats.users.student, color: "#1565c0" },
              { label: "Giảng viên", value: stats.users.instructor, color: "#ef6c00" },
              { label: "Quản trị", value: stats.users.admin, color: "#6a1b9a" },
            ]}
            total={stats.users.total}
          />
        </Paper>
      </Box>

      <Paper>
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h6">Khóa học nhiều học viên nhất</Typography>
          <Typography variant="body2" color="text.secondary">
            Chỉ tính khóa học đã được duyệt và đang hiển thị công khai.
          </Typography>
        </Box>

        {stats.topCourses.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
            Chưa có khóa học nào được công khai.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Khóa học</TableCell>
                  <TableCell>Giảng viên</TableCell>
                  <TableCell align="center">Bài học</TableCell>
                  <TableCell align="center">Học viên</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.topCourses.map((course, index) => (
                  <TableRow key={course.id} hover>
                    <TableCell>
                      <Chip size="small" label={index + 1} color={index === 0 ? "secondary" : "default"} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{course.title}</TableCell>
                    <TableCell>{course.instructor.name}</TableCell>
                    <TableCell align="center">{course._count.lessons}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" color="primary" label={course._count.enrollments} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" component={RouterLink} to={`/courses/${course.id}/stats`}>
                        Thống kê
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button variant="contained" component={RouterLink} to="/admin/courses?status=pending">
          Hàng đợi duyệt khóa học
        </Button>
        <Button variant="outlined" component={RouterLink} to="/admin/users">
          Quản lý người dùng
        </Button>
        <Button variant="outlined" component={RouterLink} to="/admin/categories">
          Quản lý danh mục
        </Button>
      </Box>

      {/* Chip trạng thái dùng chung bảng màu với toàn hệ thống */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {(["published", "pending", "draft", "rejected"] as CourseStatus[]).map((s) => (
          <Chip key={s} size="small" color={STATUS_COLOR[s]} label={`${STATUS_LABEL[s]}: ${stats.courses[s]}`} />
        ))}
      </Box>
    </Stack>
  );
}
