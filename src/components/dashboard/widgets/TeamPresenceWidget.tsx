import type { WidgetProps } from "../widgetRegistry";

const members = [
  { initials: "PB", online: true },
  { initials: "JD", online: true },
  { initials: "AS", online: false },
];

export function TeamPresenceWidget(_props: WidgetProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 h-full overflow-auto flex-wrap content-start">
      {members.map((m, i) => (
        <div key={i} className="relative">
          <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground">{m.initials}</span>
          </div>
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
              m.online ? "bg-emerald-400" : "bg-muted"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
