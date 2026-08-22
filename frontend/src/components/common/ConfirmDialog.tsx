import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Hộp thoại xác nhận dùng chung - thay cho window.confirm của trình duyệt. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Xác nhận",
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Hủy
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? "Đang xử lý..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
