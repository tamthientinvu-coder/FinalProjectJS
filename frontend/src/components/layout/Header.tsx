import { AppBar, Toolbar, Typography, Button, Box, Chip, Avatar, Divider } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/api";

const roleLabel: Record<UserRole, string> = {
  student: "Học viên",
  instructor: "Giảng viên",
  admin: "Quản trị",
};

interface NavItem {
  label: string;
  to: string;
  /** Bỏ trống = hiện với mọi người (kể cả khách chưa đăng nhập). */
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Khóa học", to: "/courses" },
  { label: "Đang học", to: "/my-courses", roles: ["student", "instructor", "admin"] },
  { label: "Quản lý khóa học", to: "/instructor/courses", roles: ["instructor", "admin"] },
  { label: "Quản trị", to: "/admin", roles: ["admin"] },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleNav = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <SchoolIcon sx={{ mr: 1 }} />
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ textDecoration: "none", color: "inherit", mr: 2 }}
        >
          LearnQuiz
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 0.5 }}>
          {visibleNav.map((item) => (
            <Button
              key={item.to}
              color="inherit"
              component={RouterLink}
              to={item.to}
              sx={{
                // Gạch chân mục đang mở để người dùng biết mình đang ở đâu
                borderBottom: location.pathname.startsWith(item.to)
                  ? "2px solid"
                  : "2px solid transparent",
                borderRadius: 0,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip size="small" color="secondary" label={roleLabel[user.role]} sx={{ fontWeight: 600 }} />
            <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: 14 }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="body2"
              component={RouterLink}
              to="/dashboard"
              sx={{ display: { xs: "none", sm: "block" }, color: "inherit", textDecoration: "none" }}
            >
              {user.name}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.3)" }} />
            <Button color="inherit" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/login">
              Đăng nhập
            </Button>
            <Button color="inherit" variant="outlined" component={RouterLink} to="/register">
              Đăng ký
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
