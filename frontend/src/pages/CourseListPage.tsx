import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Pagination,
  Alert,
  Skeleton,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useSearchParams } from "react-router-dom";
import { courseApi } from "../api/courseApi";
import { categoryApi } from "../api/categoryApi";
import { handleApiError } from "../utils/handleApiError";
import CourseCard from "../components/course/CourseCard";
import { LEVEL_LABEL, type Category, type CourseListItem, type CourseLevel } from "../types/course";

const LIMIT = 9;

export default function CourseListPage() {
  /**
   * Bộ lọc lưu trên URL (?category=...&page=2) chứ không chỉ trong state:
   * người dùng F5 hay gửi link cho bạn bè vẫn giữ nguyên kết quả đang xem.
   */
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const level = (searchParams.get("level") ?? "") as CourseLevel | "";
  const sort = (searchParams.get("sort") ?? "newest") as "newest" | "oldest" | "title";
  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ô tìm kiếm là state riêng: gõ tới đâu gọi API tới đó sẽ tốn request vô ích,
  // nên chỉ đẩy lên URL khi bấm nút hoặc nhấn Enter.
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let ignore = false; // chống race condition: response cũ về sau response mới
    setLoading(true);
    setError("");

    courseApi
      .list({ category, level, search, sort, page, limit: LIMIT })
      .then((res) => {
        if (ignore) return;
        setCourses(res.data.data);
        setTotalPages(res.data.meta?.totalPages ?? 1);
        setTotal(res.data.meta?.total ?? 0);
      })
      .catch((err) => {
        if (!ignore) setError(handleApiError(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [category, level, search, sort, page]);

  /** Đổi bất kỳ bộ lọc nào cũng phải quay về trang 1, nếu không sẽ ra danh sách rỗng. */
  const updateFilter = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next);
  };

  const resetFilter = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  const hasFilter = Boolean(category || level || search || sort !== "newest");

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Khóa học
        </Typography>
        <Typography color="text.secondary">
          {loading ? "Đang tải..." : `Tìm thấy ${total} khóa học`}
        </Typography>
      </Box>

      {/* ---- Thanh bộ lọc ---- */}
      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 1fr auto" },
            alignItems: "start",
          }}
        >
          <TextField
            label="Tìm theo tên khóa học"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateFilter({ search: searchInput.trim() });
            }}
            slotProps={{
              input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> },
            }}
          />

          <TextField
            select
            label="Danh mục"
            size="small"
            value={category}
            onChange={(e) => updateFilter({ category: e.target.value })}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.slug}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Độ khó"
            size="small"
            value={level}
            onChange={(e) => updateFilter({ level: e.target.value })}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {(Object.keys(LEVEL_LABEL) as CourseLevel[]).map((lv) => (
              <MenuItem key={lv} value={lv}>
                {LEVEL_LABEL[lv]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Sắp xếp"
            size="small"
            value={sort}
            onChange={(e) => updateFilter({ sort: e.target.value })}
          >
            <MenuItem value="newest">Mới nhất</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="title">Theo tên A→Z</MenuItem>
          </TextField>

          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={resetFilter}
            disabled={!hasFilter}
            sx={{ height: 40 }}
          >
            Xóa lọc
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {/* ---- Danh sách ---- */}
      {loading ? (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={340} />
          ))}
        </Box>
      ) : courses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Không có khóa học nào phù hợp
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Thử bỏ bớt điều kiện lọc hoặc tìm với từ khóa khác.
          </Typography>
          {hasFilter && (
            <Button variant="outlined" onClick={resetFilter}>
              Xóa toàn bộ bộ lọc
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          }}
        >
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, value) => updateFilter({ page: String(value) })}
          />
        </Box>
      )}
    </Stack>
  );
}
