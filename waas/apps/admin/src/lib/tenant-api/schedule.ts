import { request, type TryRefresh } from "./client";

export type ScheduleItemOut = {
  id: string;
  tenant_id: string;
  title: string;
  start_at: string;
  end_at: string;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
};

export type ScheduleItemCreate = {
  title: string;
  start_at: string;
  end_at: string;
  status?: string;
  contact_name?: string | null;
  contact_email?: string | null;
  notes?: string | null;
};

export type ScheduleItemUpdate = Partial<ScheduleItemCreate>;

export async function listScheduleItems(
  token: string,
  tryRefresh: TryRefresh,
  params?: {
    start_from?: string;
    end_before?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ScheduleItemOut[]> {
  const q = new URLSearchParams();
  if (params?.start_from) q.set("start_from", params.start_from);
  if (params?.end_before) q.set("end_before", params.end_before);
  if (params?.status) q.set("status", params.status);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const suffix = q.toString();
  const r = await request<ScheduleItemOut[]>(
    `/schedule/items${suffix ? `?${suffix}` : ""}`,
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}

export async function getScheduleItem(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<ScheduleItemOut> {
  return request<ScheduleItemOut>(`/schedule/items/${id}`, "GET", token, tryRefresh);
}

export async function createScheduleItem(
  body: ScheduleItemCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<ScheduleItemOut> {
  return request<ScheduleItemOut>("/schedule/items", "POST", token, tryRefresh, body);
}

export async function updateScheduleItem(
  id: string,
  body: ScheduleItemUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<ScheduleItemOut> {
  return request<ScheduleItemOut>(`/schedule/items/${id}`, "PATCH", token, tryRefresh, body);
}

export async function deleteScheduleItem(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/schedule/items/${id}`, "DELETE", token, tryRefresh);
}
