import axios, { type InternalAxiosRequestConfig } from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// --- Request: tự gắn access token ---
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response: gặp 401 thì tự refresh token 1 lần rồi gọi lại request cũ ---
let isRefreshing = false;
let queue: ((token: string) => void)[] = [];

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    // Đang refresh rồi -> xếp hàng đợi, tránh gọi /auth/refresh nhiều lần cùng lúc
    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(axiosClient(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("Không có refresh token");

      // Gọi bằng axios gốc để không lặp vô hạn qua interceptor này
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const newAccess = data.data.accessToken;
      const newRefresh = data.data.refreshToken;

      localStorage.setItem("accessToken", newAccess);
      localStorage.setItem("refreshToken", newRefresh);

      queue.forEach((cb) => cb(newAccess));
      original.headers.Authorization = `Bearer ${newAccess}`;
      return axiosClient(original);
    } catch (e) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
      queue = [];
    }
  }
);

export default axiosClient;
