import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import theme from "./theme/theme";
import router from "./router";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

// Hai gói đo lường của Vercel chỉ có ý nghĩa ở production. Nạp động để bản dev
// không tải chúng: Console sạch và Vite bớt một bước prebundle.
const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights }))
);
const Analytics = lazy(() =>
  import("@vercel/analytics/react").then((m) => ({ default: m.Analytics }))
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Suspense fallback={<div className="route-loading">Đang tải trang...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
      {import.meta.env.PROD && (
        <Suspense fallback={null}>
          <SpeedInsights />
          <Analytics />
        </Suspense>
      )}
    </ThemeProvider>
  </React.StrictMode>
);
