/**
 * Catalog admin API client. All requests use Bearer token and retry on 401.
 */

function getBaseUrl(): string {
  return typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    : "http://localhost:8000";
}

const CATALOG_ADMIN_PREFIX = "/api/v1/admin/catalog";

export type PlanOut = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type NicheOut = {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ModuleOut = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type MatrixRowOut = {
  id: string;
  plan_id: string;
  niche_id: string;
  module_id: string;
  is_enabled: boolean;
};

export type PlanCreate = {
  code: string;
  name: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type PlanUpdate = Partial<PlanCreate>;

export type NicheCreate = {
  code: string;
  name: string;
  parent_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type NicheUpdate = Partial<NicheCreate>;

export type ModuleCreate = {
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type ModuleUpdate = Partial<ModuleCreate>;

export type MatrixRowCreate = {
  plan_id: string;
  niche_id: string;
  module_id: string;
  is_enabled?: boolean;
};

type TryRefresh = () => Promise<string | null>;

async function request<T>(
  path: string,
  method: string,
  token: string,
  tryRefresh: TryRefresh,
  body?: unknown
): Promise<T> {
  const url = `${getBaseUrl()}${CATALOG_ADMIN_PREFIX}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  let res = await fetch(url, {
    method,
    headers,
    ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await fetch(url, {
        method,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
      });
    }
  }
  const json = await res.json();
  if (!res.ok) throw new Error((json as { error?: string }).error ?? String(res.status));
  return json as T;
}

export async function listPlans(
  token: string,
  tryRefresh: TryRefresh
): Promise<PlanOut[]> {
  const r = await request<{ success: boolean; data: PlanOut[] }>("/plans", "GET", token, tryRefresh);
  return r.data ?? [];
}

export async function createPlan(
  body: PlanCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<PlanOut> {
  const r = await request<{ success: boolean; data: PlanOut }>("/plans", "POST", token, tryRefresh, body);
  return r.data as PlanOut;
}

export async function updatePlan(
  planId: string,
  body: PlanUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<PlanOut> {
  const r = await request<{ success: boolean; data: PlanOut }>(
    `/plans/${planId}`,
    "PATCH",
    token,
    tryRefresh,
    body
  );
  return r.data as PlanOut;
}

export async function deletePlan(
  planId: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/plans/${planId}`, "DELETE", token, tryRefresh);
}

export async function listNiches(
  token: string,
  tryRefresh: TryRefresh
): Promise<NicheOut[]> {
  const r = await request<{ success: boolean; data: NicheOut[] }>("/niches", "GET", token, tryRefresh);
  return r.data ?? [];
}

export async function createNiche(
  body: NicheCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<NicheOut> {
  const r = await request<{ success: boolean; data: NicheOut }>("/niches", "POST", token, tryRefresh, body);
  return r.data as NicheOut;
}

export async function updateNiche(
  nicheId: string,
  body: NicheUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<NicheOut> {
  const r = await request<{ success: boolean; data: NicheOut }>(
    `/niches/${nicheId}`,
    "PATCH",
    token,
    tryRefresh,
    body
  );
  return r.data as NicheOut;
}

export async function deleteNiche(
  nicheId: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/niches/${nicheId}`, "DELETE", token, tryRefresh);
}

export async function listModules(
  token: string,
  tryRefresh: TryRefresh
): Promise<ModuleOut[]> {
  const r = await request<{ success: boolean; data: ModuleOut[] }>("/modules", "GET", token, tryRefresh);
  return r.data ?? [];
}

export async function createModule(
  body: ModuleCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<ModuleOut> {
  const r = await request<{ success: boolean; data: ModuleOut }>("/modules", "POST", token, tryRefresh, body);
  return r.data as ModuleOut;
}

export async function updateModule(
  moduleId: string,
  body: ModuleUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<ModuleOut> {
  const r = await request<{ success: boolean; data: ModuleOut }>(
    `/modules/${moduleId}`,
    "PATCH",
    token,
    tryRefresh,
    body
  );
  return r.data as ModuleOut;
}

export async function deleteModule(
  moduleId: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/modules/${moduleId}`, "DELETE", token, tryRefresh);
}

export async function listMatrix(
  token: string,
  tryRefresh: TryRefresh
): Promise<MatrixRowOut[]> {
  const r = await request<{ success: boolean; data: MatrixRowOut[] }>("/matrix", "GET", token, tryRefresh);
  return r.data ?? [];
}

export async function createMatrixRow(
  body: MatrixRowCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<MatrixRowOut> {
  const r = await request<{ success: boolean; data: MatrixRowOut }>("/matrix", "POST", token, tryRefresh, body);
  return r.data as MatrixRowOut;
}

export async function deleteMatrixRow(
  planId: string,
  nicheId: string,
  moduleId: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(
    `/matrix/${planId}/${nicheId}/${moduleId}`,
    "DELETE",
    token,
    tryRefresh
  );
}
