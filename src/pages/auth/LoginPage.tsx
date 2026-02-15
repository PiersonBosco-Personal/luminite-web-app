import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/shad-components/login-form";

export default function LoginPage() {
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
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
