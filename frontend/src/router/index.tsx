import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

const HomePage = lazy(() => import("../pages/HomePage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const CourseListPage = lazy(() => import("../pages/CourseListPage"));
const CourseDetailPage = lazy(() => import("../pages/CourseDetailPage"));
const MyCoursesPage = lazy(() => import("../pages/MyCoursesPage"));
const LearnPage = lazy(() => import("../pages/LearnPage"));
const QuizPage = lazy(() => import("../pages/QuizPage"));
const QuizResultPage = lazy(() => import("../pages/QuizResultPage"));
const InstructorCoursesPage = lazy(() => import("../pages/instructor/InstructorCoursesPage"));
const CourseFormPage = lazy(() => import("../pages/instructor/CourseFormPage"));
const LessonEditorPage = lazy(() => import("../pages/instructor/LessonEditorPage"));
const QuizEditorPage = lazy(() => import("../pages/instructor/QuizEditorPage"));
const CourseStatsPage = lazy(() => import("../pages/instructor/CourseStatsPage"));
const AdminCategoriesPage = lazy(() => import("../pages/admin/AdminCategoriesPage"));
const AdminCoursesPage = lazy(() => import("../pages/admin/AdminCoursesPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const ForbiddenPage = lazy(() => import("../pages/ForbiddenPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // --- Công khai ---
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "courses", element: <CourseListPage /> },
      { path: "courses/:id", element: <CourseDetailPage /> },

      // --- Cần đăng nhập ---
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },

      // --- Học viên ---
      {
        path: "my-courses",
        element: (
          <ProtectedRoute roles={["student"]}>
            <MyCoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "learn/:courseId",
        element: (
          <ProtectedRoute roles={["student"]}>
            <LearnPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "quiz/:lessonId",
        element: (
          <ProtectedRoute roles={["student"]}>
            <QuizPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "quiz-result/:submissionId",
        element: (
          <ProtectedRoute roles={["student"]}>
            <QuizResultPage />
          </ProtectedRoute>
        ),
      },

      // --- Giảng viên ---
      {
        path: "instructor/courses",
        element: (
          <ProtectedRoute roles={["instructor", "admin"]}>
            <InstructorCoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "instructor/courses/new",
        element: (
          <ProtectedRoute roles={["instructor", "admin"]}>
            <CourseFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "instructor/courses/:id/edit",
        element: (
          <ProtectedRoute roles={["instructor", "admin"]}>
            <CourseFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "instructor/courses/:id/lessons",
        element: (
          <ProtectedRoute roles={["instructor", "admin"]}>
            <LessonEditorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "instructor/lessons/:id/quiz",
        element: (
          <ProtectedRoute roles={["instructor", "admin"]}>
            <QuizEditorPage />
          </ProtectedRoute>
        ),
      },

      // Thống kê khóa học - chủ sở hữu hoặc admin (service kiểm tra tiếp)
      {
        path: "courses/:id/stats",
        element: (
          <ProtectedRoute roles={["instructor", "admin"]}>
            <CourseStatsPage />
          </ProtectedRoute>
        ),
      },

      // --- Quản trị ---
      {
        path: "admin",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/courses",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminCoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminCategoriesPage />
          </ProtectedRoute>
        ),
      },


      { path: "403", element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
