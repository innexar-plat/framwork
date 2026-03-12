import { request, type TryRefresh } from "./client";

export type PropertyItemOut = {
  id: string;
  tenant_id: string;
  title: string;
  address: string | null;
  status: string;
};

export type PropertyItemCreate = {
  title: string;
  address?: string | null;
  status?: string;
};

export async function listPropertyItems(
  token: string,
  tryRefresh: TryRefresh,
  params?: { limit?: number; offset?: number }
): Promise<PropertyItemOut[]> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const suffix = q.toString();
  const r = await request<PropertyItemOut[]>(
    `/property/items${suffix ? `?${suffix}` : ""}`,
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}

export async function getPropertyItem(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<PropertyItemOut> {
  return request<PropertyItemOut>(`/property/items/${id}`, "GET", token, tryRefresh);
}

export async function createPropertyItem(
  body: PropertyItemCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<PropertyItemOut> {
  return request<PropertyItemOut>("/property/items", "POST", token, tryRefresh, body);
}

export async function deletePropertyItem(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/property/items/${id}`, "DELETE", token, tryRefresh);
}
