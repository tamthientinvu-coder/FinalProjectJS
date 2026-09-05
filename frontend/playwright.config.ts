import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Luoi an toan: kiem thu trinh duyet phu thuoc thoi diem, mot vai ca co the
  // truot vi khe thoi gian duoi mot khung hinh. Chay lai tren CI de khong lam
  // do duong ong vi ly do khong phai chat luong ma nguon.
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/login",
    reuseExistingServer: !process.env.CI,
  },
});
