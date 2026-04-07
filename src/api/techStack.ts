import customAxios from "@/lib/customAxios";
import type { TechStack } from "@/types/models";

export async function getTechStack(projectId: number): Promise<TechStack[]> {
  const res = await customAxios.get(`/v1/projects/${projectId}/tech-stack`);
  return res.data.data;
}

export async function createTechStack(
  projectId: number,
  data: { name: string; version?: string | null; parent_id?: number | null }
): Promise<TechStack> {
  const res = await customAxios.post(
    `/v1/projects/${projectId}/tech-stack`,
    data
  );
  return res.data.data;
}

export async function updateTechStack(
  projectId: number,
  techStackId: number,
  data: { name?: string; version?: string | null }
): Promise<TechStack> {
  const res = await customAxios.patch(
    `/v1/projects/${projectId}/tech-stack/${techStackId}`,
    data
  );
  return res.data.data;
}

export async function deleteTechStack(
  projectId: number,
  techStackId: number
): Promise<void> {
  await customAxios.delete(
    `/v1/projects/${projectId}/tech-stack/${techStackId}`
  );
}
