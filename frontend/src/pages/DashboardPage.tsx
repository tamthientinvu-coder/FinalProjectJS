import { Paper, Typography, Stack, Divider, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/api";

const roleIntro: Record<UserRole, string> = {
  student: "Theo dõi khóa học đang học và tiến độ của bạn ở đây.",
  instructor: "Quản lý khóa học, soạn bài học và quiz do bạn tạo.",
  admin: "Duyệt khóa học, quản lý danh mục và người dùng.",
};

const quickLinks: Record<UserRole, { label: string; to: string }[]> = {
  student: [
    { label: "Khóa học đang học", to: "/my-courses" },
    { label: "Duyệt khóa học mới", to: "/courses" },
  ],
  instructor: [
    { label: "Quản lý khóa học", to: "/instructor/courses" },
    { label: "Tạo khóa học mới", to: "/instructor/courses/new" },
    { label: "Khóa học đang học", to: "/my-courses" },
  ],
  admin: [
    { label: "Tổng quan hệ thống", to: "/admin" },
    { label: "Duyệt khóa học", to: "/admin/courses?status=pending" },
    { label: "Quản lý người dùng", to: "/admin/users" },
    { label: "Quản lý danh mục", to: "/admin/categories" },
  ],
};

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Xin chào {user.name}
      </Typography>
      <Divider sx={{ my: 2 }} />

      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography>
          <strong>Email:</strong> {user.email}
        </Typography>
        <Typography>
          <strong>Vai trò:</strong> {user.role}
        </Typography>
        <Typography color="text.secondary">{roleIntro[user.role]}</Typography>
      </Stack>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {quickLinks[user.role].map((link) => (
          <Button key={link.to + link.label} variant="outlined" component={RouterLink} to={link.to}>
            {link.label}
          </Button>
        ))}
      </Box>
    </Paper>
  );
}
