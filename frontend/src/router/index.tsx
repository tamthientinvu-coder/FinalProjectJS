import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import CourseListPage from "../pages/CourseListPage";
import CourseDetailPage from "../pages/CourseDetailPage";
import MyCoursesPage from "../pages/MyCoursesPage";
import LearnPage from "../pages/LearnPage";
import QuizPage from "../pages/QuizPage";
import QuizResultPage from "../pages/QuizResultPage";
import InstructorCoursesPage from "../pages/instructor/InstructorCoursesPage";
import CourseFormPage from "../pages/instructor/CourseFormPage";
import LessonEditorPage from "../pages/instructor/LessonEditorPage";
import QuizEditorPage from "../pages/instructor/QuizEditorPage";
import CourseStatsPage from "../pages/instructor/CourseStatsPage";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage";
import AdminCoursesPage from "../pages/admin/AdminCoursesPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ForbiddenPage from "../pages/ForbiddenPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";

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
          <ProtectedRoute>
            <MyCoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "learn/:courseId",
        element: (
          <ProtectedRoute>
            <LearnPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "quiz/:lessonId",
        element: (
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "quiz-result/:submissionId",
        element: (
          <ProtectedRoute>
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
