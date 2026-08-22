import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Button,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import QuizIcon from "@mui/icons-material/Quiz";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { courseApi } from "../api/courseApi";
import { enrollmentApi } from "../api/enrollmentApi";
import { handleApiError } from "../utils/handleApiError";
import { useAuth } from "../context/AuthContext";
import {
  LEVEL_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  type CourseDetail,
} from "../types/course";

const FALLBACK_THUMB = "https://placehold.co/1200x400/e0e0e0/757575?text=LearnQuiz";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    courseApi
      .getById(Number(id))
      .then((res) => setCourse(res.data.data))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!course) return;
    // Chưa đăng nhập thì đưa sang trang login, nhớ đường quay lại
    if (!user) {
      navigate("/login", { state: { from: `/courses/${course.id}` } });
      return;
    }
    setEnrolling(true);
    setEnrollError("");
    try {
      await enrollmentApi.enroll(course.id);
      navigate(`/learn/${course.id}`);
    } catch (err) {
      setEnrollError(handleApiError(err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={240} />
        <Skeleton variant="text" height={50} />
        <Skeleton variant="rounded" height={200} />
      </Stack>
    );
  }

  if (error || !course) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error || "Không tìm thấy khóa học"}</Alert>
        <Box>
          <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/courses">
            Về danh sách khóa học
          </Button>
        </Box>
      </Stack>
    );
  }

  const isOwner = user?.id === course.instructorId;

  return (
    <Stack spacing={3}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/courses" size="small">
          Danh sách khóa học
        </Button>
      </Box>

      <Paper sx={{ overflow: "hidden" }}>
        <Box
          component="img"
          src={course.thumbnail || FALLBACK_THUMB}
          alt={course.title}
          sx={{ width: "100%", height: { xs: 180, md: 280 }, objectFit: "cover", display: "block" }}
        />

        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }} useFlexGap>
            {course.category && <Chip size="small" color="primary" label={course.category.name} />}
            <Chip size="small" variant="outlined" label={LEVEL_LABEL[course.level]} />
            {/* Nhãn trạng thái chỉ có ý nghĩa với chủ sở hữu và admin */}
            {(isOwner || user?.role === "admin") && (
              <Chip size="small" color={STATUS_COLOR[course.status]} label={STATUS_LABEL[course.status]} />
            )}
          </Stack>

          <Typography variant="h4" gutterBottom>
            {course.title}
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Giảng viên: <strong>{course.instructor.name}</strong> · {course._count.lessons} bài học ·{" "}
            {course._count.enrollments} học viên đã đăng ký
          </Typography>

          <Typography sx={{ whiteSpace: "pre-line" }}>
            {course.description || "Khóa học chưa có mô tả."}
          </Typography>

          {course.status === "rejected" && isOwner && course.rejectReason && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Khóa học bị từ chối. Lý do: {course.rejectReason}
            </Alert>
          )}

          {enrollError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {enrollError}
            </Alert>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 3, flexWrap: "wrap" }} useFlexGap>
            {course.canManage ? (
              <>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to={`/instructor/courses/${course.id}/lessons`}
                >
                  Soạn bài học
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to={`/instructor/courses/${course.id}/edit`}
                >
                  Sửa khóa học
                </Button>
              </>
            ) : course.isEnrolled ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                component={RouterLink}
                to={`/learn/${course.id}`}
              >
                Vào học
              </Button>
            ) : (
              <Tooltip
                title={
                  course.status === "published"
                    ? "Khóa học miễn phí, đăng ký là học được ngay"
                    : "Khóa học chưa được duyệt nên chưa mở đăng ký"
                }
              >
                <span>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={enrolling || course.status !== "published"}
                    onClick={handleEnroll}
                  >
                    {enrolling ? "Đang đăng ký..." : "Đăng ký học"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Nội dung khóa học
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {course.isEnrolled || course.canManage
            ? "Bạn đã có quyền xem nội dung. Bấm Vào học để bắt đầu."
            : "Nội dung chi tiết của từng bài chỉ mở sau khi đăng ký khóa học."}
        </Typography>
        <Divider />

        {course.lessons.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            Khóa học chưa có bài học nào.
          </Typography>
        ) : (
          <List>
            {course.lessons.map((lesson) => (
              <ListItem key={lesson.id} divider>
                <ListItemIcon>
                  {course.isEnrolled || course.canManage ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <LockIcon color="disabled" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`Bài ${lesson.order}. ${lesson.title}`}
                  secondary={lesson.quiz ? "Có quiz cuối bài" : "Không có quiz"}
                />
                {lesson.quiz && <QuizIcon color="secondary" />}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
}
