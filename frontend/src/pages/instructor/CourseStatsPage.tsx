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
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, Link as RouterLink } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { handleApiError } from "../../utils/handleApiError";
import { STATUS_COLOR, STATUS_LABEL } from "../../types/course";
import type { CourseStats } from "../../types/admin";

function StatBox({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
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

export default function CourseStatsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApi
      .getCourseStats(Number(id))
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton variant="rounded" height={520} />;

  if (error || !stats) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error || "Không tải được thống kê"}</Alert>
        <Box>
          <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/instructor/courses">
            Về khóa học của tôi
          </Button>
        </Box>
      </Stack>
    );
  }

  const { course, totals, progress, classAvgScore, quizzes, students } = stats;

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

      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
          <Typography variant="h4">{course.title}</Typography>
          <Chip size="small" color={STATUS_COLOR[course.status]} label={STATUS_LABEL[course.status]} />
        </Stack>
        <Typography color="text.secondary">Thống kê học viên và kết quả quiz</Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        }}
      >
        <StatBox label="Học viên" value={totals.students} hint={`${progress.completedAll} người học xong 100%`} />
        <StatBox label="Tiến độ trung bình" value={`${progress.avgPercent}%`} hint={`${totals.lessons} bài học`} />
        <StatBox
          label="Điểm trung bình lớp"
          value={classAvgScore === null ? "—" : classAvgScore}
          hint={`${totals.submissions} lượt làm bài`}
        />
        <StatBox label="Quiz" value={totals.quizzes} hint="Số bài học có quiz" />
      </Box>

      {totals.students === 0 && (
        <Alert severity="info">
          Khóa học chưa có học viên nào đăng ký nên chưa có số liệu để thống kê.
        </Alert>
      )}

      {/* ---------- Kết quả từng quiz ---------- */}
      <Paper>
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h6">Kết quả theo từng quiz</Typography>
          <Typography variant="body2" color="text.secondary">
            Mỗi quiz có ngưỡng đạt riêng nên tỷ lệ đạt được tính theo ngưỡng của chính quiz đó.
          </Typography>
        </Box>
        <Divider />

        {quizzes.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
            Khóa học chưa có quiz nào.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bài học</TableCell>
                  <TableCell>Quiz</TableCell>
                  <TableCell align="center">Ngưỡng đạt</TableCell>
                  <TableCell align="center">Lượt làm</TableCell>
                  <TableCell align="center">Học viên</TableCell>
                  <TableCell align="center">Điểm TB</TableCell>
                  <TableCell align="center">Cao nhất</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Tỷ lệ đạt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizzes.map((q) => (
                  <TableRow key={q.quizId} hover>
                    <TableCell>
                      Bài {q.lessonOrder}. {q.lessonTitle}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{q.title}</TableCell>
                    <TableCell align="center">{q.passScore}</TableCell>
                    <TableCell align="center">{q.attempts}</TableCell>
                    <TableCell align="center">{q.uniqueStudents}</TableCell>
                    <TableCell align="center">
                      {q.avgScore === null ? (
                        "—"
                      ) : (
                        <Chip
                          size="small"
                          color={q.avgScore >= q.passScore ? "success" : "warning"}
                          label={q.avgScore}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">{q.maxScore ?? "—"}</TableCell>
                    <TableCell>
                      <Tooltip title={`${q.passCount}/${q.attempts} lượt đạt`}>
                        <Box>
                          <Typography variant="caption">{q.passRate}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={q.passRate}
                            color={q.passRate >= 50 ? "success" : "warning"}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ---------- Danh sách học viên ---------- */}
      <Paper>
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h6">Học viên trong lớp</Typography>
        </Box>
        <Divider />

        {students.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
            Chưa có học viên đăng ký.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Học viên</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Tiến độ</TableCell>
                  <TableCell align="center">Lượt làm quiz</TableCell>
                  <TableCell align="center">Điểm TB</TableCell>
                  <TableCell align="center">Điểm cao nhất</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id} hover sx={{ opacity: s.isActive ? 1 : 0.6 }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {s.name}
                        {!s.isActive && <Chip size="small" color="error" label="Bị khóa" sx={{ ml: 1 }} />}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {s.completedLessons}/{s.totalLessons} bài · {s.progressPercent}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={s.progressPercent}
                        color={s.progressPercent === 100 ? "success" : "primary"}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </TableCell>
                    <TableCell align="center">{s.submissions}</TableCell>
                    <TableCell align="center">{s.avgScore ?? "—"}</TableCell>
                    <TableCell align="center">
                      {s.bestScore === null ? "—" : <Chip size="small" label={s.bestScore} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  );
}
