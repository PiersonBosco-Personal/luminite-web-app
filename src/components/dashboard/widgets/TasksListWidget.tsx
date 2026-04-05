import type { WidgetProps } from "../widgetRegistry";

const priorities = [
  { color: "bg-red-400", label: "urgent" },
  { color: "bg-orange-400", label: "high" },
  { color: "bg-yellow-400", label: "medium" },
  { color: "bg-slate-500", label: "low" },
];

export function TasksListWidget(_props: WidgetProps) {
  return (
    <div className="flex flex-col divide-y divide-border/50 h-full overflow-auto">
      {priorities.map((p, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-colors">
          <div className="h-3.5 w-3.5 rounded border border-border/80 shrink-0" />
          <div className={`h-1.5 w-1.5 rounded-full ${p.color} shrink-0`} />
          <div className="h-2 rounded bg-muted/60 flex-1" />
          <div className="h-2 rounded bg-muted/40 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}
