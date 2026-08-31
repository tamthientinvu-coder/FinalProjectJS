import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Skeleton,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Link as RouterLink } from "react-router-dom";
import { enrollmentApi } from "../api/enrollmentApi";
import { handleApiError } from "../utils/handleApiError";
import { formatQuizScore } from "../utils/formatQuizScore";
import { LEVEL_LABEL } from "../types/course";
import type { EnrollmentWithProgress } from "../types/lesson";

export default function MyCoursesPage() {
  const [items, setItems] = useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    enrollmentApi
      .listMine()
      .then((res) => setItems(res.data.data))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton variant="rounded" height={320} />;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Khóa học của tôi
        </Typography>
        <Typography color="text.secondary">
          {items.length === 0
            ? "Bạn chưa đăng ký khóa học nào"
            : `Đang theo học ${items.length} khóa học`}
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {items.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Chưa có khóa học nào
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Chọn một khóa học miễn phí và bắt đầu học ngay.
          </Typography>
          <Button variant="contained" component={RouterLink} to="/courses">
            Duyệt khóa học
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          }}
        >
          {items.map((item) => (
            <Card key={item.id} sx={{ display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }} useFlexGap>
                  {item.course.category && (
                    <Chip size="small" color="primary" label={item.course.category.name} />
                  )}
                  <Chip size="small" variant="outlined" label={LEVEL_LABEL[item.course.level]} />
                  {item.progressPercent === 100 && (
                    <Chip size="small" color="success" label="Đã hoàn thành" />
                  )}
                </Stack>

                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {item.course.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Giảng viên: {item.course.instructor.name}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tiến độ
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.completedLessons}/{item.totalLessons} bài · {item.progressPercent}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.progressPercent}
                  color={item.progressPercent === 100 ? "success" : "primary"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Trung bình điểm cao nhất mỗi quiz: {formatQuizScore(item.averageQuizScore)}
                </Typography>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  component={RouterLink}
                  to={`/learn/${item.course.id}`}
                >
                  {item.completedLessons === 0 ? "Bắt đầu học" : "Học tiếp"}
                </Button>
                <Button component={RouterLink} to={`/courses/${item.course.id}`}>
                  Xem khóa học
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
}
