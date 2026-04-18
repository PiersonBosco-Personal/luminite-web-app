import { useEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { createLowlight, common } from "lowlight";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { updateNote } from "@/api/notes";
import type { Note } from "@/types/models";

const lowlight = createLowlight(common);

export type SaveState = "idle" | "saving" | "saved";

function parseContent(content: unknown) {
  if (!content) return undefined;
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  }
  return content;
}

export function useNoteEditor(note: Note | null, projectId: number) {
  const queryClient = useQueryClient();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: (content: unknown) => {
      if (!note) return Promise.resolve({} as Note);
      return updateNote(projectId, note.id, { content });
    },
    onSuccess: () => {
      setSaveState("saved");
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      savedTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    },
  });

  const debouncedSave = useDebouncedCallback((content: unknown) => {
    mutation.mutate(content);
  }, 1500);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Link.configure({ openOnClick: false }),
    ],
    content: parseContent(note?.content),
    onUpdate: ({ editor }) => {
      if (!note) return;
      setSaveState("saving");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      debouncedSave(editor.getJSON());
    },
  });

  // Swap content when the selected note changes
  useEffect(() => {
    if (!editor) return;
    const content = parseContent(note?.content) ?? { type: "doc", content: [] };
    editor.commands.setContent(content, { emitUpdate: false });
    setSaveState("idle");
    debouncedSave.cancel();
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { editor, saveState };
}
