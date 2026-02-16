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
    <>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <img
            src="/logo.png"
            alt="Luminite Logo"
            className="w-48 h-48 mx-auto animate-fade-in drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]"
          />
          {/* DO WE WANT THIS TITLE? */}
          {/* <h1
            className="text-7xl font-bold text-center text-slate-100 
               drop-shadow-[0_0_12px_rgba(34,211,238,0.25)] 
               animate-fade-in tracking-wide"
          >
            Luminite
          </h1> */}
          <div className="drop-shadow-[0_0_12px_rgba(34,211,238,0.2)]">
            <LoginForm onSubmit={handleLogin} loading={loading} />
          </div>
        </div>
      </div>
    </>
  );
}
