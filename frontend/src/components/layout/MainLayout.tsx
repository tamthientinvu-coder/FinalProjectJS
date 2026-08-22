import { Box, Container, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function MainLayout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Outlet />
      </Container>
      <Box component="footer" sx={{ py: 2, textAlign: "center", bgcolor: "grey.100" }}>
        <Typography variant="body2" color="text.secondary">
          LearnQuiz · Đồ án tốt nghiệp Lập trình Full-stack JavaScript K312
        </Typography>
      </Box>
    </Box>
  );
}
