import { useParams } from "react-router";
import { Kanban } from "lucide-react";

export default function BoardPage() {
  const { projectId } = useParams();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 text-center p-6">
      <Kanban className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold">Kanban Board</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Drag-and-drop task board coming soon. Project {projectId}.
      </p>
    </div>
  );
}
