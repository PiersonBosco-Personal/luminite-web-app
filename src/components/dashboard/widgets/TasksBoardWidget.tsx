import type { WidgetProps } from "../widgetRegistry";

const columns = [
  { label: "To Do", color: "text-slate-400", border: "border-slate-500/30" },
  { label: "In Progress", color: "text-blue-400", border: "border-blue-500/30" },
  { label: "Done", color: "text-emerald-400", border: "border-emerald-500/30" },
];

export function TasksBoardWidget(_props: WidgetProps) {
  return (
    <div className="flex gap-2 h-full overflow-x-auto px-3 pt-2 pb-3">
      {columns.map((col) => (
        <div
          key={col.label}
          className={`flex flex-col gap-1.5 min-w-[120px] flex-1 rounded-md border ${col.border} bg-background/30 px-2 py-2`}
        >
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${col.color} mb-1`}>
            {col.label}
          </p>
          <div className="rounded border border-border/50 bg-card/60 px-2 py-1.5 space-y-1">
            <div className="h-2 rounded bg-muted/60 w-full" />
            <div className="h-1.5 rounded bg-muted/40 w-3/5" />
          </div>
          <div className="rounded border border-border/50 bg-card/60 px-2 py-1.5 space-y-1">
            <div className="h-2 rounded bg-muted/60 w-4/5" />
            <div className="h-1.5 rounded bg-muted/40 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
