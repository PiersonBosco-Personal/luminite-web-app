import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginData = { email: string; password: string };

type LoginFormProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onSubmit"
> & {
  onSubmit: (data: LoginData) => Promise<void> | void;
  loading?: boolean;
};

export function LoginForm({
  className,
  onSubmit,
  loading,
  ...props
}: LoginFormProps) {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    await onSubmit({ email, password });
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="border-t-primary/40 shadow-[0_8px_32px_rgba(46,187,204,0.07)]">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to your Luminite account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                />
              </div>
              <Button type="submit" className="w-full mt-1" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a href="#" className="text-primary hover:underline underline-offset-4 transition-colors">
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="text-balance text-center text-xs text-muted-foreground [&_a]:text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By signing in you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}
