import { Navigate, Outlet, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getProject } from "@/api/projects";

export default function ProjectShell() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId ?? "");

  const { isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
    enabled: !isNaN(id),
    retry: false,
  });

  if (isNaN(id)) return <Navigate to="/projects" replace />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-64 text-center p-6">
        <p className="text-muted-foreground">Project not found or you don't have access.</p>
      </div>
    );
  }

  return <Outlet />;
}
