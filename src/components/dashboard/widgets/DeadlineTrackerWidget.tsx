import type { WidgetProps } from "../widgetRegistry";

const items = [
  { urgency: "overdue", badge: "bg-red-500/15 text-red-400 border-red-500/20", label: "Overdue" },
  { urgency: "today", badge: "bg-orange-500/15 text-orange-400 border-orange-500/20", label: "Today" },
  { urgency: "soon", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20", label: "Soon" },
  { urgency: "later", badge: "bg-muted text-muted-foreground border-border/50", label: "Later" },
];

export function DeadlineTrackerWidget(_props: WidgetProps) {
  return (
    <div className="flex flex-col divide-y divide-border/50 h-full overflow-auto">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2">
          <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${item.badge}`}>
            {item.label}
          </div>
          <div className="h-2 rounded bg-muted/60 flex-1 min-w-0" />
        </div>
      ))}
    </div>
  );
}
