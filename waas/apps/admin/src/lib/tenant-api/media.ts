import { getBaseUrl, request, type TryRefresh } from "./client";

type ApiResponse<T> = { success: boolean; data: T | null; error: string | null };

export type MediaItemOut = {
  id: string;
  tenant_id: string;
  name: string;
  storage_key: string;
  mime_type: string | null;
  size_bytes: number | null;
};

export type MediaItemCreate = {
  name: string;
  storage_key: string;
  mime_type?: string | null;
  size_bytes?: number | null;
};

export async function listMediaItems(
  token: string,
  tryRefresh: TryRefresh,
  params?: { limit?: number; offset?: number }
): Promise<MediaItemOut[]> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const suffix = q.toString();
  const r = await request<MediaItemOut[]>(
    `/media/items${suffix ? `?${suffix}` : ""}`,
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}

export async function getMediaItem(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<MediaItemOut> {
  return request<MediaItemOut>(`/media/items/${id}`, "GET", token, tryRefresh);
}

export async function createMediaItem(
  body: MediaItemCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<MediaItemOut> {
  return request<MediaItemOut>("/media/items", "POST", token, tryRefresh, body);
}

export async function deleteMediaItem(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/media/items/${id}`, "DELETE", token, tryRefresh);
}

export async function uploadMediaFile(
  file: File,
  token: string,
  tryRefresh: TryRefresh
): Promise<MediaItemOut> {
  const url = `${getBaseUrl()}/api/v1/media/upload`;
  const formData = new FormData();
  formData.append("file", file);

  let res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${newToken}` },
        body: formData,
      });
    }
  }

  if (res.status === 204) return undefined as unknown as MediaItemOut;

  const json = (await res.json()) as ApiResponse<MediaItemOut>;
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  if (json.data === null) throw new Error(json.error ?? "No data");
  return json.data;
}
