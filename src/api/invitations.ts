import customAxios from "@/lib/customAxios";

export interface InvitationDetails {
  email: string;
  project_id: number;
  project_name: string;
  inviter_name: string;
}

export async function getInvitation(token: string): Promise<InvitationDetails> {
  const res = await customAxios.get(`/v1/invitations/${token}`);
  return res.data.data;
}

export interface AcceptInvitationData {
  name: string;
  password: string;
  password_confirmation: string;
}

export interface AcceptInvitationResult {
  token: string;
  user: { id: number; name: string; email: string };
  project_id: number;
}

export async function acceptInvitation(
  token: string,
  data: AcceptInvitationData,
): Promise<AcceptInvitationResult> {
  const res = await customAxios.post(`/v1/invitations/${token}/accept`, data);
  return res.data;
}
