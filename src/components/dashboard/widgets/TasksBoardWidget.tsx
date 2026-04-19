import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Loader2 } from "lucide-react";
import { TaskColumn } from "@/components/tasks/TaskColumn";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createTask,
  reorderTasks,
} from "@/api/tasks";
import type { Task, TaskSection } from "@/types/models";
import type { WidgetProps } from "../widgetRegistry";

type SectionWithTasks = TaskSection & { tasks: Task[] };

export function TasksBoardWidget({ widget: _widget, projectId, isEditing, setHeaderActions }: WidgetProps) {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeSection, setActiveSection] = useState<SectionWithTasks | null>(null);
  const [overSectionId, setOverSectionId] = useState<number | null>(null);
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const [localSections, setLocalSections] = useState<SectionWithTasks[] | null>(null);

  useEffect(() => {
    if (!setHeaderActions || isEditing) {
      setHeaderActions?.(null);
      return;
    }
    setHeaderActions(
      addingSection ? (
        <button
          onClick={() => { setNewSectionName(""); setAddingSection(false); }}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground px-1.5 py-0.5 rounded hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
      ) : (
        <button
          onClick={() => setAddingSection(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground px-1.5 py-0.5 rounded hover:bg-muted/50 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Section
        </button>
      )
    );
    return () => setHeaderActions?.(null);
  }, [setHeaderActions, isEditing, addingSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: fetchedSections, isLoading } = useQuery({
    queryKey: ["sections", projectId],
    queryFn: () => getSections(projectId),
    select: (data) => data as SectionWithTasks[],
  });

  useEffect(() => {
    if (fetchedSections && !activeTask && !activeSection) {
      setLocalSections(fetchedSections);
    }
  }, [fetchedSections]); // eslint-disable-line react-hooks/exhaustive-deps

  const sections = localSections ?? fetchedSections ?? [];

  const createSectionMutation = useMutation({
    mutationFn: (name: string) => createSection(projectId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections", projectId] }),
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateSection(projectId, id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections", projectId] }),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: number) => deleteSection(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections", projectId] }),
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (payload: { id: number; position: number }[]) =>
      reorderSections(projectId, payload),
    onError: () => queryClient.invalidateQueries({ queryKey: ["sections", projectId] }),
  });

  const createTaskMutation = useMutation({
    mutationFn: ({ sectionId, title }: { sectionId: number; title: string }) =>
      createTask(projectId, {
        section_id: sectionId,
        title,
        status: "todo",
        priority: "medium",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections", projectId] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (tasks: { id: number; section_id: number; position: number }[]) =>
      reorderTasks(projectId, tasks),
    onError: () => queryClient.invalidateQueries({ queryKey: ["sections", projectId] }),
  });

  // ── DnD handlers ────────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "task") setActiveTask(data.task);
    if (data?.type === "section") {
      const sec = sections.find((s) => s.id === data.sectionId);
      if (sec) setActiveSection(sec);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !localSections) return;

    const activeData = active.data.current;

    // Track hover target for section drag indicator
    if (activeData?.type === "section") {
      const overData = over.data.current;
      let targetId: number | null = null;
      if (overData?.type === "section") targetId = overData.sectionId;
      else if (overData?.type === "column") targetId = overData.sectionId;
      else if (overData?.type === "task") targetId = (overData.task as Task).section_id;
      setOverSectionId(targetId !== activeData.sectionId ? targetId : null);
      return;
    }

    if (activeData?.type !== "task") return;

    const activeTaskItem: Task = activeData.task;
    const overData = over.data.current;

    let targetSectionId: number | null = null;

    if (overData?.type === "column") {
      targetSectionId = overData.sectionId;
    } else if (overData?.type === "task") {
      targetSectionId = (overData.task as Task).section_id;
    }

    if (!targetSectionId || activeTaskItem.section_id === targetSectionId) return;

    setLocalSections((prev) => {
      if (!prev) return prev;
      return prev.map((sec) => {
        if (sec.id === activeTaskItem.section_id) {
          return { ...sec, tasks: sec.tasks.filter((t) => t.id !== activeTaskItem.id) };
        }
        if (sec.id === targetSectionId) {
          const updatedTask = { ...activeTaskItem, section_id: targetSectionId! };
          return { ...sec, tasks: [...sec.tasks, updatedTask] };
        }
        return sec;
      });
    });

    setActiveTask((prev) => (prev ? { ...prev, section_id: targetSectionId! } : prev));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setActiveSection(null);
    setOverSectionId(null);

    if (!over || !localSections) return;

    const activeData = active.data.current;

    // ── Section reorder ──────────────────────────────────────────────────────
    if (activeData?.type === "section") {
      const activeSectionId = activeData.sectionId as number;
      const overData = over.data.current;

      // Resolve which section we're dropping onto regardless of what element
      // closestCenter matched (could be a task card, column droppable, or section)
      let overSectionId: number | null = null;
      if (overData?.type === "section") {
        overSectionId = overData.sectionId;
      } else if (overData?.type === "column") {
        overSectionId = overData.sectionId;
      } else if (overData?.type === "task") {
        overSectionId = (overData.task as Task).section_id;
      }

      if (!overSectionId || activeSectionId === overSectionId) return;

      const oldIdx = localSections.findIndex((s) => s.id === activeSectionId);
      const newIdx = localSections.findIndex((s) => s.id === overSectionId);
      if (oldIdx === -1 || newIdx === -1) return;

      const newSections = arrayMove(localSections, oldIdx, newIdx);
      setLocalSections(newSections);
      reorderSectionsMutation.mutate(
        newSections.map((s, idx) => ({ id: s.id, position: idx }))
      );
      return;
    }

    // ── Task reorder ─────────────────────────────────────────────────────────
    if (activeData?.type !== "task") return;

    const activeTaskItem: Task = activeData.task;
    const overData = over.data.current;

    let targetSectionId: number = activeTaskItem.section_id;
    let overTaskId: number | null = null;

    if (overData?.type === "column") {
      targetSectionId = overData.sectionId;
    } else if (overData?.type === "task") {
      const overTask = overData.task as Task;
      targetSectionId = overTask.section_id;
      overTaskId = overTask.id;
    }

    const targetSection = localSections.find((s) => s.id === targetSectionId);
    if (!targetSection) return;

    let newTasks = [...targetSection.tasks];

    if (activeTaskItem.section_id === targetSectionId && overTaskId) {
      const oldIdx = newTasks.findIndex((t) => t.id === activeTaskItem.id);
      const newIdx = newTasks.findIndex((t) => t.id === overTaskId);
      if (oldIdx !== -1 && newIdx !== -1) {
        newTasks = arrayMove(newTasks, oldIdx, newIdx);
      }
    }

    const updatedSection = { ...targetSection, tasks: newTasks };
    const newLocalSections = localSections.map((s) =>
      s.id === targetSectionId ? updatedSection : s
    );
    setLocalSections(newLocalSections);

    const reorderPayload: { id: number; section_id: number; position: number }[] = [];
    newLocalSections.forEach((sec) => {
      sec.tasks.forEach((t, idx) => {
        reorderPayload.push({ id: t.id, section_id: sec.id, position: idx });
      });
    });

    reorderMutation.mutate(reorderPayload);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function handleAddSection() {
    const trimmed = newSectionName.trim();
    if (trimmed) {
      createSectionMutation.mutate(trimmed);
    }
    setNewSectionName("");
    setAddingSection(false);
  }

  function handleTaskOpen(task: Task) {
    setOpenTaskId(task.id);
    setModalOpen(true);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => `section-${s.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="h-full overflow-x-auto">
            <div className="flex gap-2 h-full min-w-full px-3 pt-2 pb-3 group">
              {sections.map((section) => (
                <TaskColumn
                  key={section.id}
                  section={section}
                  projectId={projectId}
                  isEditing={isEditing}
                  isDraggingSection={activeSection !== null}
                  isDropTarget={overSectionId === section.id}
                  onTaskOpen={handleTaskOpen}
                  onSectionRename={(id, name) => updateSectionMutation.mutate({ id, name })}
                  onSectionDelete={(id) => deleteSectionMutation.mutate(id)}
                  onTaskCreate={(sectionId, title) =>
                    createTaskMutation.mutate({ sectionId, title })
                  }
                />
              ))}

              {/* New section inline input — shown when addingSection is true */}
              {addingSection && !isEditing && (
                <div className="shrink-0 self-start pt-5 w-40">
                  <div className="flex flex-col gap-1">
                    <input
                      autoFocus
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="Section name..."
                      className="text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSection();
                        if (e.key === "Escape") {
                          setNewSectionName("");
                          setAddingSection(false);
                        }
                      }}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleAddSection}
                        className="text-xs bg-primary text-primary-foreground rounded px-2 py-1 flex-1"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setNewSectionName(""); setAddingSection(false); }}
                        className="text-xs text-muted-foreground hover:text-foreground rounded px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {sections.length === 0 && !addingSection && !isEditing && (
                <div className="flex items-center justify-center w-full text-xs text-muted-foreground/50">
                  No sections yet — add one to get started
                </div>
              )}
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask && (
            <TaskCard task={activeTask} onOpen={() => {}} isDragOverlay />
          )}
          {activeSection && (
            <div className="rounded border border-primary/50 bg-card px-3 py-1.5 shadow-lg opacity-80 min-w-[180px]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {activeSection.name}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        taskId={openTaskId}
        projectId={projectId}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setOpenTaskId(null);
        }}
        onTaskUpdated={() =>
          queryClient.invalidateQueries({ queryKey: ["sections", projectId] })
        }
      />
    </>
  );
}
