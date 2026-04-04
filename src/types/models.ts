export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "archived";
  owner: User;
  members?: (User & { pivot?: { role: "owner" | "member" } })[];
  members_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskSection {
  id: number;
  project_id: number;
  name: string;
  position: number;
  tasks?: Task[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  section_id: number;
  parent_task_id: number | null;
  assignee?: User | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  position: number;
  labels?: Label[];
  subtasks_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  project_id: number;
  task_id: number | null;
  author?: User;
  title: string;
  content: unknown;
  is_pinned: boolean;
  labels?: Label[];
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: number;
  project_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TechStack {
  id: number;
  project_id: number;
  name: string;
  app_label: "frontend" | "backend" | "mobile" | "other";
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: number;
  project_id: number;
  type: string;
  config: Record<string, unknown> | null;
  grid_x: number;
  grid_y: number;
  grid_w: number;
  grid_h: number;
  created_at: string;
  updated_at: string;
}
