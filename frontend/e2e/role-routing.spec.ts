import { expect, test } from "@playwright/test";

const api = "http://localhost:3000/api/v1";

async function mockLogin(page: import("@playwright/test").Page, role: "student" | "instructor") {
  const user = {
    id: role === "student" ? 4 : 2,
    name: "Người dùng E2E",
    email: role + "@test.vn",
    role,
  };
  await page.route(api + "/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          accessToken: "e2e-access",
          refreshToken: "e2e-refresh",
          user,
        },
      }),
    });
  });
  await page.route(api + "/auth/me", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: user }) })
  );
  await page.goto("/login");
  await page.getByLabel("Email").fill(role + "@test.vn");
  await page.getByLabel("Mật khẩu").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("khách bị chuyển về đăng nhập khi mở route bảo vệ", async ({ page }) => {
  await page.goto("/my-courses");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
});

test("học viên đăng nhập và vào được khóa học của tôi", async ({ page }) => {
  await page.route(api + "/enrollments/me", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) })
  );
  await mockLogin(page, "student");
  await page.goto("/my-courses");
  await expect(page.getByRole("heading", { name: "Khóa học của tôi" })).toBeVisible();
});

test("giảng viên không thể mở route chỉ dành cho học viên", async ({ page }) => {
  await mockLogin(page, "instructor");
  await page.goto("/my-courses");
  await expect(page).toHaveURL(/\/403$/);
});
