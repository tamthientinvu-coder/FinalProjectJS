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

test("sai mật khẩu giữ lỗi tại form và không gọi refresh", async ({ page }) => {
  let refreshCalls = 0;
  await page.route(api + "/auth/refresh", (route) => {
    refreshCalls += 1;
    return route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
  });
  await page.route(api + "/auth/login", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ success: false, message: "Email hoặc mật khẩu không đúng" }),
    })
  );
  await page.goto("/login");
  await page.getByLabel("Email").fill("student@test.vn");
  await page.getByLabel("Mật khẩu").fill("wrong-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Email hoặc mật khẩu không đúng");
  await expect(page.getByLabel("Email")).toHaveValue("student@test.vn");
  expect(refreshCalls).toBe(0);
});

test("Back khôi phục từ khóa trong ô tìm kiếm", async ({ page }) => {
  await page.route(api + "/categories", (route) =>
    route.fulfill({ json: { data: [] } })
  );
  await page.route(api + "/courses?**", (route) =>
    route.fulfill({ json: { data: [], meta: { total: 0, totalPages: 1 } } })
  );
  await page.goto("/courses");
  const search = page.getByLabel("Tìm theo tên khóa học");
  await search.fill("JavaScript");
  await search.press("Enter");
  await expect(page).toHaveURL(/search=JavaScript/);
  await search.fill("React");
  await search.press("Enter");
  await expect(page).toHaveURL(/search=React/);
  await page.goBack();
  await expect(search).toHaveValue("JavaScript");
});

test("phản hồi bài A đến muộn không ghi đè bài B", async ({ page }) => {
  let releaseA!: () => void;
  let startedA!: () => void;
  const heldA = new Promise<void>((resolve) => { releaseA = resolve; });
  const requestedA = new Promise<void>((resolve) => { startedA = resolve; });
  const lesson = (id: number) => ({
    id, courseId: 10, courseTitle: "Khóa QA", title: id === 101 ? "Bài A" : "Bài B",
    content: id === 101 ? "Nội dung riêng A" : "Nội dung riêng B", order: id === 101 ? 1 : 2,
    videoUrl: null, isCompleted: false, completedAt: null,
  });
  await page.route(api + "/ai/status", (route) =>
    route.fulfill({ json: { data: { configured: false } } })
  );
  await page.route(api + "/courses/10/learn", (route) =>
    route.fulfill({ json: { data: {
      course: { id: 10, title: "Khóa QA" }, canManage: false, isEnrolled: true,
      lessons: [101, 102].map((id, i) => ({
        id, title: i === 0 ? "Bài A" : "Bài B", order: i + 1,
        isUnlocked: true, isCompleted: false, hasQuiz: false,
      })),
      progress: { completed: 0, total: 2, percent: 0 },
    } } })
  );
  await page.route(api + "/lessons/101", async (route) => {
    startedA();
    await heldA;
    await route.fulfill({ json: { data: lesson(101) } });
  });
  await page.route(api + "/lessons/102", (route) =>
    route.fulfill({ json: { data: lesson(102) } })
  );
  await mockLogin(page, "student");
  await page.goto("/learn/10?lesson=101");
  await requestedA;
  await page.getByRole("button", { name: "2. Bài B" }).click();
  await expect(page.getByText("Nội dung riêng B", { exact: true })).toBeVisible();
  const receivedA = page.waitForResponse(api + "/lessons/101");
  releaseA();
  await receivedA;
  // Một thao tác UI tiếp theo phải tiếp tục dùng B sau khi response A đã xử lý.
  await expect(page.getByText("Nội dung riêng A", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Bài B", exact: true })).toBeVisible();
});
