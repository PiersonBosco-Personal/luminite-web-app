import { LoginForm } from "@/components/shad-components/login-form";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login with:", data);
      await login(data);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
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
        {error && (
          <div className="text-red-400 text-sm text-center bg-red-500/10 px-3 py-2.5 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}
        <LoginForm onSubmit={handleLogin} loading={loading} />
      </div>
    </div>
  );
}
