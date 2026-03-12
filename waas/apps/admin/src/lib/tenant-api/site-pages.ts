import { request, type TryRefresh } from "./client";

export type SitePageOut = {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
};

export type SitePageCreate = {
  title: string;
  slug: string;
  content?: string | null;
  status?: string;
  sort_order?: number;
  meta_title?: string | null;
  meta_description?: string | null;
};

export type SitePageUpdate = Partial<SitePageCreate>;

export async function listSitePages(
  token: string,
  tryRefresh: TryRefresh,
  params?: { status?: string; limit?: number; offset?: number }
): Promise<SitePageOut[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const suffix = q.toString();
  const r = await request<SitePageOut[]>(
    `/tenant/pages${suffix ? `?${suffix}` : ""}`,
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}

export async function getSitePage(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<SitePageOut> {
  return request<SitePageOut>(`/tenant/pages/${id}`, "GET", token, tryRefresh);
}

export async function createSitePage(
  body: SitePageCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<SitePageOut> {
  return request<SitePageOut>("/tenant/pages", "POST", token, tryRefresh, body);
}

export async function updateSitePage(
  id: string,
  body: SitePageUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<SitePageOut> {
  return request<SitePageOut>(`/tenant/pages/${id}`, "PATCH", token, tryRefresh, body);
}

export async function deleteSitePage(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/tenant/pages/${id}`, "DELETE", token, tryRefresh);
}
