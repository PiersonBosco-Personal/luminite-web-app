import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, Paperclip, Check, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTask, updateTask, createTask, deleteTask } from "@/api/tasks";
import { getProject } from "@/api/projects";
import type { Task, TaskStatus, TaskPriority } from "@/types/models";

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "todo", label: "To Do", color: "text-slate-400" },
  { value: "in_progress", label: "In Progress", color: "text-blue-400" },
  { value: "done", label: "Done", color: "text-emerald-400" },
  { value: "blocked", label: "Blocked", color: "text-red-400" },
];

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  color: string;
}[] = [
  { value: "urgent", label: "Urgent", color: "text-red-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "low", label: "Low", color: "text-slate-400" },
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

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescValue(task.description ?? "");
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
                <select
                  value={task.status}
                  onChange={(e) =>
                    updateMutation.mutate({
                      status: e.target.value as TaskStatus,
                    })
                  }
                  className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                {/* Priority */}
                <select
                  value={task.priority}
                  onChange={(e) =>
                    updateMutation.mutate({
                      priority: e.target.value as TaskPriority,
                    })
                  }
                  className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground cursor-pointer"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>

                {/* Due date */}
                <input
                  type="date"
                  value={task.due_date ?? ""}
                  onChange={(e) =>
                    updateMutation.mutate({ due_date: e.target.value || null })
                  }
                  className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground cursor-pointer"
                />

                {/* Assignee */}
                <div className="flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={task.assignee?.id ?? ""}
                    onChange={(e) =>
                      updateMutation.mutate({
                        assigned_to: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 group"
                    >
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
                      <button
                        onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
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
