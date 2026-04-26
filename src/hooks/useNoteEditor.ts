import { useEffect, useRef, useState } from "react";
import { useEditor, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { findChildren } from "@tiptap/core";
import { createLowlight, common } from "lowlight";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { updateNote } from "@/api/notes";
import type { Note } from "@/types/models";
import { FontSize } from "@/lib/extensions/FontSize";
import { CodeBlockView } from "@/components/notes/CodeBlockView";

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
  // Tracks the content hash last received from the server, so we can detect external changes
  const serverContentHashRef = useRef<string | null>(null);
  // Stable ref so the external-sync effect can read saveState without it being a dep
  const saveStateRef = useRef<SaveState>("idle");
  saveStateRef.current = saveState;

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

  const debouncedJsxCheck = useDebouncedCallback(
    (editorInstance: NonNullable<ReturnType<typeof useEditor>>) => {
      const { doc } = editorInstance.state;
      const jsxPattern = /<[A-Z][A-Za-z0-9.]*[\s/>]|<\/[A-Za-z]|=\{/;
      const tr = editorInstance.state.tr;
      let changed = false;
      findChildren(doc, (node) => node.type.name === "codeBlock").forEach(
        ({ node, pos }) => {
          const lang: string = node.attrs.language ?? "";
          if (
            (lang === "typescript" || lang === "javascript") &&
            jsxPattern.test(node.textContent)
          ) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              language: lang === "typescript" ? "tsx" : "jsx",
            });
            changed = true;
          }
        }
      );
      if (changed) {
        tr.setMeta("addToHistory", false);
        tr.setMeta("jsxAutoSwitch", true);
        editorInstance.view.dispatch(tr);
      }
    },
    400
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView);
        },
      }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Link.configure({ openOnClick: false }),
      Underline,
      FontSize,
    ],
    content: parseContent(note?.content),
    onUpdate: ({ editor, transaction }) => {
      if (!note) return;
      if (transaction.getMeta("jsxAutoSwitch")) return;
      setSaveState("saving");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      debouncedSave(editor.getJSON());
      debouncedJsxCheck(editor);
    },
  });

  // Swap content when the selected note changes (navigation between notes)
  useEffect(() => {
    if (!editor) return;
    const content = parseContent(note?.content) ?? { type: "doc", content: [] };
    editor.commands.setContent(content, { emitUpdate: false });
    setSaveState("idle");
    debouncedSave.cancel();
    // Record the baseline server content hash for this note
    const raw = note?.content;
    serverContentHashRef.current = raw
      ? typeof raw === "string"
        ? raw
        : JSON.stringify(raw)
      : null;
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync content from external server changes (another user edited this note)
  useEffect(() => {
    if (!editor || !note) return;
    const raw = note.content;
    const hash = raw
      ? typeof raw === "string"
        ? raw
        : JSON.stringify(raw)
      : null;
    // Skip if content hasn't actually changed from what we last saw from the server
    if (hash === serverContentHashRef.current) return;
    serverContentHashRef.current = hash;
    // Don't overwrite while the user is actively saving — their edit takes precedence
    if (saveStateRef.current !== "idle") return;
    const parsed = parseContent(note.content) ?? { type: "doc", content: [] };
    editor.commands.setContent(parsed, { emitUpdate: false });
  }, [note?.content]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { editor, saveState };
}
