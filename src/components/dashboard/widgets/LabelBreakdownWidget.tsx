import type { WidgetProps } from "../widgetRegistry";

const labels = [
  { color: "bg-blue-400", pct: 40, name: "feature" },
  { color: "bg-red-400", pct: 25, name: "bug" },
  { color: "bg-yellow-400", pct: 20, name: "chore" },
  { color: "bg-emerald-400", pct: 15, name: "docs" },
];

export function LabelBreakdownWidget(_props: WidgetProps) {
  return (
    <div className="flex flex-col gap-2.5 px-3 pt-2 pb-3 h-full overflow-auto">
      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {labels.map((l, i) => (
          <div key={i} className={`${l.color} h-full`} style={{ width: `${l.pct}%` }} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 mt-1">
        {labels.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-sm ${l.color} shrink-0`} />
            <span className="text-xs text-muted-foreground w-14 shrink-0">{l.name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className={`h-full rounded-full ${l.color} opacity-60`} style={{ width: `${l.pct}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0">{l.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
