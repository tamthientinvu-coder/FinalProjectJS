import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi } from "../api/authApi";
import type { User, UserRole } from "../types/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error("AuthProvider chưa được bọc quanh cây component");
  },
  register: async () => undefined,
  logout: async () => undefined,
});

/**
 * Singleton promise: nhiều component cùng mount sẽ dùng chung 1 lần gọi /auth/me
 * thay vì mỗi component gọi một lần.
 */
let sessionPromise: Promise<User | null> | null = null;

function restoreSession(): Promise<User | null> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      if (!localStorage.getItem("accessToken")) return null;
      try {
        const res = await authApi.getMe();
        return res.data.data;
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return null;
      }
    })();
  }
  return sessionPromise;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { accessToken, refreshToken, user: userData } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setUser(userData);
    sessionPromise = Promise.resolve(userData);
    return userData;
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    await authApi.register({ name, email, password, role });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // BE lỗi thì phía client vẫn phải xóa token
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      sessionPromise = Promise.resolve(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
