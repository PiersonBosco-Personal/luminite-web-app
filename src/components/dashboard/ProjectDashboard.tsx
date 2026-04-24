import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GridLayout, useContainerWidth } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Loader2, LayoutGrid } from "lucide-react";
import {
  getDashboardWidgets,
  syncLayout,
  removeDashboardWidget,
} from "@/api/dashboard";
import { getProject } from "@/api/projects";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { Button } from "@/components/ui/button";
import { WidgetShell } from "./WidgetShell";
import { DashboardToolbar } from "./DashboardToolbar";
import { WidgetPicker } from "./WidgetPicker";

interface ProjectDashboardProps {
  projectId: number;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const { showSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { width, containerRef } = useContainerWidth();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const {
    data: widgets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboard-widgets", projectId],
    queryFn: () => getDashboardWidgets(projectId),
  });

  const syncMutation = useMutation({
    mutationFn: (layout: Layout) => syncLayout(projectId, layout),
    onError: () => showSnackbar("Failed to save layout.", "error"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeDashboardWidget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-widgets", projectId],
      });
      showSnackbar("Widget removed.", "success");
    },
    onError: () => showSnackbar("Failed to remove widget.", "error"),
  });

  const layout: Layout =
    widgets?.map((w) => ({
      i: String(w.id),
      x: w.grid_x,
      y: w.grid_y,
      w: w.grid_w,
      h: w.grid_h,
      minW: w.widget.min_w,
      minH: w.widget.min_h,
    })) ?? [];

  const onLayoutChange = (newLayout: Layout) => {
    if (!isEditing || !widgets?.length) return;
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncMutation.mutate(newLayout);
    }, 800);
  };

  const isEmpty = !widgets || widgets.length === 0;

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full p-4">
      <DashboardToolbar
        projectId={projectId}
        projectName={project?.name}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((v) => !v)}
        onAddWidget={() => setPickerOpen(true)}
        isSaving={syncMutation.isPending}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground text-sm">
            Failed to load dashboard.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center flex-1 py-24 text-center">
          <LayoutGrid className="h-14 w-14 text-muted-foreground/20 mb-4" />
          <h2 className="text-base font-semibold">Your dashboard is empty</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Add widgets to build a custom view of this project.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              setIsEditing(true);
              setPickerOpen(true);
            }}
          >
            Add your first widget
          </Button>
        </div>
      ) : (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{
            cols: 12,
            rowHeight: 80,
            margin: [12, 12],
            containerPadding: [0, 0],
          }}
          dragConfig={{
            enabled: isEditing,
            handle: ".widget-drag-handle",
          }}
          resizeConfig={{ enabled: isEditing, handles: ["se", "sw", "nw"] }}
          onLayoutChange={onLayoutChange}
        >
          {widgets.map((widget) => (
            <div key={String(widget.id)}>
              <WidgetShell
                widget={widget}
                projectId={projectId}
                isEditing={isEditing}
                onRemove={() => removeMutation.mutate(widget.id)}
              />
            </div>
          ))}
        </GridLayout>
      )}

      <WidgetPicker
        projectId={projectId}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      />
    </div>
  );
}
