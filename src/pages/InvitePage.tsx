import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { getInvitation, acceptInvitation } from "@/api/invitations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [validationError, setValidationError] = useState("");

  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitation(token!),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptInvitation(token!, {
        name: name.trim(),
        password,
        password_confirmation: passwordConfirmation,
      }),
    onSuccess: (result) => {
      localStorage.setItem("auth_token", result.token);
      navigate(`/projects/${result.project_id}`);
    },
    onError: (err: any) => {
      setValidationError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!name.trim()) return setValidationError("Name is required.");
    if (password.length < 8) return setValidationError("Password must be at least 8 characters.");
    if (password !== passwordConfirmation) return setValidationError("Passwords do not match.");

    acceptMutation.mutate();
  };

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(46,187,204,0.07)_0%,transparent_100%)] pointer-events-none" />

      <div className="relative flex w-full max-w-sm flex-col gap-5">
        <img
          src="/logo.png"
          alt="Luminite Logo"
          className="w-24 h-24 mx-auto drop-shadow-[0_0_24px_rgba(46,187,204,0.4)]"
        />

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-5 flex flex-col items-center gap-2 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm font-medium">Invalid or expired invite</p>
            <p className="text-xs text-muted-foreground">
              This invite link is no longer valid. Ask the project owner to send a new one.
            </p>
          </div>
        )}

        {invite && (
          <div className="flex flex-col gap-5">
            {/* Invite context */}
            <div className="bg-card border border-border rounded-lg px-4 py-4 text-center flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{invite.inviter_name}</span> invited you to join
              </p>
              <p className="text-lg font-semibold">{invite.project_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Joining as <span className="text-foreground">{invite.email}</span>
              </p>
            </div>

            {/* Registration form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={invite.email} disabled className="opacity-60" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Your Name</label>
                <Input
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
              </div>

              {validationError && (
                <p className="text-xs text-destructive px-1">{validationError}</p>
              )}

              <Button type="submit" disabled={acceptMutation.isPending} className="w-full">
                {acceptMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                ) : (
                  "Accept Invitation & Join"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
