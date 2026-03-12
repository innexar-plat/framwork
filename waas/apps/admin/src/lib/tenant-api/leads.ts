import { request, type TryRefresh } from "./client";

export type LeadOut = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  source: string | null;
  message: string | null;
};

export type LeadCreate = {
  name: string;
  email: string;
  source?: string | null;
  message?: string | null;
};

export async function listLeads(
  token: string,
  tryRefresh: TryRefresh,
  params?: { limit?: number; offset?: number }
): Promise<LeadOut[]> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const suffix = q.toString();
  const r = await request<LeadOut[]>(`/leads${suffix ? `?${suffix}` : ""}`, "GET", token, tryRefresh);
  return Array.isArray(r) ? r : [];
}

export async function getLead(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<LeadOut> {
  return request<LeadOut>(`/leads/${id}`, "GET", token, tryRefresh);
}

export async function createLead(
  body: LeadCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<LeadOut> {
  return request<LeadOut>("/leads", "POST", token, tryRefresh, body);
}
