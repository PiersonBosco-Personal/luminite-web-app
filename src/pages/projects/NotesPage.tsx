import { FileText } from "lucide-react";

export default function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 text-center p-6">
      <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold">Notes</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Rich text notes with Tiptap coming soon.
      </p>
    </div>
  );
}
