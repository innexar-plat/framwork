function getBaseUrl(): string {
  return typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    : "http://localhost:8000";
}

export type TryRefresh = () => Promise<string | null>;

type ApiResponse<T> = { success: boolean; data: T | null; error: string | null };

async function request<T>(
  path: string,
  method: string,
  token: string,
  tryRefresh: TryRefresh,
  body?: unknown
): Promise<T> {
  const url = `${getBaseUrl()}/api/v1${path}`;
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

  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  if (json.data === null) throw new Error(json.error ?? "No data");
  return json.data as T;
}

export { getBaseUrl, request };
