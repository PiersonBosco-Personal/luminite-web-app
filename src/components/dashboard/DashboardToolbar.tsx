import { Pencil, CheckCheck, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PresenceAvatars } from "@/components/PresenceAvatars";

interface DashboardToolbarProps {
  projectId: number;
  projectName?: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAddWidget: () => void;
  isSaving: boolean;
}

export function DashboardToolbar({
  projectId,
  projectName,
  isEditing,
  onToggleEdit,
  onAddWidget,
  isSaving,
}: DashboardToolbarProps) {
  return (
    <div className="flex items-center mb-4 gap-4">
      {/* Left — title */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0">
        <h1 className="text-lg font-semibold tracking-tight truncate">
          {projectName ?? "…"} Dashboard
        </h1>
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </span>
        )}
        {isEditing && !isSaving && (
          <span className="text-xs text-primary/70 font-medium shrink-0">Editing layout</span>
        )}
      </div>

      {/* Center — presence */}
      <PresenceAvatars projectId={projectId} />

      {/* Right — actions */}
      <div className="flex items-center gap-2 shrink-0">
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
