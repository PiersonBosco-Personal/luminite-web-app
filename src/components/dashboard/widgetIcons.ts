import {
  Kanban,
  List,
  FileText,
  Activity,
  Layers,
  Users,
  Bot,
  TrendingDown,
  Calendar,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const slugIconMap: Record<string, LucideIcon> = {
  tasks_board: Kanban,
  tasks_list: List,
  notes_list: FileText,
  activity_feed: Activity,
  tech_stack: Layers,
  team_presence: Users,
  ai_chat: Bot,
  task_burndown: TrendingDown,
  deadline_tracker: Calendar,
  label_breakdown: Tag,
};
