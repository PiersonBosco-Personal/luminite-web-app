import { useParams } from "react-router";
import { ProjectDashboard } from "@/components/dashboard/ProjectDashboard";

export default function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId ?? "");
  return <ProjectDashboard projectId={id} />;
}
