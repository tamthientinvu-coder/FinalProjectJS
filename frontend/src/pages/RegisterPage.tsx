import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Box,
  MenuItem,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../utils/handleApiError";
import type { UserRole } from "../types/api";

const schema = yup.object({
  name: yup.string().required("Vui lòng nhập họ tên").min(2, "Họ tên tối thiểu 2 ký tự"),
  email: yup.string().required("Vui lòng nhập email").email("Email không đúng định dạng"),
  password: yup.string().required("Vui lòng nhập mật khẩu").min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: yup
    .string()
    .required("Vui lòng nhập lại mật khẩu")
    .oneOf([yup.ref("password")], "Mật khẩu nhập lại không khớp"),
  role: yup
    .string()
    .oneOf(["student", "instructor"] as const)
    .required(),
});

type FormValues = yup.InferType<typeof schema>;

export default function RegisterPage() {
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { role: "student" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    try {
      await doRegister(values.name, values.email, values.password, values.role as UserRole);
      navigate("/login", { replace: true });
    } catch (err) {
      setServerError(handleApiError(err));
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 460, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Đăng ký tài khoản
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Họ và tên"
            fullWidth
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
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
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <TextField
            label="Nhập lại mật khẩu"
            type="password"
            fullWidth
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
          {/* MUI Select không phải input thuần -> phải dùng Controller thay cho register */}
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Bạn đăng ký với vai trò"
                fullWidth
                error={!!errors.role}
                helperText={
                  errors.role?.message ?? "Tài khoản quản trị do hệ thống cấp, không tự đăng ký"
                }
              >
                <MenuItem value="student">Học viên</MenuItem>
                <MenuItem value="instructor">Giảng viên</MenuItem>
              </TextField>
            )}
          />

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" sx={{ mt: 2 }}>
        Đã có tài khoản? <RouterLink to="/login">Đăng nhập</RouterLink>
      </Typography>
    </Paper>
  );
}
