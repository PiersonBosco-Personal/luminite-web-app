import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getSections } from "@/api/tasks";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Task, TaskSection } from "@/types/models";
import type { WidgetProps } from "../widgetRegistry";

type SectionWithTasks = TaskSection & { tasks: Task[] };
type Urgency = "overdue" | "today" | "soon" | "later";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const URGENCY_STYLES: Record<Urgency, string> = {
  overdue: "bg-red-500/15 border-red-500/30 text-red-400",
  today:   "bg-orange-500/15 border-orange-500/30 text-orange-400",
  soon:    "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
  later:   "bg-muted/60 border-border/50 text-muted-foreground",
};

const STATUS_DOT: Record<string, string> = {
  todo:        "bg-muted-foreground/40",
  in_progress: "bg-blue-400",
  done:        "bg-green-400",
  blocked:     "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  todo:        "To Do",
  in_progress: "In Progress",
  done:        "Done",
  blocked:     "Blocked",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high:   "High",
  medium: "Medium",
  low:    "Low",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: "Overdue",
  today:   "Due Today",
  soon:    "Due Soon",
  later:   "Upcoming",
};

// Parse YYYY-MM-DD as local time to avoid UTC off-by-one
function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getUrgency(dueDateKey: string): Urgency {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseLocal(dueDateKey);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0)  return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "soon";
  return "later";
}

function ScrollingTitle({ text, isDone }: { text: string; isDone: boolean }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef      = useRef<HTMLSpanElement>(null);
  const [offset, setOffset]     = useState(0);
  const [duration, setDuration] = useState(0);

  function handleEnter() {
    if (!containerRef.current || !textRef.current) return;
    const overflow = textRef.current.scrollWidth - containerRef.current.clientWidth;
    if (overflow > 0) {
      setDuration(overflow * 25); // 25ms per px — comfortable reading speed
      setOffset(overflow);
    }
  }

  function handleLeave() {
    setDuration(150);
    setOffset(0);
  }

  return (
    <span
      ref={containerRef}
      className="overflow-hidden flex-1 min-w-0 block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap leading-none ${isDone ? "line-through" : ""}`}
        style={{
          transform: `translateX(-${offset}px)`,
          transitionProperty: "transform",
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: "linear",
        }}
      >
        {text}
      </span>
    </span>
  );
}

export function DeadlineTrackerWidget({ widget: _widget, projectId, isEditing, setHeaderActions }: WidgetProps) {
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["sections", projectId],
    queryFn: () => getSections(projectId),
    select: (data) => data as SectionWithTasks[],
  });

  // Group tasks by YYYY-MM-DD, sorted by priority within each day
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    if (!sections) return map;

    for (const section of sections) {
      for (const task of section.tasks ?? []) {
        if (!task.due_date) continue;
        const key = task.due_date.slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }
    }

    for (const [key, tasks] of map) {
      map.set(key, [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]));
    }

    return map;
  }, [sections]);

  // Month nav in widget header
  useEffect(() => {
    if (isEditing) { setHeaderActions?.(null); return; }

    const label = new Date(year, month, 1).toLocaleString("default", { month: "long" });

    function prevMonth() {
      if (month === 0) { setMonth(11); setYear((y) => y - 1); }
      else setMonth((m) => m - 1);
    }
    function nextMonth() {
      if (month === 11) { setMonth(0); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    }

    setHeaderActions?.(
      <div className="flex items-center gap-0.5">
        <button
          onClick={prevMonth}
          className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-muted-foreground w-24 text-center select-none">
          {label} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, isEditing, year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow    = new Date(year, month, 1).getDay(); // 0 = Sunday

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const weeks = cells.length / 7;

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden text-[10px]">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-border/40 shrink-0">
        {DAYS.map((d) => (
          <div key={d} className="text-center py-1 text-muted-foreground/50 font-medium tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="grid grid-cols-7 flex-1 overflow-y-auto"
        style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={i}
                className={`border-b border-border/20 bg-muted/[0.03] ${i % 7 !== 6 ? "border-r" : ""}`}
              />
            );
          }

          const dateKey = toDateKey(year, month, day);
          const tasks   = tasksByDate.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;
          const urgency = tasks.length > 0 ? getUrgency(dateKey) : null;

          return (
            <div
              key={i}
              className={`border-b border-border/20 flex flex-col min-h-0 ${i % 7 !== 6 ? "border-r" : ""}`}
            >
              {/* Date number */}
              <span
                className={`leading-none px-1 pt-0.5 pb-0.5 shrink-0 font-medium ${
                  isToday
                    ? "text-primary font-bold"
                    : urgency === "overdue"
                    ? "text-red-400/70"
                    : "text-muted-foreground/50"
                }`}
              >
                {day}
              </span>

              {/* Task chips — scrollable when overflow */}
              <div className="flex flex-col gap-0.5 px-0.5 pb-0.5 overflow-y-auto min-h-0">
              {tasks.map((task) => {
                const u      = getUrgency(task.due_date!);
                const isDone = task.status === "done";
                return (
                  <Tooltip key={task.id} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => { setOpenTaskId(task.id); setModalOpen(true); }}
                        className={`rounded border px-1 py-0.5 flex items-center gap-0.5 min-w-0 shrink-0 w-full text-left cursor-pointer hover:brightness-110 transition-[filter] ${URGENCY_STYLES[u]} ${isDone ? "opacity-35" : ""}`}
                      >
                        {/* Status dot */}
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[task.status]}`} />

                        {/* Title — scrolls on hover to reveal full text */}
                        <ScrollingTitle text={task.title} isDone={isDone} />

                        {/* Assignee initial */}
                        {task.assignee && (
                          <span className="shrink-0 w-3 h-3 rounded-full bg-current/10 flex items-center justify-center font-bold uppercase leading-none" style={{ fontSize: 7 }}>
                            {task.assignee.name[0]}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>

                    <TooltipContent
                      side="top"
                      className="bg-card border border-border text-foreground p-0 overflow-hidden max-w-[220px]"
                    >
                      {/* Urgency accent strip */}
                      <div className={`h-0.5 w-full ${u === "overdue" ? "bg-red-500/60" : u === "today" ? "bg-orange-500/60" : u === "soon" ? "bg-yellow-500/60" : "bg-border"}`} />

                      <div className="px-3 py-2 flex flex-col gap-1.5">
                        {/* Full title */}
                        <p className={`text-xs font-medium text-foreground leading-snug ${isDone ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>

                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {/* Status */}
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
                            {STATUS_LABEL[task.status]}
                          </span>

                          {/* Priority */}
                          <span className={`text-[11px] px-1.5 py-0.5 rounded border ${URGENCY_STYLES[u]}`}>
                            {PRIORITY_LABEL[task.priority]}
                          </span>
                        </div>

                        {/* Urgency label */}
                        <span className={`text-[11px] font-medium ${u === "overdue" ? "text-red-400" : u === "today" ? "text-orange-400" : u === "soon" ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {URGENCY_LABEL[u]}
                        </span>

                        {/* Assignee */}
                        {task.assignee && (
                          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/50 pt-1.5 mt-0.5">
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold uppercase text-[9px]">
                              {task.assignee.name[0]}
                            </span>
                            {task.assignee.name}
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <TaskDetailModal
      taskId={openTaskId}
      projectId={projectId}
      open={modalOpen}
      onClose={() => { setModalOpen(false); setOpenTaskId(null); }}
      onTaskUpdated={() => queryClient.invalidateQueries({ queryKey: ["sections", projectId] })}
    />
    </>
  );
}
