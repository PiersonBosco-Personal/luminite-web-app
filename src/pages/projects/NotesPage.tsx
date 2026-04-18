import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader2,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  getFolders,
  getNotes,
  togglePin,
  updateFolder,
  updateNote,
} from "@/api/notes";
import type { Note, NoteFolder } from "@/types/models";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { EditorToolbar } from "@/components/notes/EditorToolbar";
import { useNoteEditor } from "@/hooks/useNoteEditor";

// ── Note item ─────────────────────────────────────────────────────────────────

function NoteItem({
  note,
  selected,
  onSelect,
  isDragging,
}: {
  note: Note;
  selected: boolean;
  onSelect: () => void;
  isDragging?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1 rounded text-left text-sm truncate transition-colors",
        "hover:bg-accent/20",
        selected && !isDragging && "bg-accent/30 text-foreground",
        isDragging && "cursor-grabbing"
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate flex-1">{note.title || "Untitled"}</span>
      {note.is_pinned && (
        <Pin className="h-3 w-3 shrink-0 text-primary opacity-60" />
      )}
    </button>
  );
}

// ── Sortable note item ────────────────────────────────────────────────────────

function SortableNoteItem({
  note,
  selected,
  onSelect,
}: {
  note: Note;
  selected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-40" : undefined}
      {...attributes}
      {...listeners}
    >
      <NoteItem note={note} selected={selected} onSelect={onSelect} />
    </div>
  );
}

// ── Folder row ────────────────────────────────────────────────────────────────

