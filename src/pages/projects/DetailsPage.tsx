import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Layers,
  GitBranch,
  Globe,
  Target,
  Cpu,
  Save,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  CornerDownRight,
} from "lucide-react";
import { getProject, updateProject } from "@/api/projects";
import {
  getTechStack,
  createTechStack,
  updateTechStack,
  deleteTechStack,
} from "@/api/techStack";
import type { TechStack } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";
import { useSnackbar } from "@/contexts/SnackbarContext";

// ── Shared ────────────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── SaveableTextarea ──────────────────────────────────────────────────────────

interface SaveableTextareaProps {
  value: string;
  placeholder: string;
  rows?: number;
  isPending: boolean;
  savedRecently: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
}

function SaveableTextarea({
  value,
  placeholder,
  rows = 5,
  isPending,
  savedRecently,
  onChange,
  onSave,
}: SaveableTextareaProps) {
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave();
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-lg border border-input bg-muted/20 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
      />
      <div className="flex items-center gap-2 justify-end">
        {savedRecently && (
          <span className="flex items-center gap-1 text-xs text-primary/80">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
        {isDirty && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="h-7 text-xs px-3"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── EnvField ──────────────────────────────────────────────────────────────────

function EnvField({
  icon: Icon,
  label,
  placeholder,
}: {
  icon: React.ElementType;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="text-xs font-medium text-muted-foreground/80">
          {label}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/40 font-medium tracking-wide uppercase">
          Not persisted
        </span>
      </div>
      <Input
        placeholder={placeholder}
        disabled
        className="h-8 text-xs bg-muted/20 border-border/40 text-muted-foreground/50 placeholder:text-muted-foreground/30 cursor-not-allowed"
      />
    </div>
  );
}

// ── TechStackSection ──────────────────────────────────────────────────────────

interface LocalSub {
  localId: string;
  serverId: number | null;
  name: string;
  version: string;
}

interface LocalEntry {
  localId: string;
  serverId: number | null;
  name: string;
  version: string;
  subs: LocalSub[];
}

function toLocalEntries(items: TechStack[]): LocalEntry[] {
  return items.map((item) => ({
    localId: String(item.id),
    serverId: item.id,
    name: item.name,
    version: item.version ?? "",
    subs: (item.children ?? []).map((child) => ({
      localId: String(child.id),
      serverId: child.id,
      name: child.name,
      version: child.version ?? "",
    })),
  }));
}

function uid() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

interface TechStackSectionProps {
  projectId: number;
}

function TechStackSection({ projectId }: TechStackSectionProps) {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const initialized = useRef(false);

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["tech-stack", projectId],
    queryFn: () => getTechStack(projectId),
  });

  // Seed local state once from server data
  useEffect(() => {
    if (serverData && !initialized.current) {
      setEntries(
        serverData.length > 0
          ? toLocalEntries(serverData)
          : [
              {
                localId: uid(),
                serverId: null,
                name: "",
                version: "",
                subs: [],
              },
            ],
      );
      initialized.current = true;
    }
  }, [serverData]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["tech-stack", projectId] });

  // ── Entry mutations ────────────────────────────────────────────────────────

  const createEntry = useMutation({
    mutationFn: (data: { name: string; version: string }) =>
      createTechStack(projectId, {
        name: data.name,
        version: data.version || null,
      }),
    onSuccess: (created, _, localId) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.localId === (localId as unknown as string)
            ? { ...e, serverId: created.id, localId: String(created.id) }
            : e,
        ),
      );
      invalidate();
    },
    onError: () => showSnackbar("Failed to save technology.", "error"),
  });

  const patchEntry = useMutation({
    mutationFn: (data: { serverId: number; name: string; version: string }) =>
      updateTechStack(projectId, data.serverId, {
        name: data.name,
        version: data.version || null,
      }),
    onError: () => showSnackbar("Failed to update technology.", "error"),
  });

  const removeEntry = useMutation({
    mutationFn: (serverId: number) => deleteTechStack(projectId, serverId),
    onSuccess: () => invalidate(),
    onError: () => showSnackbar("Failed to remove technology.", "error"),
  });

  // ── Sub mutations ──────────────────────────────────────────────────────────

  // const createSub = useMutation({
  //   mutationFn: (data: {
  //     name: string;
  //     version: string;
  //     parentServerId: number;
  //   }) =>
  //     createTechStack(projectId, {
  //       name: data.name,
  //       version: data.version || null,
  //       parent_id: data.parentServerId,
  //     }),
  //   onSuccess: (created, vars) => {
  //     setEntries((prev) =>
  //       prev.map((e) =>
  //         e.serverId === vars.parentServerId
  //           ? {
  //               ...e,
  //               subs: e.subs.map((s) =>
  //                 s.serverId === null && s.name === vars.name
  //                   ? {
  //                       ...s,
  //                       serverId: created.id,
  //                       localId: String(created.id),
  //                     }
  //                   : s,
  //               ),
  //             }
  //           : e,
  //       ),
  //     );
  //     invalidate();
  //   },
  //   onError: () => showSnackbar("Failed to save sub-technology.", "error"),
  // });

  const patchSub = useMutation({
    mutationFn: (data: { serverId: number; name: string; version: string }) =>
      updateTechStack(projectId, data.serverId, {
        name: data.name,
        version: data.version || null,
      }),
    onError: () => showSnackbar("Failed to update sub-technology.", "error"),
  });

  const removeSub = useMutation({
    mutationFn: (serverId: number) => deleteTechStack(projectId, serverId),
    onSuccess: () => invalidate(),
    onError: () => showSnackbar("Failed to remove sub-technology.", "error"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleEntryBlur = (entry: LocalEntry) => {
    if (!entry.name.trim()) return;
    if (entry.serverId === null) {
      createEntry.mutate({ name: entry.name, version: entry.version }, {
        onSuccess: undefined,
        context: entry.localId,
      } as never);
      // Pass localId as context via a workaround
      createTechStack(projectId, {
        name: entry.name,
        version: entry.version || null,
      }).then((created) => {
        setEntries((prev) =>
          prev.map((e) =>
            e.localId === entry.localId
              ? { ...e, serverId: created.id, localId: String(created.id) }
              : e,
          ),
        );
        invalidate();
      });
    } else {
      patchEntry.mutate({
        serverId: entry.serverId,
        name: entry.name,
        version: entry.version,
      });
    }
  };

  const handleSubBlur = (entry: LocalEntry, sub: LocalSub) => {
    if (!sub.name.trim() || entry.serverId === null) return;
    if (sub.serverId === null) {
      createTechStack(projectId, {
        name: sub.name,
        version: sub.version || null,
        parent_id: entry.serverId,
      }).then((created) => {
        setEntries((prev) =>
          prev.map((e) =>
            e.localId === entry.localId
              ? {
                  ...e,
                  subs: e.subs.map((s) =>
                    s.localId === sub.localId
                      ? {
                          ...s,
                          serverId: created.id,
                          localId: String(created.id),
                        }
                      : s,
                  ),
                }
              : e,
          ),
        );
        invalidate();
      });
    } else {
      patchSub.mutate({
        serverId: sub.serverId,
        name: sub.name,
        version: sub.version,
      });
    }
  };

  const handleDeleteEntry = (entry: LocalEntry) => {
    setEntries((prev) => prev.filter((e) => e.localId !== entry.localId));
    if (entry.serverId !== null) removeEntry.mutate(entry.serverId);
  };

  const handleDeleteSub = (entry: LocalEntry, sub: LocalSub) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.localId === entry.localId
          ? { ...e, subs: e.subs.filter((s) => s.localId !== sub.localId) }
          : e,
      ),
    );
    if (sub.serverId !== null) removeSub.mutate(sub.serverId);
  };

  const handleAddSub = (entryLocalId: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.localId === entryLocalId
          ? {
              ...e,
              subs: [
                ...e.subs,
                { localId: uid(), serverId: null, name: "", version: "" },
              ],
            }
          : e,
      ),
    );
  };

  const handleAddEntry = () => {
    setEntries((prev) => [
      ...prev,
      { localId: uid(), serverId: null, name: "", version: "", subs: [] },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => (
        <div key={entry.localId} className="flex flex-col">
          <div className="flex items-center gap-2 group/entry">
            <Input
              value={entry.name}
              onChange={(e) =>
                setEntries((prev) =>
                  prev.map((en) =>
                    en.localId === entry.localId
                      ? { ...en, name: e.target.value }
                      : en,
                  ),
                )
              }
              onBlur={() => handleEntryBlur(entry)}
              placeholder="Technology name"
              className="h-8 text-sm flex-1 bg-muted/20 border-border/60 focus:border-primary/50"
            />
            <Input
              value={entry.version}
              onChange={(e) =>
                setEntries((prev) =>
                  prev.map((en) =>
                    en.localId === entry.localId
                      ? { ...en, version: e.target.value }
                      : en,
                  ),
                )
              }
              onBlur={() => handleEntryBlur(entry)}
              placeholder="version"
              className="h-8 text-xs w-24 bg-muted/20 border-border/60 focus:border-primary/50 font-mono"
            />
            <button
              onClick={() => handleAddSub(entry.localId)}
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover/entry:opacity-100"
              title="Add sub-technology"
            >
              <CornerDownRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDeleteEntry(entry)}
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover/entry:opacity-100"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {entry.subs.length > 0 && (
            <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-border/40 pl-3">
              {entry.subs.map((sub) => (
                <div
                  key={sub.localId}
                  className="flex items-center gap-2 group/sub"
                >
                  <Input
                    value={sub.name}
                    onChange={(e) =>
                      setEntries((prev) =>
                        prev.map((en) =>
                          en.localId === entry.localId
                            ? {
                                ...en,
                                subs: en.subs.map((s) =>
                                  s.localId === sub.localId
                                    ? { ...s, name: e.target.value }
                                    : s,
                                ),
                              }
                            : en,
                        ),
                      )
                    }
                    onBlur={() => handleSubBlur(entry, sub)}
                    placeholder="Package / library name"
                    className="h-7 text-xs flex-1 bg-muted/10 border-border/40 focus:border-primary/40"
                  />
                  <Input
                    value={sub.version}
                    onChange={(e) =>
                      setEntries((prev) =>
                        prev.map((en) =>
                          en.localId === entry.localId
                            ? {
                                ...en,
                                subs: en.subs.map((s) =>
                                  s.localId === sub.localId
                                    ? { ...s, version: e.target.value }
                                    : s,
                                ),
                              }
                            : en,
                        ),
                      )
                    }
                    onBlur={() => handleSubBlur(entry, sub)}
                    placeholder="version"
                    className="h-7 text-xs w-24 bg-muted/10 border-border/40 focus:border-primary/40 font-mono"
                  />
                  <button
                    onClick={() => handleDeleteSub(entry, sub)}
                    className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover/sub:opacity-100"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleAddEntry}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors py-1 mt-2 w-fit"
      >
        <Plus className="h-3.5 w-3.5" />
        Add technology
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useProjectField(
  field: string,
  initialValue: string,
  projectId: number,
) {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const [value, setValue] = useState(initialValue);
  const [savedRecently, setSavedRecently] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const mutation = useMutation({
    mutationFn: (v: string) => updateProject(projectId, { [field]: v }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["project", projectId], updated);
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 2500);
    },
    onError: () => showSnackbar(`Failed to save ${field}.`, "error"),
  });

  return { value, setValue, savedRecently, mutation };
}

// ── DetailsPage ───────────────────────────────────────────────────────────────

export default function DetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId ?? "");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
    enabled: !!id,
  });

  const description = useProjectField(
    "description",
    project?.description ?? "",
    id,
  );
  const goals = useProjectField("goals", project?.goals ?? "", id);
  const architectureNotes = useProjectField(
    "architecture_notes",
    project?.architecture_notes ?? "",
    id,
  );

  // const members = project?.members ?? [];
  // const owner = project?.owner;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto px-6 py-4">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">
            {isLoading ? (
              <span className="inline-block w-40 h-5 rounded bg-muted/40 animate-pulse" />
            ) : (
              (project?.name ?? "Project Details")
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            Project brief — used as context for AI features
          </p>
        </div>

        {project && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
              project.status === "active"
                ? "bg-primary/10 text-primary"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                project.status === "active"
                  ? "bg-primary"
                  : "bg-muted-foreground"
              }`}
            />
            {project.status}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {/* Overview */}
        <section>
          <SectionHeader icon={FileText} label="Overview" />
          <SaveableTextarea
            value={description.value}
            onChange={description.setValue}
            onSave={() => description.mutation.mutate(description.value)}
            isPending={description.mutation.isPending}
            savedRecently={description.savedRecently}
            placeholder="Write a summary of this project — what it is, what problem it solves, who it's for, and any important context for AI tools..."
          />
        </section>

        <Separator />

        {/* Tech Stack */}
        <section>
          <SectionHeader icon={Layers} label="Tech Stack" />
          <TechStackSection projectId={id} />
        </section>

        <Separator />

        {/* Repository & Environments */}
        <section>
          <SectionHeader icon={GitBranch} label="Repository & Environments" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <EnvField
              icon={GitBranch}
              label="Repository URL"
              placeholder="https://github.com/org/repo"
            />
            <EnvField
              icon={Globe}
              label="Production URL"
              placeholder="https://app.example.com"
            />
            <EnvField
              icon={Globe}
              label="Staging URL"
              placeholder="https://staging.example.com"
            />
          </div>
        </section>

        <Separator />

        {/* Goals & Objectives */}
        <section>
          <SectionHeader icon={Target} label="Goals & Objectives" />
          <SaveableTextarea
            value={goals.value}
            onChange={goals.setValue}
            onSave={() => goals.mutation.mutate(goals.value)}
            isPending={goals.mutation.isPending}
            savedRecently={goals.savedRecently}
            placeholder="What are the goals of this project? Who are the target users? What does success look like?"
            rows={4}
          />
        </section>

        <Separator />

        {/* Architecture Notes */}
        <section>
          <SectionHeader icon={Cpu} label="Architecture Notes" />
          <SaveableTextarea
            value={architectureNotes.value}
            onChange={architectureNotes.setValue}
            onSave={() =>
              architectureNotes.mutation.mutate(architectureNotes.value)
            }
            isPending={architectureNotes.mutation.isPending}
            savedRecently={architectureNotes.savedRecently}
            placeholder="Key architectural decisions, patterns used, things an AI should know about how this project is structured..."
            rows={4}
          />
        </section>

        <Separator />
      </div>
    </div>
  );
}
