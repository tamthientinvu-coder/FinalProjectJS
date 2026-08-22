import { Paper, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Paper sx={{ p: 5, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        404 · Không tìm thấy trang
      </Typography>
      <Button variant="contained" component={RouterLink} to="/">
        Về trang chủ
      </Button>
    </Paper>
  );
}
