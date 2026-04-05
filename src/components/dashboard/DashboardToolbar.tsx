import { Pencil, CheckCheck, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardToolbarProps {
  isEditing: boolean;
  onToggleEdit: () => void;
  onAddWidget: () => void;
  isSaving: boolean;
}

export function DashboardToolbar({
  isEditing,
  onToggleEdit,
  onAddWidget,
  isSaving,
}: DashboardToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </span>
        )}
        {isEditing && !isSaving && (
          <span className="text-xs text-primary/70 font-medium">Editing layout</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditing && (
          <Button size="sm" variant="outline" onClick={onAddWidget}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Widget
          </Button>
        )}
        <Button
          size="sm"
          variant={isEditing ? "default" : "outline"}
          onClick={onToggleEdit}
        >
          {isEditing ? (
            <>
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Done
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit Layout
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
