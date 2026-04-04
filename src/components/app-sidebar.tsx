import * as React from "react";
import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderKanban, Kanban, FileText, Settings } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getProjects, getProject } from "@/api/projects";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

  const projectMatch = location.pathname.match(/^\/projects\/(\d+)/);
  const projectId = projectMatch ? parseInt(projectMatch[1]) : null;

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: projectId !== null,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    staleTime: 1000 * 30,
  });

  const isActive = (segment: string) => location.pathname.includes(segment);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {projectId ? (
          <div className="flex flex-col gap-1 px-1 py-1">
            <SidebarMenuButton
              asChild
              className="text-muted-foreground hover:text-foreground h-7"
            >
              <Link to="/projects">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs">All Projects</span>
              </Link>
            </SidebarMenuButton>
            <div className="px-2 py-0.5 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold truncate leading-tight">
                {project?.name ?? "…"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {project?.status}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <img
              src="/logo.png"
              alt="Luminite"
              className="h-7 w-7 shrink-0"
            />
            <span className="font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Luminite
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {projectId ? (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/board")}
                  tooltip="Board"
                >
                  <Link to={`/projects/${projectId}/board`}>
                    <Kanban />
                    <span>Board</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/notes")}
                  tooltip="Notes"
                >
                  <Link to={`/projects/${projectId}/notes`}>
                    <FileText />
                    <span>Notes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/settings")}
                  tooltip="Settings"
                >
                  <Link to={`/projects/${projectId}/settings`}>
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/projects"}
                    tooltip="My Projects"
                  >
                    <Link to="/projects">
                      <FolderKanban />
                      <span>My Projects</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {projects && projects.length > 0 && (
              <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                <SidebarGroupLabel>Projects</SidebarGroupLabel>
                <SidebarMenu>
                  {projects.map((p) => (
                    <SidebarMenuItem key={p.id}>
                      <SidebarMenuButton asChild>
                        <Link to={`/projects/${p.id}/board`}>
                          <span>{p.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
