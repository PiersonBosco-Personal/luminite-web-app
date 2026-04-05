import { Routes, Route, Navigate } from "react-router";
import { Suspense, lazy } from "react";
import CssSpinner from "../components/CssSpinner";

const ProtectedRoute = lazy(() => import("../components/auth/ProtectedRoute"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const UserLayout = lazy(() => import("../components/layouts/UserLayout"));

const ProjectsPage = lazy(() => import("../pages/projects/ProjectsPage"));
const ProjectShell = lazy(() => import("../pages/projects/ProjectShell"));
const DashboardPage = lazy(() => import("../pages/projects/DashboardPage"));
const BoardPage = lazy(() => import("../pages/projects/BoardPage"));
const NotesPage = lazy(() => import("../pages/projects/NotesPage"));
const SettingsPage = lazy(() => import("../pages/projects/SettingsPage"));

function AppRoutes() {
  return (
    <Suspense fallback={<CssSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectShell />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="board" element={<BoardPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
