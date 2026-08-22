import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Paper, Typography, TextField, Button, Alert, Stack, Box, Divider } from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../utils/handleApiError";

const schema = yup.object({
  email: yup.string().required("Vui lòng nhập email").email("Email không đúng định dạng"),
  password: yup.string().required("Vui lòng nhập mật khẩu").min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type FormValues = yup.InferType<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      setServerError(handleApiError(err));
    }
  };

  /** Nút điền nhanh tài khoản seed - tiện lúc demo với giáo viên. */
  const fillDemo = (email: string) => {
    setValue("email", email);
    setValue("password", "123456");
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 460, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Đăng nhập
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Email"
            fullWidth
            autoComplete="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Mật khẩu"
            type="password"
            fullWidth
            autoComplete="current-password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" sx={{ mt: 2 }}>
        Chưa có tài khoản? <RouterLink to="/register">Đăng ký ngay</RouterLink>
      </Typography>

      <Divider sx={{ my: 2 }}>Tài khoản demo (mật khẩu 123456)</Divider>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Button size="small" variant="outlined" onClick={() => fillDemo("student@learnquiz.vn")}>
          Học viên
        </Button>
        <Button size="small" variant="outlined" onClick={() => fillDemo("instructor@learnquiz.vn")}>
          Giảng viên
        </Button>
        <Button size="small" variant="outlined" onClick={() => fillDemo("admin@learnquiz.vn")}>
          Quản trị
        </Button>
      </Stack>
    </Paper>
  );
}
