import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Plus,
  Trash2,
  Paperclip,
  Check,
  Tag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePicker } from "@/components/ui/date-picker";
import { getTask, updateTask, createTask, deleteTask } from "@/api/tasks";
import { getProject } from "@/api/projects";
import {
  getLabels,
  attachLabelToTask,
  detachLabelFromTask,
} from "@/api/labels";
import type { Task, TaskStatus, TaskPriority } from "@/types/models";

const STATUS_OPTIONS: {
  value: TaskStatus;
  label: string;
  color: string;
  dot: string;
}[] = [
  {
    value: "todo",
    label: "To Do",
    color: "text-slate-400",
    dot: "bg-slate-400",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "text-blue-400",
    dot: "bg-blue-400",
  },
  {
    value: "done",
    label: "Done",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    value: "blocked",
    label: "Blocked",
    color: "text-red-400",
    dot: "bg-red-400",
  },
];

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: "urgent", label: "Urgent", color: "text-red-400", bg: "#f87171" },
  { value: "high", label: "High", color: "text-orange-400", bg: "#fb923c" },
  { value: "medium", label: "Medium", color: "text-yellow-400", bg: "#facc15" },
  { value: "low", label: "Low", color: "text-slate-400", bg: "#94a3b8" },
];

interface TaskDetailModalProps {
  taskId: number | null;
  projectId: number;
  open: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export function TaskDetailModal({
  taskId,
  projectId,
  open,
  onClose,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const queryClient = useQueryClient();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<number>>(new Set());
  const [subtaskDescValues, setSubtaskDescValues] = useState<Record<number, string>>({});
  const [subtaskAssigneeOverrides, setSubtaskAssigneeOverrides] = useState<Record<number, number | null>>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const subtaskRef = useRef<HTMLInputElement>(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(projectId, taskId!),
    enabled: open && taskId !== null,
  });

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: open,
  });

  const members = project?.members ?? [];

  const { data: allLabels = [] } = useQuery({
    queryKey: ["labels", projectId],
    queryFn: () => getLabels(projectId),
    enabled: open,
  });

  const taskLabelIds = new Set((task?.labels ?? []).map((l) => l.id));

  function toggleLabel(labelId: number) {
    if (!taskId) return;
    if (taskLabelIds.has(labelId)) {
      detachLabelFromTask(projectId, labelId, taskId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["task", taskId] });
        onTaskUpdated();
      });
    } else {
      attachLabelToTask(projectId, labelId, taskId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["task", taskId] });
        onTaskUpdated();
      });
    }
  }

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescValue(task.description ?? "");
      const overrides: Record<number, number | null> = {};
      for (const s of task.subtasks ?? []) {
        overrides[s.id] = s.assignee?.id ?? null;
      }
      setSubtaskAssigneeOverrides(overrides);
    }
  }, [task]);

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateTask>[2]) =>
      updateTask(projectId, taskId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      onTaskUpdated();
    },
    onError: (err) => console.error("mutation failed:", err),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(projectId, taskId!),
    onSuccess: () => {
      onTaskUpdated();
      onClose();
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) =>
      createTask(projectId, {
        section_id: task!.section_id,
        parent_task_id: taskId!,
        title,
        status: "todo",
        priority: "medium",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      onTaskUpdated();
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: number) => deleteTask(projectId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      onTaskUpdated();
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, data }: { subtaskId: number; data: Parameters<typeof updateTask>[2] }) =>
      updateTask(projectId, subtaskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      onTaskUpdated();
    },
  });

  function toggleSubtaskExpanded(subtaskId: number, currentDesc: string | null) {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev);
      if (next.has(subtaskId)) {
        next.delete(subtaskId);
      } else {
        next.add(subtaskId);
        setSubtaskDescValues((d) => ({ ...d, [subtaskId]: d[subtaskId] ?? (currentDesc ?? "") }));
      }
      return next;
    });
  }

  function commitSubtaskDesc(subtaskId: number, originalDesc: string | null) {
    const val = subtaskDescValues[subtaskId] ?? "";
    if (val !== (originalDesc ?? "")) {
      updateSubtaskMutation.mutate({ subtaskId, data: { description: val || null } });
    }
  }

  const toggleSubtask = (subtask: Task) =>
    updateTask(projectId, subtask.id, {
      status: subtask.status === "done" ? "todo" : "done",
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      onTaskUpdated();
    });

  function commitTitle() {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task?.title) {
      updateMutation.mutate({ title: trimmed });
    }
    setEditingTitle(false);
  }

  function commitDesc() {
    if (descValue !== (task?.description ?? "")) {
      updateMutation.mutate({ description: descValue || null });
    }
  }

  function addSubtask() {
    const trimmed = newSubtask.trim();
    if (trimmed) {
      createSubtaskMutation.mutate(trimmed);
      setNewSubtask("");
    }
  }

  if (!open) return null;

  const subtasks = task?.subtasks ?? [];

  const doneCount = subtasks.filter((s) => s.status === "done").length;
  const subtaskPct =
    subtasks.length > 0 ? (doneCount / subtasks.length) * 100 : 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-[95vw] h-[95vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") {
                  setTitleValue(task?.title ?? "");
                  setEditingTitle(false);
                }
              }}
              className="flex-1 text-lg font-semibold bg-transparent border-b border-primary outline-none text-foreground"
            />
          ) : (
            <h2
              className="flex-1 text-lg font-semibold text-foreground cursor-text hover:text-foreground/80 truncate"
              onClick={() => setEditingTitle(true)}
              title="Click to edit title"
            >
              {isLoading ? "Loading..." : (task?.title ?? "")}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-3 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 pb-5 space-y-5">
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 rounded bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : task ? (
            <>
              {/* Meta row */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Status */}
                {(() => {
                  const current = STATUS_OPTIONS.find(
                    (s) => s.value === task.status,
                  )!;
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border/60 hover:bg-muted hover:border-border transition-colors text-xs font-medium text-foreground">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`}
                          />
                          {current.label}
                          <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="min-w-[140px]"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <DropdownMenuItem
                            key={s.value}
                            onSelect={() =>
                              updateMutation.mutate({ status: s.value })
                            }
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`}
                            />
                            <span
                              className={
                                s.value === task.status ? "font-medium" : ""
                              }
                            >
                              {s.label}
                            </span>
                            {s.value === task.status && (
                              <Check className="w-3 h-3 ml-auto" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })()}

                {/* Priority */}
                {(() => {
                  const current = PRIORITY_OPTIONS.find(
                    (p) => p.value === task.priority,
                  )!;
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors text-xs font-medium"
                          style={{
                            backgroundColor: current.bg + "22",
                            borderColor: current.bg + "55",
                            color: current.bg,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: current.bg }}
                          />
                          {current.label}
                          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="min-w-[130px]"
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <DropdownMenuItem
                            key={p.value}
                            onSelect={() =>
                              updateMutation.mutate({ priority: p.value })
                            }
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: p.bg }}
                            />
                            <span
                              style={{ color: p.bg }}
                              className={
                                p.value === task.priority ? "font-medium" : ""
                              }
                            >
                              {p.label}
                            </span>
                            {p.value === task.priority && (
                              <Check className="w-3 h-3 ml-auto" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })()}

                {/* Due date */}
                <DatePicker
                  value={task.due_date ?? null}
                  onChange={(val) => updateMutation.mutate({ due_date: val })}
                />

                {/* Assignee */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border/60 hover:bg-muted hover:border-border transition-colors text-xs font-medium text-foreground">
                      {task.assignee ? (
                        <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-muted border border-border/60 flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                          —
                        </span>
                      )}
                      <span>{task.assignee?.name ?? "Unassigned"}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[160px]">
                    <DropdownMenuItem
                      onSelect={() =>
                        updateMutation.mutate({ assigned_to: null })
                      }
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded-full bg-muted border border-border/60 flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                        —
                      </span>
                      <span className="text-muted-foreground">Unassigned</span>
                      {!task.assignee && <Check className="w-3 h-3 ml-auto" />}
                    </DropdownMenuItem>
                    {members.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onSelect={() =>
                          updateMutation.mutate({ assigned_to: m.id })
                        }
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{m.name}</span>
                        {task.assignee?.id === m.id && (
                          <Check className="w-3 h-3 ml-auto" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Labels */}
              {allLabels.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {allLabels.map((label) => {
                    const active = taskLabelIds.has(label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className="text-xs px-2 py-0.5 rounded-full border transition-all"
                        style={
                          active
                            ? {
                                backgroundColor: label.color + "33",
                                borderColor: label.color,
                                color: label.color,
                              }
                            : {
                                backgroundColor: "transparent",
                                borderColor: "hsl(var(--border))",
                                color: "hsl(var(--muted-foreground))",
                              }
                        }
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Separator */}
              <div className="border-t border-border/50" />

              {/* Description */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Description
                </p>
                <textarea
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  onBlur={commitDesc}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full text-sm bg-muted/40 border border-border/50 rounded px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Separator */}
              <div className="border-t border-border/50" />

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Subtasks
                    {subtasks.length > 0 && (
                      <span className="ml-1.5 text-muted-foreground/60">
                        {doneCount} of {subtasks.length} complete
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => subtaskRef.current?.focus()}
                    className="text-muted-foreground hover:text-foreground"
                    title="Add subtask"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar */}
                {subtasks.length > 0 && (
                  <div className="mb-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all duration-300"
                      style={{ width: `${subtaskPct}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  {subtasks.map((subtask) => {
                    const isExpanded = expandedSubtasks.has(subtask.id);
                    return (
                      <div key={subtask.id} className="rounded-md border border-transparent hover:border-border/40 transition-colors">
                        <div className="flex items-center gap-2 group px-1 py-0.5">
                          <button
                            onClick={() => toggleSubtask(subtask)}
                            className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors
                              ${
                                subtask.status === "done"
                                  ? "bg-emerald-500/30 border-emerald-500/50"
                                  : "border-border hover:border-primary/50"
                              }`}
                          >
                            {subtask.status === "done" && (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            )}
                          </button>
                          <span
                            className={`flex-1 text-sm ${subtask.status === "done" ? "line-through text-muted-foreground/50" : "text-foreground/90"}`}
                          >
                            {subtask.title}
                          </span>
                              {(() => {
                            const aid = subtask.id in subtaskAssigneeOverrides
                              ? subtaskAssigneeOverrides[subtask.id]
                              : (subtask.assignee?.id ?? null);
                            const m = aid != null ? members.find((x) => x.id === aid) : null;
                            return m ? (
                              <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                                {m.name.charAt(0).toUpperCase()}
                              </span>
                            ) : null;
                          })()}
                          <button
                            onClick={() => toggleSubtaskExpanded(subtask.id, subtask.description)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                            title="Edit details"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="px-7 pb-2 pt-1 space-y-2">
                            <textarea
                              value={subtaskDescValues[subtask.id] ?? (subtask.description ?? "")}
                              onChange={(e) =>
                                setSubtaskDescValues((d) => ({ ...d, [subtask.id]: e.target.value }))
                              }
                              onBlur={() => commitSubtaskDesc(subtask.id, subtask.description)}
                              placeholder="Add a description..."
                              rows={2}
                              className="w-full text-xs bg-muted/40 border border-border/50 rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 resize-none outline-none focus:border-primary/50 transition-colors"
                            />
                            {(() => {
                              const assigneeId = subtask.id in subtaskAssigneeOverrides
                                ? subtaskAssigneeOverrides[subtask.id]
                                : (subtask.assignee?.id ?? null);
                              const resolvedAssignee = assigneeId != null
                                ? members.find((m) => m.id === assigneeId) ?? null
                                : null;
                              return (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border/60 hover:bg-muted hover:border-border transition-colors text-xs font-medium text-foreground">
                                      {resolvedAssignee ? (
                                        <span className="w-4 h-4 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[9px] font-semibold text-primary shrink-0">
                                          {resolvedAssignee.name.charAt(0).toUpperCase()}
                                        </span>
                                      ) : (
                                        <span className="w-4 h-4 rounded-full bg-muted border border-border/60 flex items-center justify-center text-[9px] text-muted-foreground shrink-0">
                                          —
                                        </span>
                                      )}
                                      <span>{resolvedAssignee?.name ?? "Unassigned"}</span>
                                      <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="min-w-[160px]">
                                    <DropdownMenuItem
                                      onSelect={() => {
                                        setSubtaskAssigneeOverrides((o) => ({ ...o, [subtask.id]: null }));
                                        updateSubtaskMutation.mutate({ subtaskId: subtask.id, data: { assigned_to: null } });
                                      }}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <span className="w-5 h-5 rounded-full bg-muted border border-border/60 flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                                        —
                                      </span>
                                      <span className="text-muted-foreground">Unassigned</span>
                                      {!resolvedAssignee && <Check className="w-3 h-3 ml-auto" />}
                                    </DropdownMenuItem>
                                    {members.map((m) => (
                                      <DropdownMenuItem
                                        key={m.id}
                                        onSelect={() => {
                                          setSubtaskAssigneeOverrides((o) => ({ ...o, [subtask.id]: m.id }));
                                          updateSubtaskMutation.mutate({ subtaskId: subtask.id, data: { assigned_to: m.id } });
                                        }}
                                        className="flex items-center gap-2 cursor-pointer"
                                      >
                                        <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                                          {m.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span>{m.name}</span>
                                        {resolvedAssignee?.id === m.id && (
                                          <Check className="w-3 h-3 ml-auto" />
                                        )}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add subtask input */}
                <div className="flex gap-2 mt-2">
                  <Input
                    ref={subtaskRef}
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add a subtask..."
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSubtask();
                      if (e.key === "Escape") setNewSubtask("");
                    }}
                  />
                  {newSubtask.trim() && (
                    <Button
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={addSubtask}
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border/50" />

              {/* Attachments — placeholder */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Attachments
                  </p>
                </div>
                <div className="rounded border border-dashed border-border/50 py-4 text-center text-xs text-muted-foreground/50">
                  File upload coming soon
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border/50" />

              {/* Footer actions */}
              <div className="flex justify-between items-center pb-1">
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Delete task
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
