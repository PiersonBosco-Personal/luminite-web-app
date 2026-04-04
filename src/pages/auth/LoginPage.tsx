import { LoginForm } from "@/components/shad-components/login-form";
import { useAuth } from "../../contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleLogin = async (data: { email: string; password: string }) => {
    setLoading(true);

    try {
      await login(data);
      window.location.href = "/projects";
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Login failed. Please check your credentials.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/projects");
    }
  }, [user]);

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative overflow-hidden">
      {/* Ambient cyan glow behind the form */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(46,187,204,0.07)_0%,transparent_100%)] pointer-events-none" />
      <div className="relative flex w-full max-w-sm flex-col gap-5">
        <img
          src="/logo.png"
          alt="Luminite Logo"
          className="w-36 h-36 mx-auto drop-shadow-[0_0_24px_rgba(46,187,204,0.4)]"
        />
        <LoginForm onSubmit={handleLogin} loading={loading} />
      </div>
    </div>
  );
}
