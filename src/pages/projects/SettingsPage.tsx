import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Users,
  Loader2,
  Save,
  CheckCircle2,
  Trash2,
  UserPlus,
  Mail,
} from "lucide-react";
import { getProject, updateProject, getMembers, addMember, removeMember } from "@/api/projects";
import type { MemberWithRole } from "@/api/projects";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();

  // ── Project data ──────────────────────────────────────────────────────────
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
  });

  const isOwner = !!user && !!project && project.owner.id === user.id;

  // ── Rename ────────────────────────────────────────────────────────────────
  const [nameInput, setNameInput] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (project) setNameInput(project.name);
  }, [project]);

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateProject(id, { name }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["project", id], updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    },
    onError: () => showSnackbar("Failed to rename project.", "error"),
  });

  // ── Members ───────────────────────────────────────────────────────────────
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["members", id],
    queryFn: () => getMembers(id),
  });

  const [removingMember, setRemovingMember] = useState<MemberWithRole | null>(null);

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setRemovingMember(null);
    },
    onError: () => {
      showSnackbar("Failed to remove member.", "error");
      setRemovingMember(null);
    },
  });

  // ── Add / Invite ──────────────────────────────────────────────────────────
  const [emailInput, setEmailInput] = useState("");
  const [addFeedback, setAddFeedback] = useState<{ type: "success" | "invite" | "error"; message: string } | null>(null);

  const addMutation = useMutation({
    mutationFn: (email: string) => addMember(id, email),
    onSuccess: (result) => {
      setEmailInput("");
      if (result.invited) {
        setAddFeedback({ type: "invite", message: `Invite sent to ${emailInput}. They'll receive an email with a link to join.` });
      } else {
        setAddFeedback({ type: "success", message: "Member added successfully." });
        queryClient.invalidateQueries({ queryKey: ["members", id] });
        queryClient.invalidateQueries({ queryKey: ["project", id] });
      }
      setTimeout(() => setAddFeedback(null), 5000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Failed to add member.";
      setAddFeedback({ type: "error", message: msg });
      setTimeout(() => setAddFeedback(null), 5000);
    },
  });

  const handleAdd = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    setAddFeedback(null);
    addMutation.mutate(trimmed);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ── General ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Settings} label="General" />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Project Name</label>
            <div className="flex gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nameInput.trim() && nameInput !== project?.name) {
                    renameMutation.mutate(nameInput.trim());
                  }
                }}
                className="flex-1"
                disabled={!isOwner}
              />
              <Button
                size="sm"
                disabled={!nameInput.trim() || nameInput === project?.name || renameMutation.isPending || !isOwner}
                onClick={() => renameMutation.mutate(nameInput.trim())}
              >
                {renameMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : nameSaved ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {nameSaved ? "Saved" : "Save"}
              </Button>
            </div>
            {!isOwner && (
              <p className="text-xs text-muted-foreground/60">Only the project owner can rename the project.</p>
            )}
          </div>
        </section>

        {/* ── Team Members ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Users} label="Team Members" />

          {membersLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="w-28 h-3 rounded bg-muted/40 animate-pulse" />
                    <div className="w-40 h-2.5 rounded bg-muted/30 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1 mb-5">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isCurrentUser={member.id === user?.id}
                  isOwner={isOwner}
                  onRequestRemove={() => setRemovingMember(member)}
                />
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground/50">No members found.</p>
              )}
            </div>
          )}

          {/* Add member form — owner only */}
          {isOwner && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Add or Invite Member
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="teammate@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                  disabled={addMutation.isPending}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!emailInput.trim() || addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Add / Invite
                </Button>
              </div>

              {addFeedback && (
                <p className={`text-xs px-1 ${
                  addFeedback.type === "error"
                    ? "text-destructive"
                    : addFeedback.type === "invite"
                    ? "text-primary"
                    : "text-green-400"
                }`}>
                  {addFeedback.message}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Remove member confirmation dialog */}
      <Dialog open={!!removingMember} onOpenChange={(open) => { if (!open) setRemovingMember(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">{removingMember?.name}</span> from this project?
              They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingMember(null)} disabled={removeMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removingMember && removeMutation.mutate(removingMember.id)}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── MemberRow ─────────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isCurrentUser,
  isOwner,
  onRequestRemove,
}: {
  member: MemberWithRole;
  isCurrentUser: boolean;
  isOwner: boolean;
  onRequestRemove: () => void;
}) {
  const role = member.pivot?.role === "owner" ? "Owner" : "Member";
  const canRemove = isOwner && role !== "Owner" && !isCurrentUser;

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors group">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium leading-tight truncate">
          {member.name}{isCurrentUser && <span className="text-muted-foreground/50 font-normal"> (you)</span>}
        </span>
        <span className="text-xs text-muted-foreground truncate">{member.email}</span>
      </div>

      <span className={`shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
        role === "Owner" ? "bg-primary/10 text-primary" : "bg-muted/40 text-muted-foreground"
      }`}>
        {role}
      </span>

      {/* Fixed-width right slot keeps all rows aligned */}
      <div className="shrink-0 w-8 flex items-center justify-end">
        {canRemove && (
          <button
            onClick={onRequestRemove}
            className="text-muted-foreground/40 hover:text-destructive transition-colors"
            aria-label="Remove member"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
