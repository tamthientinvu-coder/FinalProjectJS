import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../config/apiUrl";
import { RefreshQueue } from "./refreshQueue";

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
const refreshQueue = new RefreshQueue();

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
      return refreshQueue.wait(async (token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosClient(original);
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

      refreshQueue.flush(newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return axiosClient(original);
    } catch (e) {
      refreshQueue.fail(e);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
