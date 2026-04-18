import customAxios from "@/lib/customAxios";
import type { Note, NoteFolder } from "@/types/models";

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getNotes(
  projectId: number,
  params?: { folder_id?: number | "null" }
): Promise<Note[]> {
  const res = await customAxios.get(`/v1/projects/${projectId}/notes`, {
    params,
  });
  return res.data.data;
}

export async function getNote(
  projectId: number,
  noteId: number
): Promise<Note> {
  const res = await customAxios.get(
    `/v1/projects/${projectId}/notes/${noteId}`
  );
  return res.data.data;
}

export async function createNote(
  projectId: number,
  data: {
    title: string;
    folder_id?: number | null;
    task_id?: number | null;
    content?: unknown;
    is_pinned?: boolean;
  }
): Promise<Note> {
  const res = await customAxios.post(`/v1/projects/${projectId}/notes`, data);
  return res.data.data;
}

export async function updateNote(
  projectId: number,
  noteId: number,
  data: {
    title?: string;
    folder_id?: number | null;
    task_id?: number | null;
    content?: unknown;
    is_pinned?: boolean;
    position?: number;
  }
): Promise<Note> {
  const res = await customAxios.put(
    `/v1/projects/${projectId}/notes/${noteId}`,
    data
  );
  return res.data.data;
}

export async function deleteNote(
  projectId: number,
  noteId: number
): Promise<void> {
  await customAxios.delete(`/v1/projects/${projectId}/notes/${noteId}`);
}

export async function togglePin(
  projectId: number,
  noteId: number
): Promise<Note> {
  const res = await customAxios.patch(
    `/v1/projects/${projectId}/notes/${noteId}/pin`
  );
  return res.data.data;
}

// ── Folders ───────────────────────────────────────────────────────────────────

export async function getFolders(projectId: number): Promise<NoteFolder[]> {
  const res = await customAxios.get(
    `/v1/projects/${projectId}/note-folders`
  );
  return res.data.data;
}

export async function createFolder(
  projectId: number,
  data: { name: string; position?: number }
): Promise<NoteFolder> {
  const res = await customAxios.post(
    `/v1/projects/${projectId}/note-folders`,
    data
  );
  return res.data.data;
}

export async function updateFolder(
  projectId: number,
  folderId: number,
  data: { name?: string; position?: number }
): Promise<NoteFolder> {
  const res = await customAxios.put(
    `/v1/projects/${projectId}/note-folders/${folderId}`,
    data
  );
  return res.data.data;
}

export async function deleteFolder(
  projectId: number,
  folderId: number
): Promise<void> {
  await customAxios.delete(
    `/v1/projects/${projectId}/note-folders/${folderId}`
  );
}
