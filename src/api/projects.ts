import customAxios from "@/lib/customAxios";
import type { Project } from "@/types/models";

export async function getProjects(): Promise<Project[]> {
  const res = await customAxios.get("/v1/projects");
  return res.data.data;
}

export async function getProject(id: number): Promise<Project> {
  const res = await customAxios.get(`/v1/projects/${id}`);
  return res.data.data;
}

export async function createProject(data: {
  name: string;
  description?: string;
}): Promise<Project> {
  const res = await customAxios.post("/v1/projects", data);
  return res.data.data;
}

export async function updateProject(
  id: number,
  data: Partial<{ name: string; description: string; status: string }>
): Promise<Project> {
  const res = await customAxios.put(`/v1/projects/${id}`, data);
  return res.data.data;
}

export async function deleteProject(id: number): Promise<void> {
  await customAxios.delete(`/v1/projects/${id}`);
}
