import customAxios from "@/lib/customAxios";
import type {
  Task,
  TaskSection,
  TaskPriority,
  TaskStatus,
} from "@/types/models";

// ── Sections ─────────────────────────────────────────────────────────────────

export async function getSections(projectId: number): Promise<TaskSection[]> {
  const res = await customAxios.get(`/v1/projects/${projectId}/sections`);
  return res.data.data;
}

export async function createSection(
  projectId: number,
  name: string,
): Promise<TaskSection> {
  const res = await customAxios.post(`/v1/projects/${projectId}/sections`, {
    name,
  });
  return res.data.data;
}

export async function updateSection(
  projectId: number,
  sectionId: number,
  name: string,
): Promise<TaskSection> {
  const res = await customAxios.put(
    `/v1/projects/${projectId}/sections/${sectionId}`,
    { name },
  );
  return res.data.data;
}

export async function deleteSection(
  projectId: number,
  sectionId: number,
): Promise<void> {
  await customAxios.delete(`/v1/projects/${projectId}/sections/${sectionId}`);
}

export async function reorderSections(
  projectId: number,
  sections: { id: number; position: number }[],
): Promise<void> {
  await customAxios.post(`/v1/projects/${projectId}/sections/reorder`, {
    sections,
  });
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface CreateTaskData {
  section_id: number;
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  description?: string | null;
  parent_task_id?: number | null;
  position?: number;
}

export interface UpdateTaskData {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  description?: string | null;
  section_id?: number;
  position?: number;
  assigned_to?: number | null;
}

export async function getTask(
  projectId: number,
  taskId: number,
): Promise<Task> {
  const res = await customAxios.get(
    `/v1/projects/${projectId}/tasks/${taskId}`,
  );
  return res.data.data;
}

export async function createTask(
  projectId: number,
  data: CreateTaskData,
): Promise<Task> {
  const res = await customAxios.post(`/v1/projects/${projectId}/tasks`, data);
  return res.data.data;
}

export async function updateTask(
  projectId: number,
  taskId: number,
  data: UpdateTaskData,
): Promise<Task> {
  const res = await customAxios.put(
    `/v1/projects/${projectId}/tasks/${taskId}`,
    data,
  );
  return res.data.data;
}

export async function deleteTask(
  projectId: number,
  taskId: number,
): Promise<void> {
  await customAxios.delete(`/v1/projects/${projectId}/tasks/${taskId}`);
}

export async function reorderTasks(
  projectId: number,
  tasks: { id: number; section_id: number; position: number }[],
): Promise<void> {
  await customAxios.post(`/v1/projects/${projectId}/tasks/reorder`, { tasks });
}
