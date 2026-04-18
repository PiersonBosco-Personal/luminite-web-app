import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";

interface NoteEditorProps {
  editor: Editor | null;
}

export function NoteEditor({ editor }: NoteEditorProps) {
  return (
    <EditorContent editor={editor} className="note-editor min-h-full" />
  );
}
