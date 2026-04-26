import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createFolder, createNote, getFolders, getNotes, updateNote } from "@/api/notes";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { EditorToolbar } from "@/components/notes/EditorToolbar";
import { useNoteEditor } from "@/hooks/useNoteEditor";
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

  const { editor, saveState } = useNoteEditor(todayNote, projectId);

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

        // Pre-populate the cache so useNoteEditor receives the note with content
        // already set — preventing the id-change effect from clearing the editor
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
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
