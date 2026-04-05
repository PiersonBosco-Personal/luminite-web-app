import type { WidgetProps } from "../widgetRegistry";

const categories = [
  { label: "Frontend", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { label: "Backend", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { label: "Other", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
];

export function TechStackWidget(_props: WidgetProps) {
  return (
    <div className="flex flex-col gap-3 px-3 pt-2 pb-3 h-full overflow-auto">
      {categories.map((cat) => (
        <div key={cat.label}>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
            {cat.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[28, 36, 24].map((w, i) => (
              <div
                key={i}
                className={`h-5 rounded-full border text-[10px] font-medium px-2 flex items-center ${cat.color}`}
                style={{ width: w + 8 + "px" }}
              >
                <div className="h-1.5 rounded bg-current/40 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
