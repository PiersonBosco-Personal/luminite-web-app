import type { WidgetProps } from "../widgetRegistry";

export function ActivityFeedWidget(_props: WidgetProps) {
  return (
    <div className="flex flex-col gap-0 px-3 pt-2 pb-3 h-full overflow-auto">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 relative">
          {/* Timeline line */}
          {i < 3 && (
            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border/50" />
          )}
          <div className="h-3.5 w-3.5 rounded-full border-2 border-primary/40 bg-card shrink-0 mt-1 relative z-10" />
          <div className="pb-4 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-2 rounded bg-muted/70 w-20" />
              <div className="h-1.5 rounded bg-muted/40 w-12 ml-auto" />
            </div>
            <div className="h-1.5 rounded bg-muted/40 w-3/4 mt-1.5" />
          </div>
        </div>
      ))}
    </div>
  );
}
