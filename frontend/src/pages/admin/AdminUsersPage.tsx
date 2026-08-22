import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Pagination,
  TextField,
  MenuItem,
  Snackbar,
  Avatar,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useSearchParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { handleApiError } from "../../utils/handleApiError";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type { AdminUser } from "../../types/admin";
import type { UserRole } from "../../types/api";

const LIMIT = 10;

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Học viên",
  instructor: "Giảng viên",
  admin: "Quản trị",
};

const ROLE_COLOR: Record<UserRole, "default" | "primary" | "secondary"> = {
  student: "default",
  instructor: "primary",
  admin: "secondary",
};

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = searchParams.get("role") ?? "";
  const isActive = searchParams.get("isActive") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const [searchInput, setSearchInput] = useState(search);
  const [target, setTarget] = useState<AdminUser | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    adminApi
      .listUsers({ role: role as UserRole | "", isActive, search, page, limit: LIMIT })
      .then((res) => {
        setUsers(res.data.data);
        setTotal(res.data.meta?.total ?? 0);
        setTotalPages(res.data.meta?.totalPages ?? 1);
      })
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [role, isActive, search, page]);

  const updateParams = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next);
  };

  const handleToggle = async () => {
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.setUserStatus(target.id, !target.isActive);
      setToast(target.isActive ? `Đã khóa tài khoản ${target.name}` : `Đã mở khóa ${target.name}`);
      setTarget(null);
      load();
    } catch (err) {
      setError(handleApiError(err));
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const hasFilter = Boolean(role || isActive || search);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Quản lý người dùng
        </Typography>
        <Typography color="text.secondary">
          {loading ? "Đang tải..." : `${total} tài khoản trong hệ thống`}
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Alert severity="info">
        Khóa tài khoản sẽ thu hồi phiên đăng nhập ngay. Người dùng có thể còn thao tác được tối đa
        15 phút nếu đang giữ access token chưa hết hạn — đây là đánh đổi có chủ đích của kiến trúc
        JWT để không phải truy vấn cơ sở dữ liệu ở mọi request.
      </Alert>

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr auto" },
            alignItems: "start",
          }}
        >
          <TextField
            size="small"
            label="Tìm theo tên hoặc email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ search: searchInput.trim() });
            }}
            slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> } }}
          />
          <TextField
            select
            size="small"
            label="Vai trò"
            value={role}
            onChange={(e) => updateParams({ role: e.target.value })}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Trạng thái"
            value={isActive}
            onChange={(e) => updateParams({ isActive: e.target.value })}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="true">Đang hoạt động</MenuItem>
            <MenuItem value="false">Bị khóa</MenuItem>
          </TextField>
          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            disabled={!hasFilter}
            onClick={() => {
              setSearchInput("");
              setSearchParams(new URLSearchParams());
            }}
            sx={{ height: 40 }}
          >
            Xóa lọc
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Skeleton variant="rounded" height={320} />
      ) : users.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6">Không tìm thấy tài khoản nào</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Người dùng</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell align="center">Khóa học dạy</TableCell>
                <TableCell align="center">Khóa đã học</TableCell>
                <TableCell align="center">Lượt làm quiz</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const isMe = u.id === me?.id;
                return (
                  <TableRow key={u.id} hover sx={{ opacity: u.isActive ? 1 : 0.6 }}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {u.name}
                            {isMe && <Chip size="small" label="Bạn" sx={{ ml: 1 }} />}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" color={ROLE_COLOR[u.role]} label={ROLE_LABEL[u.role]} />
                    </TableCell>
                    <TableCell align="center">{u._count.coursesTaught}</TableCell>
                    <TableCell align="center">{u._count.enrollments}</TableCell>
                    <TableCell align="center">{u._count.submissions}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={u.isActive ? "success" : "error"}
                        label={u.isActive ? "Đang hoạt động" : "Bị khóa"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={
                          isMe
                            ? "Không thể tự khóa tài khoản của chính mình"
                            : u.isActive
                              ? "Khóa tài khoản"
                              : "Mở khóa tài khoản"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color={u.isActive ? "error" : "success"}
                            disabled={isMe || busy}
                            onClick={() => setTarget(u)}
                          >
                            {u.isActive ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, value) => updateParams({ page: String(value) })}
          />
        </Box>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        message={
          target?.isActive
            ? `Khóa tài khoản "${target?.name}"? Người dùng sẽ không đăng nhập được nữa và phiên hiện tại bị thu hồi.`
            : `Mở khóa cho "${target?.name}"? Người dùng đăng nhập lại được ngay.`
        }
        confirmText={target?.isActive ? "Khóa" : "Mở khóa"}
        loading={busy}
        onCancel={() => setTarget(null)}
        onConfirm={handleToggle}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </Stack>
  );
}
