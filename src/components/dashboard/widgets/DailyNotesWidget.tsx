import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createFolder, createNote, getFolders, getNotes, updateNote } from "@/api/notes";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { EditorToolbar } from "@/components/notes/EditorToolbar";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { useNotePresence } from "@/hooks/useNotePresence";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useAuth } from "@/contexts/AuthContext";
import { getEcho } from "@/lib/echo";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/models";
import type { WidgetProps } from "../widgetRegistry";

const DAILY_FOLDER = "Daily Notes";

function getTodayTitle(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DailyNotesWidget({ projectId }: WidgetProps) {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();

  const [dailyFolderId, setDailyFolderId] = useState<number | null>(null);
  const [todayNoteId, setTodayNoteId] = useState<number | null>(null);
  const folderInitRef = useRef(false);
  const creatingNoteRef = useRef(false);
  const dailyFolderIdRef = useRef<number | null>(null);
  dailyFolderIdRef.current = dailyFolderId;
  const todayNoteIdRef = useRef<number | null>(null);
  todayNoteIdRef.current = todayNoteId;

  const foldersQuery = useQuery({
    queryKey: ["note-folders", projectId],
    queryFn: () => getFolders(projectId),
  });

  const notesQuery = useQuery({
    queryKey: ["notes", projectId, { folder_id: dailyFolderId }],
    queryFn: () => getNotes(projectId, { folder_id: dailyFolderId! }),
    enabled: dailyFolderId !== null,
  });

  const todayNote =
    todayNoteId !== null
      ? (notesQuery.data?.find((n) => n.id === todayNoteId) ?? null)
      : null;

  const { editor, saveState, reportExternalSave } = useNoteEditor(
    todayNote,
    projectId,
    (name) => showSnackbar(`Your changes were saved and overrode ${name}'s recent edits.`, "success"),
    (name) => showSnackbar(`Your recent changes were overridden by ${name}.`, "error"),
  );

  const reportExternalSaveRef = useRef(reportExternalSave);
  reportExternalSaveRef.current = reportExternalSave;

  const notePresence = useNotePresence(todayNoteId, currentUser?.id);

  // Step 1: find or create the "Daily Notes" folder
  useEffect(() => {
    if (!foldersQuery.data || folderInitRef.current) return;
    folderInitRef.current = true;

    const existing = foldersQuery.data.find((f) => f.name === DAILY_FOLDER);
    if (existing) {
      setDailyFolderId(existing.id);
    } else {
      createFolder(projectId, { name: DAILY_FOLDER }).then((folder) => {
        queryClient.invalidateQueries({ queryKey: ["note-folders", projectId] });
        setDailyFolderId(folder.id);
      });
    }
  }, [foldersQuery.data, projectId, queryClient]);

  // Step 2: find today's note if it already exists — never auto-create
  useEffect(() => {
    if (!notesQuery.data || dailyFolderId === null) return;
    const today = getTodayTitle();
    const existing = notesQuery.data.find((n) => n.title === today);
    if (existing) setTodayNoteId(existing.id);
  }, [notesQuery.data, dailyFolderId]);

  // Create today's note on first keystroke rather than on mount
  useEffect(() => {
    if (!editor) return;

    const handleFirstInput = async () => {
      if (todayNoteIdRef.current !== null || creatingNoteRef.current || dailyFolderIdRef.current === null) return;
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
          (old: Note[] | undefined) => [...(old ?? []), { ...newNote, content }],
        );

        setTodayNoteId(newNote.id);
      } catch {
        creatingNoteRef.current = false;
      }
    };

    editor.on("update", handleFirstInput);
    return () => { editor.off("update", handleFirstInput); };
  }, [editor, projectId, queryClient]);

  // Overwrite detection — call reportExternalSave when another user updates
  // the same note we're currently editing. useProjectChannel handles query
  // invalidation; this only adds the overwrite notification on top.
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

    const handleNoteUpdated = (e: { note: Note }) => {
      if (e.note?.id === todayNoteIdRef.current) {
        reportExternalSaveRef.current(e.note.author?.name ?? "Someone");
      }
    };

    pusher.bind("note.updated", handleNoteUpdated);
    return () => {
      pusher.unbind("note.updated", handleNoteUpdated);
    };
  }, [projectId]);

  const isBooting =
    foldersQuery.isLoading ||
    (dailyFolderId !== null && notesQuery.isLoading);

  return (
    <div className="flex flex-col h-full overflow-hidden text-sm">
      {isBooting ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border shrink-0 gap-2">
            <span className="text-sm font-semibold truncate">
              {todayNote?.title ?? getTodayTitle()}
            </span>
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