function FolderRow({
  folder,
  notes,
  selectedId,
  onSelect,
  projectId,
}: {
  folder: NoteFolder;
  notes: Note[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  projectId: number;
}) {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const renameRef = useRef<HTMLInputElement>(null);

  // Droppable on the folder header row
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateFolder(projectId, folder.id, { name }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["note-folders", projectId] }),
    onError: () => showSnackbar("Failed to rename folder", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFolder(projectId, folder.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-folders", projectId] });
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
    },
    onError: () => showSnackbar("Failed to delete folder", "error"),
  });

  const newNoteMutation = useMutation({
    mutationFn: () =>
      createNote(projectId, { title: "Untitled", folder_id: folder.id }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      onSelect(note.id);
      setOpen(true);
    },
    onError: () => showSnackbar("Failed to create note", "error"),
  });

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) renameMutation.mutate(trimmed);
    else setRenameValue(folder.name);
    setRenaming(false);
  }

  useEffect(() => {
    if (renaming) renameRef.current?.select();
  }, [renaming]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* Folder header — this is the drop target */}
      <div
        ref={setDropRef}
        className={cn(
          "flex items-center gap-0.5 group/folder px-1 py-0.5 rounded transition-colors",
          isOver ? "bg-accent/30" : "hover:bg-muted/30"
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90"
              )}
            />
            {open ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            )}
            {renaming ? (
              <input
                ref={renameRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") {
                    setRenameValue(folder.name);
                    setRenaming(false);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-primary"
              />
            ) : (
              <span
                className="flex-1 min-w-0 truncate text-sm font-medium"
                onDoubleClick={() => setRenaming(true)}
              >
                {folder.name}
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        <div className="flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => newNoteMutation.mutate()}
            title="New note in folder"
            className="p-0.5 rounded hover:bg-accent/30 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete folder "${folder.name}"? Notes will be moved to root.`))
                deleteMutation.mutate();
            }}
            title="Delete folder"
            className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <CollapsibleContent>
        <SortableContext
          id={`folder-${folder.id}`}
          items={notes.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="ml-5 mt-0.5 flex flex-col gap-0.5">
            {notes.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1 italic">
                Empty folder
              </p>
            )}
            {notes.map((note) => (
              <SortableNoteItem
                key={note.id}
                note={note}
                selected={selectedId === note.id}
                onSelect={() => onSelect(note.id)}
              />
            ))}
          </div>
        </SortableContext>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Root drop zone ─────────────────────────────────────────────────────────────

function RootDropZone({ children, isEmpty }: { children: React.ReactNode; isEmpty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "root" });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[2rem] rounded transition-colors",
        isOver && "bg-accent/10",
        isEmpty && isOver && "border border-dashed border-accent/40 py-2"
      )}
    >
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdStr);
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Local notes array — source of truth for DnD ordering
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const foldersQuery = useQuery({
    queryKey: ["note-folders", projectId],
    queryFn: () => getFolders(projectId),
  });

  const notesQuery = useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => getNotes(projectId),
  });

  const folders = foldersQuery.data ?? [];
  const selectedNote = localNotes.find((n) => n.id === selectedId) ?? null;
  const rootNotes = localNotes.filter((n) => n.folder_id === null);

  const { editor, saveState } = useNoteEditor(selectedNote, projectId);

  // Sync localNotes from server whenever not mid-drag
  useEffect(() => {
    if (notesQuery.data && activeId === null) {
      setLocalNotes(
        [...notesQuery.data].sort((a, b) => a.position - b.position)
      );
    }
  }, [notesQuery.data, activeId]);

  useEffect(() => {
    setTitle(selectedNote?.title ?? "");
  }, [selectedNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedId === null && localNotes.length > 0)
      setSelectedId(localNotes[0].id);
  }, [localNotes, selectedId]);

  useEffect(() => {
    if (creatingFolder) folderInputRef.current?.focus();
  }, [creatingFolder]);

  // ── Mutations ───────────────────────────────────────────────────────────────

  const titleMutation = useMutation({
    mutationFn: (t: string) =>
      updateNote(projectId, selectedNote!.id, { title: t }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] }),
  });

  const pinMutation = useMutation({
    mutationFn: () => togglePin(projectId, selectedNote!.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(projectId, selectedNote!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      setSelectedId(null);
    },
    onError: () => showSnackbar("Failed to delete note", "error"),
  });

  const newNoteMutation = useMutation({
    mutationFn: () => createNote(projectId, { title: "Untitled" }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      setSelectedId(note.id);
    },
    onError: () => showSnackbar("Failed to create note", "error"),
  });

  const newFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder(projectId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-folders", projectId] });
      setCreatingFolder(false);
      setNewFolderName("");
    },
    onError: () => showSnackbar("Failed to create folder", "error"),
  });

  const reorderMutation = useMutation({
    mutationFn: ({
      noteId,
      folder_id,
      position,
    }: {
      noteId: number;
      folder_id: number | null;
      position: number;
    }) => updateNote(projectId, noteId, { folder_id, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
    },
    onError: () => {
      showSnackbar("Failed to reorder note", "error");
      if (notesQuery.data)
        setLocalNotes(
          [...notesQuery.data].sort((a, b) => a.position - b.position)
        );
    },
  });

  // ── Title handlers ──────────────────────────────────────────────────────────

  function handleTitleBlur() {
    const trimmed = title.trim() || "Untitled";
    setTitle(trimmed);
    if (selectedNote && trimmed !== selectedNote.title)
      titleMutation.mutate(trimmed);
  }

  function commitFolder() {
    const trimmed = newFolderName.trim();
    if (trimmed) newFolderMutation.mutate(trimmed);
    else setCreatingFolder(false);
  }

  // ── DnD ─────────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(Number(active.id));
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;

    const activeNote = localNotes.find((n) => n.id === Number(active.id));
    if (!activeNote) return;

    const overId = over.id;

    // Over a folder header droppable
    if (typeof overId === "string" && overId.startsWith("folder-")) {
      const targetFolderId = Number(overId.slice("folder-".length));
      if (activeNote.folder_id === targetFolderId) return;

      const withoutActive = localNotes.filter((n) => n.id !== activeNote.id);
      const lastInTarget = withoutActive.reduce(
        (idx, n, i) => (n.folder_id === targetFolderId ? i : idx),
        -1
      );
      const insertAt = lastInTarget === -1 ? withoutActive.length : lastInTarget + 1;
      const updated = [...withoutActive];
      updated.splice(insertAt, 0, { ...activeNote, folder_id: targetFolderId });
      setLocalNotes(updated);
      return;
    }

    // Over root droppable
    if (overId === "root") {
      if (activeNote.folder_id === null) return;
      const withoutActive = localNotes.filter((n) => n.id !== activeNote.id);
      const lastRoot = withoutActive.reduce(
        (idx, n, i) => (n.folder_id === null ? i : idx),
        -1
      );
      const insertAt = lastRoot === -1 ? withoutActive.length : lastRoot + 1;
      const updated = [...withoutActive];
      updated.splice(insertAt, 0, { ...activeNote, folder_id: null });
      setLocalNotes(updated);
      return;
    }

    // Over another note
    const overNote = localNotes.find((n) => n.id === Number(overId));
    if (!overNote || overNote.id === activeNote.id) return;

    const activeIdx = localNotes.findIndex((n) => n.id === activeNote.id);
    const overIdx = localNotes.findIndex((n) => n.id === overNote.id);

    if (activeNote.folder_id === overNote.folder_id) {
      setLocalNotes(arrayMove(localNotes, activeIdx, overIdx));
    } else {
      const withoutActive = localNotes.filter((n) => n.id !== activeNote.id);
      const newOverIdx = withoutActive.findIndex((n) => n.id === overNote.id);
      const updated = [...withoutActive];
      updated.splice(newOverIdx, 0, {
        ...activeNote,
        folder_id: overNote.folder_id,
      });
      setLocalNotes(updated);
    }
  }

  function handleDragEnd({ active }: DragEndEvent) {
    const activeNote = localNotes.find((n) => n.id === Number(active.id));
    setActiveId(null);
    if (!activeNote) return;

    // Compute fractional position from neighbors in final group
    const group = localNotes.filter(
      (n) => n.folder_id === activeNote.folder_id
    );
    const idx = group.findIndex((n) => n.id === activeNote.id);
    const prev = group[idx - 1];
    const next = group[idx + 1];

    let position: number;
    if (!prev && !next) position = 0;
    else if (!prev) position = next.position - 1;
    else if (!next) position = prev.position + 1;
    else position = (prev.position + next.position) / 2;

    reorderMutation.mutate({
      noteId: activeNote.id,
      folder_id: activeNote.folder_id,
      position,
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isLoading = foldersQuery.isLoading || notesQuery.isLoading;
  const activeNote = activeId !== null
    ? localNotes.find((n) => n.id === activeId) ?? null
    : null;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━ PART 1: Notes sidebar ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col w-64 shrink-0 border-r border-border overflow-hidden">

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Notes
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="New folder"
              onClick={() => setCreatingFolder(true)}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="New note"
              onClick={() => newNoteMutation.mutate()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Sidebar body */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded" />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-col gap-0.5">
                {folders.map((folder) => (
                  <FolderRow
                    key={folder.id}
                    folder={folder}
                    notes={localNotes.filter((n) => n.folder_id === folder.id)}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    projectId={projectId}
                  />
                ))}

                {creatingFolder && (
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <Folder className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <input
                      ref={folderInputRef}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={commitFolder}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitFolder();
                        if (e.key === "Escape") {
                          setCreatingFolder(false);
                          setNewFolderName("");
                        }
                      }}
                      placeholder="Folder name…"
                      className="flex-1 bg-transparent text-sm outline-none border-b border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                )}

                {(folders.length > 0 || creatingFolder) && rootNotes.length > 0 && (
                  <Separator className="my-1" />
                )}

                <SortableContext
                  id="root"
                  items={rootNotes.map((n) => n.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <RootDropZone isEmpty={rootNotes.length === 0}>
                    {rootNotes.map((note) => (
                      <SortableNoteItem
                        key={note.id}
                        note={note}
                        selected={selectedId === note.id}
                        onSelect={() => setSelectedId(note.id)}
                      />
                    ))}
                  </RootDropZone>
                </SortableContext>

                {folders.length === 0 && rootNotes.length === 0 && !creatingFolder && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No notes yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => newNoteMutation.mutate()}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Create first note
                    </Button>
                  </div>
                )}
              </div>

              <DragOverlay>
                {activeNote && (
                  <div className="shadow-lg rounded bg-card border border-border opacity-95">
                    <NoteItem
                      note={activeNote}
                      selected={false}
                      onSelect={() => {}}
                      isDragging
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━ PARTS 2 + 3: Right column ━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* PART 2: Title + toolbar */}
        <div className="shrink-0">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
            {selectedNote ? (
              <>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="flex-1 bg-transparent text-xl font-semibold outline-none placeholder:text-muted-foreground truncate"
                  placeholder="Untitled"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 w-7 p-0",
                      selectedNote.is_pinned
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={selectedNote.is_pinned ? "Unpin" : "Pin"}
                    onClick={() => pinMutation.mutate()}
                  >
                    {selectedNote.is_pinned ? (
                      <PinOff className="h-3.5 w-3.5" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    title="Delete note"
                    onClick={() => {
                      if (confirm("Delete this note?")) deleteMutation.mutate();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                Select a note to begin
              </span>
            )}
          </div>

          <div className="flex items-center border-b border-border bg-card/50">
            <EditorToolbar editor={editor} />
            <div className="ml-auto pr-4 flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              {saveState === "saving" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving…</span>
                </>
              )}
              {saveState === "saved" && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span className="text-primary">Saved</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PART 3: Editor — only this scrolls */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : selectedNote ? (
          <div className="flex-1 overflow-y-auto">
            <NoteEditor editor={editor} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Select a note or create a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
