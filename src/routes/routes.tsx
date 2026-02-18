import { Routes, Route } from "react-router";
import { Suspense, lazy } from "react";
import CssSpinner from "../components/CssSpinner";

const ProtectedRoute = lazy(() => import("../components/auth/ProtectedRoute"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard"));

const UserLayout = lazy(() => import("../components/layouts/UserLayout"));

function AppRoutes() {
  return (
    <Suspense fallback={<CssSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
