import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckSquare } from "lucide-react";
import type { Task } from "@/types/models";

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const STATUS_DOT: Record<Task["status"], string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-400",
  done: "bg-emerald-400",
  blocked: "bg-red-400",
};

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, onOpen, isDragOverlay = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.due_date && task.status !== "done"
      ? new Date(task.due_date) < new Date()
      : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded border bg-card px-2.5 py-2 text-sm cursor-pointer select-none
        ${isDragging || isDragOverlay ? "opacity-50 border-primary/50 shadow-lg" : "border-border/60 hover:border-border"}
      `}
      onClick={() => onOpen(task)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing p-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      <div className="pl-3">
        {/* Status dot + title */}
        <div className="flex items-start gap-1.5">
          <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[task.status]}`} />
          <p className="leading-snug text-foreground/90 line-clamp-2">{task.title}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>

          {task.due_date && (
            <span className={`text-[10px] ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
              {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}

          {(task.subtasks_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <CheckSquare className="w-3 h-3" />
              {task.subtasks_count}
            </span>
          )}
        </div>

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.labels.map((label) => (
              <span
                key={label.id}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: label.color + "33", color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Subtask progress bar */}
        {(task.subtasks_count ?? 0) > 0 && (() => {
          const total = task.subtasks?.length ?? task.subtasks_count ?? 0;
          const done = task.subtasks?.filter((s) => s.status === "done").length ?? 0;
          const pct = total > 0 ? (done / total) * 100 : 0;
          return (
            <div className="mt-2 w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
