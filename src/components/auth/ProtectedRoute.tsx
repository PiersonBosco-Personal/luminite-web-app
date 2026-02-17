import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; // login page
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
