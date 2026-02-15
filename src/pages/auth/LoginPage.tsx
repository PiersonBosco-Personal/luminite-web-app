import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <>
      <img
        src="/logo.png"
        alt="Luminite Logo"
        className="w-48 h-48 mx-auto mt-10 animate-fade-in"
      />
      <h1
        className="text-5xl font-bold text-center mt-4 text-slate-100 
               drop-shadow-[0_0_12px_rgba(34,211,238,0.25)] 
               animate-fade-in tracking-wide"
      >
        Luminite
      </h1>
      <Card className="w-full max-w-md mx-auto mt-10 p-8">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Login</h1>
        </CardContent>
      </Card>
    </>
  );
}
