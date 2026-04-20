import customAxios from "@/lib/customAxios";
import type { Label } from "@/types/models";

export async function getLabels(projectId: number): Promise<Label[]> {
  const res = await customAxios.get(`/v1/projects/${projectId}/labels`);
  return res.data.data;
}

export async function attachLabelToTask(
  projectId: number,
  labelId: number,
  taskId: number,
): Promise<void> {
  await customAxios.post(
    `/v1/projects/${projectId}/labels/${labelId}/tasks/attach`,
    { task_id: taskId },
  );
}

export async function detachLabelFromTask(
  projectId: number,
  labelId: number,
  taskId: number,
): Promise<void> {
  await customAxios.delete(
    `/v1/projects/${projectId}/labels/${labelId}/tasks/detach`,
    { data: { task_id: taskId } },
  );
}
