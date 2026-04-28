import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import {
  createFolder,
  createNote,
  getFolders,
  getNotes,
  updateNote,
} from "@/api/notes";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { EditorToolbar } from "@/components/notes/EditorToolbar";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { useNotePresence } from "@/hooks/useNotePresence";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useAuth } from "@/contexts/AuthContext";
import { getEcho } from "@/lib/echo";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from "@/types/models";
import type { WidgetProps } from "../widgetRegistry";

type WidgetMode = "daily" | number;

const DAILY_FOLDER = "Daily Notes";

function getTodayTitle(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function NotesWidget({ projectId }: WidgetProps) {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();

  const [mode, setMode] = useState<WidgetMode>("daily");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<
    Set<number | "unfiled">
  >(new Set());
  const [dailyFolderId, setDailyFolderId] = useState<number | null>(null);
  const [todayNoteId, setTodayNoteId] = useState<number | null>(null);
  const folderInitRef = useRef(false);
  const creatingNoteRef = useRef(false);
  const dailyFolderIdRef = useRef<number | null>(null);
  dailyFolderIdRef.current = dailyFolderId;
  const todayNoteIdRef = useRef<number | null>(null);
  todayNoteIdRef.current = todayNoteId;
  const modeRef = useRef<WidgetMode>("daily");
  modeRef.current = mode;

  const foldersQuery = useQuery({
    queryKey: ["note-folders", projectId],
    queryFn: () => getFolders(projectId),
  });

  const dailyNotesQuery = useQuery({
    queryKey: ["notes", projectId, { folder_id: dailyFolderId }],
    queryFn: () => getNotes(projectId, { folder_id: dailyFolderId! }),
    enabled: dailyFolderId !== null,
  });

  const allNotesQuery = useQuery({
    queryKey: ["notes", projectId, {}],
    queryFn: () => getNotes(projectId),
  });

  const todayNote =
    todayNoteId !== null
      ? (dailyNotesQuery.data?.find((n) => n.id === todayNoteId) ?? null)
      : null;

  const activeNote: Note | null =
    mode === "daily"
      ? todayNote
      : (allNotesQuery.data?.find((n) => n.id === mode) ?? null);

  const activeNoteIdRef = useRef<number | null>(null);
  activeNoteIdRef.current = activeNote?.id ?? null;

  const { editor, saveState, reportExternalSave } = useNoteEditor(
    activeNote,
    projectId,
    (name) =>
      showSnackbar(
        `Your changes were saved and overrode ${name}'s recent edits.`,
        "success",
      ),
    (name) =>
      showSnackbar(`Your recent changes were overridden by ${name}.`, "error"),
  );

  const reportExternalSaveRef = useRef(reportExternalSave);
  reportExternalSaveRef.current = reportExternalSave;

  const notePresence = useNotePresence(activeNote?.id ?? null, currentUser?.id);

  // Step 1: find or create the "Daily Notes" folder
  useEffect(() => {
    if (!foldersQuery.data || folderInitRef.current) return;
    folderInitRef.current = true;

    const existing = foldersQuery.data.find((f) => f.name === DAILY_FOLDER);
    if (existing) {
      setDailyFolderId(existing.id);
    } else {
      createFolder(projectId, { name: DAILY_FOLDER }).then((folder) => {
        queryClient.invalidateQueries({
          queryKey: ["note-folders", projectId],
        });
        setDailyFolderId(folder.id);
      });
    }
  }, [foldersQuery.data, projectId, queryClient]);

  // Step 2: find today's note if it already exists — never auto-create
  useEffect(() => {
    if (!dailyNotesQuery.data || dailyFolderId === null) return;
    const today = getTodayTitle();
    const existing = dailyNotesQuery.data.find((n) => n.title === today);
    if (existing) setTodayNoteId(existing.id);
  }, [dailyNotesQuery.data, dailyFolderId]);

  // Create today's note on first keystroke (daily mode only)
  useEffect(() => {
    if (!editor) return;

    const handleFirstInput = async () => {
      if (modeRef.current !== "daily") return;
      if (
        todayNoteIdRef.current !== null ||
        creatingNoteRef.current ||
        dailyFolderIdRef.current === null
      )
        return;
      creatingNoteRef.current = true;

      try {
        const newNote = await createNote(projectId, {
          title: getTodayTitle(),
          folder_id: dailyFolderIdRef.current,
        });
        const content = editor.getJSON();
        await updateNote(projectId, newNote.id, { content });

        queryClient.setQueryData(
          ["notes", projectId, { folder_id: dailyFolderIdRef.current }],
          (old: Note[] | undefined) => [
            ...(old ?? []),
            { ...newNote, content },
          ],
        );

        setTodayNoteId(newNote.id);
      } catch {
        creatingNoteRef.current = false;
      }
    };

    editor.on("update", handleFirstInput);
    return () => {
      editor.off("update", handleFirstInput);
    };
  }, [editor, projectId, queryClient]);

  // Notify on external saves to the active note
  useEffect(() => {
    if (!projectId) return;
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`project.${projectId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pusher = (channel as any).subscription as {
      bind: (event: string, fn: (e: unknown) => void) => void;
      unbind: (event: string, fn: (e: unknown) => void) => void;
    };
    if (!pusher) return;

    const handleNoteUpdated = (e: unknown) => {
      const { note } = e as { note: Note };
      if (note?.id === activeNoteIdRef.current) {
        reportExternalSaveRef.current(note.author?.name ?? "Someone");
      }
    };

    pusher.bind("note.updated", handleNoteUpdated);
    return () => {
      pusher.unbind("note.updated", handleNoteUpdated);
    };
  }, [projectId]);

  // Build grouped dropdown data (exclude Daily Notes folder)
  const dropdownFolders =
    foldersQuery.data?.filter((f) => f.name !== DAILY_FOLDER) ?? [];
  const nonDailyNotes =
    allNotesQuery.data?.filter((n) => n.folder_id !== dailyFolderId) ?? [];

  const notesByFolder = new Map<number | null, Note[]>();
  notesByFolder.set(null, []);
  for (const folder of dropdownFolders) notesByFolder.set(folder.id, []);
  for (const note of nonDailyNotes) {
    const key =
      note.folder_id !== null && notesByFolder.has(note.folder_id)
        ? note.folder_id
        : null;
    notesByFolder.get(key)!.push(note);
  }

  const headerTitle =
    mode === "daily"
      ? (todayNote?.title ?? getTodayTitle())
      : (activeNote?.title ?? "Select a note");

  const isBooting =
    foldersQuery.isLoading ||
    (dailyFolderId !== null && dailyNotesQuery.isLoading);

  return (
    <div className="flex flex-col h-full overflow-hidden text-sm">
      {isBooting ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border shrink-0 gap-2">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-semibold truncate hover:opacity-70 transition-opacity max-w-[60%] outline-none">
                <span className="truncate">{headerTitle}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 p-1 max-h-72 overflow-y-auto"
              >
                {/* Daily Notes */}
                <button
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    mode === "daily" && "text-primary",
                  )}
                  onClick={() => {
                    setMode("daily");
                    setDropdownOpen(false);
                  }}
                >
                  Daily Note
                </button>

                {/* Folder sections */}
                {(dropdownFolders.some(
                  (f) => (notesByFolder.get(f.id)?.length ?? 0) > 0,
                ) ||
                  (notesByFolder.get(null)?.length ?? 0) > 0) && (
                  <div className="-mx-1 my-1 h-px bg-muted" />
                )}

                {dropdownFolders.map((folder) => {
                  const notes = notesByFolder.get(folder.id) ?? [];
                  if (notes.length === 0) return null;
                  const expanded = expandedFolders.has(folder.id);
                  return (
                    <div key={folder.id}>
                      <button
                        className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() =>
                          setExpandedFolders((prev) => {
                            const next = new Set(prev);
                            next.has(folder.id)
                              ? next.delete(folder.id)
                              : next.add(folder.id);
                            return next;
                          })
                        }
                      >
                        <span>{folder.name}</span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform",
                            expanded && "rotate-180",
                          )}
                        />
                      </button>
                      {expanded && (
                        <div className="ml-3 border-l border-border pl-2 mb-0.5">
                          {notes.map((note) => (
                            <button
                              key={note.id}
                              className={cn(
                                "w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors truncate",
                                mode === note.id && "text-primary",
                              )}
                              onClick={() => {
                                setMode(note.id);
                                setDropdownOpen(false);
                              }}
                            >
                              {note.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {(notesByFolder.get(null)?.length ?? 0) > 0 &&
                  (() => {
                    const expanded = expandedFolders.has("unfiled");
                    return (
                      <div>
                        <button
                          className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() =>
                            setExpandedFolders((prev) => {
                              const next = new Set(prev);
                              next.has("unfiled")
                                ? next.delete("unfiled")
                                : next.add("unfiled");
                              return next;
                            })
                          }
                        >
                          <span className="text-muted-foreground">Unfiled</span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 text-muted-foreground transition-transform",
                              expanded && "rotate-180",
                            )}
                          />
                        </button>
                        {expanded && (
                          <div className="ml-3 border-l border-border pl-2 mb-0.5">
                            {notesByFolder.get(null)!.map((note) => (
                              <button
                                key={note.id}
                                className={cn(
                                  "w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors truncate",
                                  mode === note.id && "text-primary",
                                )}
                                onClick={() => {
                                  setMode(note.id);
                                  setDropdownOpen(false);
                                }}
                              >
                                {note.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 shrink-0">
              {notePresence.length > 0 && (
                <div className="flex items-center">
                  {notePresence.map((member, i) => (
                    <div
                      key={member.id}
                      title={`${member.name} is also editing this note`}
                      style={{ zIndex: notePresence.length - i }}
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold ring-2 ring-background select-none",
                        i > 0 && "-ml-1",
                        "bg-primary/20 text-primary",
                      )}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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

          <div className="border-b border-border bg-card/50 shrink-0 overflow-x-auto">
            <EditorToolbar editor={editor} />
          </div>

          <div className="flex-1 overflow-y-auto">
            <NoteEditor editor={editor} />
          </div>
        </>
      )}
    </div>
  );
}
