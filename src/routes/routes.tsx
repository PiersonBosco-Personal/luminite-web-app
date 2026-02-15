import { Routes, Route } from "react-router";
import { Suspense, lazy } from "react";
import CssSpinner from "../components/CssSpinner";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard"));

function AppRoutes() {
  return (
    <Suspense fallback={<CssSpinner />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
