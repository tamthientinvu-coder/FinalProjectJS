import { Box, Typography, Button, Paper, Stack, Chip } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SPRINTS: { label: string; done: boolean; text: string }[] = [
  { label: "Xong", done: true, text: "Sprint 0 · Dựng khung dự án, schema CSDL, đăng ký / đăng nhập / phân quyền" },
  { label: "Xong", done: true, text: "Sprint 1 · Danh mục & khóa học: CRUD, lọc theo danh mục và độ khó, phân trang" },
  { label: "Xong", done: true, text: "Sprint 2 · Bài học, đăng ký học, học theo thứ tự và theo dõi tiến độ" },
  { label: "Xong", done: true, text: "Sprint 3 · Quiz: soạn đề, làm bài, server chấm điểm, xem lại đáp án, làm lại" },
  { label: "Xong", done: true, text: "Sprint 4 · Duyệt khóa học, quản lý người dùng, thống kê" },
  { label: "Kế tiếp", done: false, text: "Sprint 5 · Tích hợp Gemini, Docker, CI/CD, triển khai cloud" },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <Stack spacing={4}>
      <Paper sx={{ p: 5, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Nền tảng học tập & Quiz trực tuyến
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 640, mx: "auto", mb: 3 }}>
          Giảng viên tạo khóa học và quiz, học viên đăng ký học, làm bài và theo dõi tiến độ.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ justifyContent: "center", flexWrap: "wrap" }} useFlexGap>
          <Button variant="contained" size="large" component={RouterLink} to="/courses">
            Xem danh sách khóa học
          </Button>
          {user ? (
            <Button variant="outlined" size="large" component={RouterLink} to="/dashboard">
              Vào khu vực của tôi
            </Button>
          ) : (
            <Button variant="outlined" size="large" component={RouterLink} to="/register">
              Đăng ký học
            </Button>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tiến độ đồ án
        </Typography>
        <Stack spacing={1}>
          {SPRINTS.map((s) => (
            <Box key={s.text}>
              <Chip
                size="small"
                color={s.done ? "success" : "default"}
                label={s.label}
                sx={{ mr: 1, minWidth: 64 }}
              />
              {s.text}
            </Box>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
