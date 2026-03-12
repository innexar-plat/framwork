import { request, type TryRefresh } from "./client";

export type TenantMemberOut = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  email: string;
  name: string | null;
};

export type TenantMemberInvite = { email: string; role?: string };
export type TenantMemberRoleUpdate = { role: string };

export async function listTenantMembers(
  token: string,
  tryRefresh: TryRefresh
): Promise<TenantMemberOut[]> {
  const r = await request<TenantMemberOut[]>("/tenant/users", "GET", token, tryRefresh);
  return Array.isArray(r) ? r : [];
}

export async function inviteTenantMember(
  body: TenantMemberInvite,
  token: string,
  tryRefresh: TryRefresh
): Promise<TenantMemberOut> {
  return request<TenantMemberOut>("/tenant/users", "POST", token, tryRefresh, body);
}

export async function updateTenantMemberRole(
  id: string,
  body: TenantMemberRoleUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<TenantMemberOut> {
  return request<TenantMemberOut>(`/tenant/users/${id}`, "PATCH", token, tryRefresh, body);
}

export async function removeTenantMember(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/tenant/users/${id}`, "DELETE", token, tryRefresh);
}
