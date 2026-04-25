import customAxios from "@/lib/customAxios";
import type { Project, User } from "@/types/models";

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

// ── Members ───────────────────────────────────────────────────────────────────

export type MemberWithRole = User & { pivot: { role: "owner" | "member" } };

export async function getMembers(projectId: number): Promise<MemberWithRole[]> {
  const res = await customAxios.get(`/v1/projects/${projectId}/members`);
  const roles: Record<number, "owner" | "member"> = res.data.meta?.roles ?? {};
  return res.data.data.map((user: User) => ({
    ...user,
    pivot: { role: roles[user.id] ?? "member" },
  }));
}

export type AddMemberResult =
  | { invited: false; user: User }
  | { invited: true; message: string };

export async function addMember(projectId: number, email: string): Promise<AddMemberResult> {
  const res = await customAxios.post(`/v1/projects/${projectId}/members`, { email });
  if (res.status === 202) return { invited: true, message: res.data.message };
  return { invited: false, user: res.data.data };
}

export async function removeMember(projectId: number, userId: number): Promise<void> {
  await customAxios.delete(`/v1/projects/${projectId}/members/${userId}`);
}
