import { useState, type ReactNode } from "react";
import { GripVertical, X } from "lucide-react";
import type { DashboardWidget } from "@/types/models";
import { widgetRegistry } from "./widgetRegistry";
import { slugIconMap } from "./widgetIcons";

interface WidgetShellProps {
  widget: DashboardWidget;
  projectId: number;
  isEditing: boolean;
  onRemove: () => void;
}

export function WidgetShell({ widget, projectId, isEditing, onRemove }: WidgetShellProps) {
  const WidgetComponent = widgetRegistry[widget.widget.slug];
  const Icon = slugIconMap[widget.widget.slug];
  const [headerActions, setHeaderActions] = useState<ReactNode>(null);

  return (
    <div className="h-full flex flex-col rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div
        className={`widget-drag-handle flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30 shrink-0 ${
          isEditing ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isEditing && (
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 -ml-0.5" />
          )}
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="text-xs font-medium truncate">{widget.widget.name}</span>
        </div>

        <div className="flex items-center gap-1 ml-2 shrink-0">
          {!isEditing && headerActions}
          {isEditing && (
            <button
              onClick={onRemove}
              className="text-muted-foreground/50 hover:text-destructive transition-colors"
              aria-label="Remove widget"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {WidgetComponent ? (
          <WidgetComponent widget={widget} projectId={projectId} isEditing={isEditing} setHeaderActions={setHeaderActions} />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Unknown widget: {widget.widget.slug}
          </div>
        )}
      </div>
    </div>
  );
}
