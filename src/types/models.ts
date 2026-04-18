export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  goals: string | null;
  architecture_notes: string | null;
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

export interface NoteFolder {
  id: number;
  project_id: number;
  created_by: number;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  project_id: number;
  folder_id: number | null;
  task_id: number | null;
  author?: User;
  title: string;
  content: unknown;
  is_pinned: boolean;
  position: number;
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
  parent_id: number | null;
  name: string;
  version: string | null;
  children?: TechStack[];
  created_at: string;
  updated_at: string;
}

export interface Widget {
  id: number;
  slug: string;
  name: string;
  category: "productivity" | "analytics" | "team" | "ai";
  description: string;
  icon: string;
  is_active: boolean;
  default_w: number;
  default_h: number;
  min_w: number;
  min_h: number;
}

export interface DashboardWidget {
  id: number;
  project_id: number;
  user_id: number;
  widget_id: number;
  widget: Widget;
  grid_x: number;
  grid_y: number;
  grid_w: number;
  grid_h: number;
  created_at: string;
  updated_at: string;
}
