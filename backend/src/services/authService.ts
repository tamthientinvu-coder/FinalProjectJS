import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { AppError, AccessTokenPayload, UserRole } from "../types/api";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

/** Không bao giờ trả password / refreshToken ra ngoài. */
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  isActive: true,
  createdAt: true,
};

function issueTokens(payload: AccessTokenPayload) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}) {
  const existed = await prisma.user.findUnique({ where: { email: input.email } });
  if (existed) {
    throw new AppError(409, "Email này đã được đăng ký");
  }

  const hashed = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      role: (input.role ?? "student") as UserRole,
    },
    select: publicUserSelect,
  });

  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Thông báo chung cho cả 2 trường hợp -> không để lộ email nào có tồn tại
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, "Email hoặc mật khẩu không đúng");
  }
  if (!user.isActive) {
    throw new AppError(403, "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên");
  }

  const tokens = issueTokens({ id: user.id, email: user.email, role: user.role as UserRole });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  const { password: _pw, refreshToken: _rt, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

export async function refresh(token: string) {
  let payload: AccessTokenPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, "Refresh token không hợp lệ hoặc đã hết hạn");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  // Token phải khớp bản đang lưu trong DB -> logout ở 1 nơi là vô hiệu hóa được token cũ
  if (!user || user.refreshToken !== token) {
    throw new AppError(401, "Refresh token đã bị thu hồi");
  }
  if (!user.isActive) {
    throw new AppError(403, "Tài khoản đã bị khóa");
  }

  const tokens = issueTokens({ id: user.id, email: user.email, role: user.role as UserRole });
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  return tokens;
}

export async function logout(userId: number) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw new AppError(404, "Không tìm thấy người dùng");
  return user;
}
