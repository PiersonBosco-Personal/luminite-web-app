import type { WidgetProps } from "../widgetRegistry";

export function NotesListWidget(_props: WidgetProps) {
  return (
    <div className="flex flex-col gap-2 px-3 pt-2 pb-3 h-full overflow-auto">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-md border border-border/60 bg-card/60 px-3 py-2.5 space-y-1.5 hover:border-border transition-colors cursor-default"
        >
          {i === 0 && (
            <div className="flex items-center justify-between mb-0.5">
              <div className="h-2 rounded bg-primary/30 w-24" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
            </div>
          )}
          <div className="h-2 rounded bg-muted/70 w-full" />
          <div className="h-1.5 rounded bg-muted/40 w-4/5" />
          <div className="h-1.5 rounded bg-muted/30 w-3/5" />
        </div>
      ))}
    </div>
  );
}
