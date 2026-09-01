import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import theme from "./theme/theme";
import router from "./router";
import { AuthProvider } from "./context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Suspense fallback={<div className="route-loading">Đang tải trang...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
      <SpeedInsights />
      <Analytics />
    </ThemeProvider>
  </React.StrictMode>
);
