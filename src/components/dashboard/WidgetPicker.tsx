import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { getAvailableWidgets, addDashboardWidget } from "@/api/dashboard";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { slugIconMap } from "./widgetIcons";
import type { Widget } from "@/types/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface WidgetPickerProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<string, string> = {
  productivity: "Productivity",
  analytics: "Analytics",
  team: "Team",
  ai: "AI",
};

const categoryOrder = ["productivity", "analytics", "team", "ai"];

export function WidgetPicker({ projectId, open, onOpenChange }: WidgetPickerProps) {
  const { showSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: widgets, isLoading } = useQuery({
    queryKey: ["available-widgets"],
    queryFn: getAvailableWidgets,
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: (widgetId: number) => addDashboardWidget(projectId, widgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets", projectId] });
      showSnackbar("Widget added.", "success");
    },
    onError: () => showSnackbar("Failed to add widget.", "error"),
  });

  const grouped = widgets?.reduce<Record<string, Widget[]>>((acc, w) => {
    if (!acc[w.category]) acc[w.category] = [];
    acc[w.category].push(w);
    return acc;
  }, {}) ?? {};

  const orderedCategories = categoryOrder.filter((c) => grouped[c]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80 flex flex-col">
        <SheetHeader>
          <SheetTitle>Add Widget</SheetTitle>
          <SheetDescription>Browse and add widgets to your dashboard.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : orderedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No widgets available yet.
            </p>
          ) : (
            orderedCategories.map((category) => (
              <div key={category}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {categoryLabels[category] ?? category}
                </p>
                <div className="space-y-1.5">
                  {grouped[category].map((widget) => {
                    const Icon = slugIconMap[widget.slug];
                    return (
                      <div
                        key={widget.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card hover:bg-accent/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {Icon && <Icon className="h-3.5 w-3.5 text-primary shrink-0" />}
                            <span className="text-sm font-medium truncate">{widget.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {widget.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => addMutation.mutate(widget.id)}
                          disabled={addMutation.isPending}
                          aria-label={`Add ${widget.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
