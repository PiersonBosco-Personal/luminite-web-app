import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Pencil, Trash2, Check, X, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "./TaskCard";
import type { Task, TaskSection } from "@/types/models";

interface TaskColumnProps {
  section: TaskSection & { tasks: Task[] };
  projectId: number;
  isEditing: boolean;
  isDraggingSection: boolean;
  isDropTarget: boolean;
  onTaskOpen: (task: Task) => void;
  onSectionRename: (id: number, name: string) => void;
  onSectionDelete: (id: number) => void;
  onTaskCreate: (sectionId: number, title: string) => void;
}

export function TaskColumn({
  section,
  isEditing,
  isDraggingSection,
  isDropTarget,
  onTaskOpen,
  onSectionRename,
  onSectionDelete,
  onTaskCreate,
}: TaskColumnProps) {
  const tasks = section.tasks ?? [];

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(section.name);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);

  // Section-level sortable (for reordering columns)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSectionDragging,
  } = useSortable({
    id: `section-${section.id}`,
    data: { type: "section", sectionId: section.id },
  });

  const sectionStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Task drop target
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `column-${section.id}`,
    data: { type: "column", sectionId: section.id },
  });

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  useEffect(() => {
    if (addingTask) addRef.current?.focus();
  }, [addingTask]);

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== section.name) {
      onSectionRename(section.id, trimmed);
    } else {
      setRenameValue(section.name);
    }
    setRenaming(false);
  }

  function commitAddTask() {
    const trimmed = newTaskTitle.trim();
    if (trimmed) {
      onTaskCreate(section.id, trimmed);
    }
    setNewTaskTitle("");
    setAddingTask(false);
  }

  return (
    <>
      <div
        ref={setSortableRef}
        style={sectionStyle}
        className={`group/col flex flex-col min-w-45 flex-1 h-full transition-all duration-150
          ${isSectionDragging ? "opacity-40 scale-[0.98]" : ""}
          ${isDropTarget ? "ring-2 ring-primary/60 ring-inset rounded-md" : ""}
        `}
      >
        {/* Column header */}
        <div className="flex items-center gap-1 mb-2 px-0.5">
          {/* Section drag handle */}
          {!isEditing && (
            <div
              {...attributes}
              {...listeners}
              className="opacity-0 group-hover/col:opacity-40 hover:opacity-100! cursor-grab active:cursor-grabbing text-muted-foreground shrink-0"
              title="Drag to reorder section"
            >
              <GripHorizontal className="w-3 h-3" />
            </div>
          )}

          {renaming ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                ref={renameRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") {
                    setRenameValue(section.name);
                    setRenaming(false);
                  }
                }}
                className="h-6 text-xs px-1.5 py-0"
              />
              <button
                onClick={commitRename}
                className="text-emerald-400 hover:text-emerald-300"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setRenameValue(section.name);
                  setRenaming(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex-1 truncate">
                {section.name}
              </p>
              {/* <span className="text-[10px] text-muted-foreground/60">{tasks.length}</span> */}
              {!isEditing && (
                <>
                  <button
                    onClick={() => {
                      setRenameValue(section.name);
                      setRenaming(true);
                    }}
                    className="opacity-0 group-hover/col:opacity-100 text-muted-foreground hover:text-foreground"
                    title="Rename section"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="opacity-0 group-hover/col:opacity-100 text-muted-foreground hover:text-red-400"
                    title="Delete section"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Tasks list — scrollable */}
        <div
          ref={setDropRef}
          className={`flex flex-col gap-1.5 flex-1 overflow-y-auto rounded-md border px-1.5 py-1.5 min-h-15 transition-colors
            ${!isDraggingSection && isOver ? "border-primary/50 bg-primary/5" : "border-border/30 bg-background/20"}
          `}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onTaskOpen} />
            ))}
          </SortableContext>

          {tasks.length === 0 && !addingTask && (
            <p className="text-[10px] text-muted-foreground/40 text-center py-2 select-none">
              No tasks
            </p>
          )}
        </div>

        {/* Add task — outside scroll area, always visible */}
        {!isEditing && (
          <div className="mt-1.5 shrink-0">
            {addingTask ? (
              <div className="flex flex-col gap-1">
                <Input
                  ref={addRef}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitAddTask();
                    if (e.key === "Escape") {
                      setNewTaskTitle("");
                      setAddingTask(false);
                    }
                  }}
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-6 text-xs flex-1"
                    onClick={commitAddTask}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => {
                      setNewTaskTitle("");
                      setAddingTask(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingTask(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground w-full px-1 py-1 rounded hover:bg-muted/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add task
              </button>
            )}
          </div>
        )}
      </div>

      {confirmDelete &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setConfirmDelete(false)}
            />
            <div className="relative z-10 rounded-xl border border-border bg-card shadow-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="font-semibold text-foreground mb-1">
                Delete section?
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                This will permanently delete{" "}
                <span className="font-medium text-foreground">
                  "{section.name}"
                </span>{" "}
                and all its tasks.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onSectionDelete(section.id);
                    setConfirmDelete(false);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
