import type React from "react";
import type { DashboardWidget } from "@/types/models";

export interface WidgetProps {
  widget: DashboardWidget;
  projectId: number;
  isEditing: boolean;
  setHeaderActions?: (actions: React.ReactNode) => void;
}

import { TasksBoardWidget } from "./widgets/TasksBoardWidget";
import { TasksListWidget } from "./widgets/TasksListWidget";
import { NotesWidget } from "./widgets/NotesWidget";
import { ActivityFeedWidget } from "./widgets/ActivityFeedWidget";
import { TechStackWidget } from "./widgets/TechStackWidget";
import { TeamPresenceWidget } from "./widgets/TeamPresenceWidget";
import { AiChatWidget } from "./widgets/AiChatWidget";
import { TaskBurndownWidget } from "./widgets/TaskBurndownWidget";
import { DeadlineTrackerWidget } from "./widgets/DeadlineTrackerWidget";
import { LabelBreakdownWidget } from "./widgets/LabelBreakdownWidget";

// Keyed by widget.slug — must match widgets.slug in the DB
export const widgetRegistry: Record<string, React.ComponentType<WidgetProps>> = {
  tasks_board: TasksBoardWidget,
  tasks_list: TasksListWidget,
  notes_list: NotesWidget,
  activity_feed: ActivityFeedWidget,
  tech_stack: TechStackWidget,
  team_presence: TeamPresenceWidget,
  ai_chat: AiChatWidget,
  task_burndown: TaskBurndownWidget,
  deadline_tracker: DeadlineTrackerWidget,
  label_breakdown: LabelBreakdownWidget,
};
