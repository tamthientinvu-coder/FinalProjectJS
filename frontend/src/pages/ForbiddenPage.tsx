import { Paper, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <Paper sx={{ p: 5, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        403 · Không có quyền truy cập
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Tài khoản của bạn không được phép xem trang này.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/">
        Về trang chủ
      </Button>
    </Paper>
  );
}
