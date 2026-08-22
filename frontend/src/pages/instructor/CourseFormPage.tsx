import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Box,
  Alert,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import { courseApi } from "../../api/courseApi";
import { categoryApi } from "../../api/categoryApi";
import { handleApiError } from "../../utils/handleApiError";
import { LEVEL_LABEL, type Category, type CourseLevel } from "../../types/course";

/**
 * Quy tắc validate KHỚP với backend (courseSchema.ts).
 * Trùng lặp có chủ đích: FE báo lỗi ngay cho người dùng, BE vẫn kiểm lại
 * vì client luôn có thể bị bỏ qua bằng Postman.
 */
const schema = yup.object({
  title: yup
    .string()
    .required("Vui lòng nhập tên khóa học")
    .min(5, "Tên khóa học tối thiểu 5 ký tự")
    .max(200, "Tên khóa học tối đa 200 ký tự"),
  description: yup.string().max(5000, "Mô tả tối đa 5000 ký tự").default(""),
  thumbnail: yup
    .string()
    .default("")
    .test("url", "Ảnh bìa phải là URL hợp lệ (bắt đầu bằng http)", (value) => {
      if (!value) return true; // để trống là hợp lệ
      return /^https?:\/\/.+/.test(value);
    }),
  categoryId: yup.string().default(""),
  level: yup.string().oneOf(["beginner", "intermediate", "advanced"] as const).required(),
});

type FormValues = yup.InferType<typeof schema>;

export default function CourseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [serverError, setServerError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { title: "", description: "", thumbnail: "", categoryId: "", level: "beginner" },
  });

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    courseApi
      .getById(Number(id))
      .then((res) => {
        const c = res.data.data;
        // reset() nạp dữ liệu vào form sau khi API trả về
        reset({
          title: c.title,
          description: c.description ?? "",
          thumbnail: c.thumbnail ?? "",
          categoryId: c.categoryId ? String(c.categoryId) : "",
          level: c.level,
        });
      })
      .catch((err) => setServerError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    // Select trả về chuỗi rỗng khi không chọn -> backend cần null, không phải ""
    const payload = {
      title: values.title,
      description: values.description || undefined,
      thumbnail: values.thumbnail || null,
      categoryId: values.categoryId ? Number(values.categoryId) : null,
      level: values.level as CourseLevel,
    };

    try {
      if (isEdit) {
        await courseApi.update(Number(id), payload);
      } else {
        await courseApi.create(payload);
      }
      navigate("/instructor/courses", { replace: true });
    } catch (err) {
      setServerError(handleApiError(err));
    }
  };

  if (loading) return <Skeleton variant="rounded" height={480} />;

  return (
    <Stack spacing={2} sx={{ maxWidth: 720, mx: "auto" }}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          size="small"
          component={RouterLink}
          to="/instructor/courses"
        >
          Khóa học của tôi
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {isEdit ? "Sửa khóa học" : "Tạo khóa học mới"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isEdit
            ? "Nội dung sửa xong sẽ được lưu ngay, trạng thái duyệt không thay đổi."
            : "Khóa học mới luôn ở trạng thái Bản nháp. Thêm bài học rồi mới gửi duyệt được."}
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="Tên khóa học"
              fullWidth
              {...register("title")}
              error={!!errors.title}
              helperText={errors.title?.message}
            />

            <TextField
              label="Mô tả"
              fullWidth
              multiline
              minRows={4}
              {...register("description")}
              error={!!errors.description}
              helperText={errors.description?.message ?? "Giới thiệu ngắn về nội dung học viên sẽ học được"}
            />

            <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Danh mục" fullWidth>
                    <MenuItem value="">Chưa phân loại</MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Độ khó" fullWidth>
                    {(Object.keys(LEVEL_LABEL) as CourseLevel[]).map((lv) => (
                      <MenuItem key={lv} value={lv}>
                        {LEVEL_LABEL[lv]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>

            <TextField
              label="Ảnh bìa (URL)"
              fullWidth
              placeholder="https://placehold.co/600x400"
              {...register("thumbnail")}
              error={!!errors.thumbnail}
              helperText={errors.thumbnail?.message ?? "Để trống sẽ dùng ảnh mặc định"}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo khóa học"}
              </Button>
              <Button component={RouterLink} to="/instructor/courses" size="large">
                Hủy
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Stack>
  );
}
