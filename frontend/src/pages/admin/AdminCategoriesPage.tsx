import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { categoryApi } from "../../api/categoryApi";
import { handleApiError } from "../../utils/handleApiError";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type { Category } from "../../types/course";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // null = đóng form; {id: 0} = đang tạo mới; còn lại = đang sửa
  const [editing, setEditing] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const [deleting, setDeleting] = useState<Category | null>(null);

  const load = () => {
    setLoading(true);
    categoryApi
      .list()
      .then((res) => setCategories(res.data.data))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing({ id: 0, name: "", slug: "" });
    setFormName("");
    setFormSlug("");
    setFormError("");
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormError("");
  };

  const handleSave = async () => {
    if (formName.trim().length < 2) {
      setFormError("Tên danh mục tối thiểu 2 ký tự");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (editing && editing.id > 0) {
        await categoryApi.update(editing.id, { name: formName.trim(), slug: formSlug.trim() });
        setToast("Đã cập nhật danh mục");
      } else {
        // Bỏ trống slug thì để server tự sinh từ tên
        await categoryApi.create({ name: formName.trim(), slug: formSlug.trim() || undefined });
        setToast("Đã tạo danh mục");
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(handleApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await categoryApi.remove(deleting.id);
      setToast("Đã xóa danh mục");
      setDeleting(null);
      load();
    } catch (err) {
      setError(handleApiError(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Box>
          <Typography variant="h4">Danh mục khóa học</Typography>
          <Typography color="text.secondary">
            Danh mục dùng để học viên lọc khóa học ở trang chủ.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Thêm danh mục
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Skeleton variant="rounded" height={240} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên danh mục</TableCell>
                <TableCell>Slug (dùng trong URL)</TableCell>
                <TableCell align="center">Số khóa học</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={c.slug} />
                  </TableCell>
                  <TableCell align="center">{c._count?.courses ?? 0}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Sửa">
                      <IconButton size="small" onClick={() => openEdit(c)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        (c._count?.courses ?? 0) > 0
                          ? "Không xóa được vì đang có khóa học thuộc danh mục này"
                          : "Xóa danh mục"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={(c._count?.courses ?? 0) > 0}
                          onClick={() => setDeleting(c)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ---- Form thêm / sửa ---- */}
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing && editing.id > 0 ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Tên danh mục"
              fullWidth
              autoFocus
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <TextField
              label="Slug"
              fullWidth
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              helperText='Để trống thì hệ thống tự sinh, ví dụ "Lập trình Web" → "lap-trinh-web"'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={busy}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={busy}>
            {busy ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa danh mục"
        message={`Xóa danh mục "${deleting?.name}"?`}
        confirmText="Xóa"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
      />
    </Stack>
  );
}
