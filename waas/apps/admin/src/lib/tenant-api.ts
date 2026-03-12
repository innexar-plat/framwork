/**
 * Tenant-scoped API client (property, blog, leads, schedule, media).
 * All requests use Bearer token and retry on 401.
 */

function getBaseUrl(): string {
  return typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    : "http://localhost:8000";
}

type TryRefresh = () => Promise<string | null>;

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

// --- Property ---
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
  const r = await request<PropertyItemOut[]>(
    `/property/items?${q.toString()}`,
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

// --- Tenant settings ---
export type TenantSettingsOut = {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  footer_text: string | null;
  timezone: string | null;
  meta_title: string | null;
  meta_description: string | null;
};
export type TenantSettingsUpdate = Partial<
  Pick<
    TenantSettingsOut,
    | "name"
    | "logo_url"
    | "favicon_url"
    | "primary_color"
    | "footer_text"
    | "timezone"
    | "meta_title"
    | "meta_description"
  >
>;

export async function getTenantSettings(
  token: string,
  tryRefresh: TryRefresh
): Promise<TenantSettingsOut> {
  return request<TenantSettingsOut>("/tenant/settings", "GET", token, tryRefresh);
}

export async function updateTenantSettings(
  body: TenantSettingsUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<TenantSettingsOut> {
  return request<TenantSettingsOut>(
    "/tenant/settings",
    "PATCH",
    token,
    tryRefresh,
    body
  );
}

// --- Blog ---
export type BlogPostOut = {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  meta_title?: string | null;
  meta_description?: string | null;
};
export type BlogPostCreate = {
  title: string;
  slug: string;
  content?: string | null;
  status?: string;
  meta_title?: string | null;
  meta_description?: string | null;
};
export type BlogPostUpdate = {
  title?: string | null;
  slug?: string | null;
  content?: string | null;
  status?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

export async function listBlogPosts(
  token: string,
  tryRefresh: TryRefresh,
  params?: { status?: string; limit?: number; offset?: number }
): Promise<BlogPostOut[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const r = await request<BlogPostOut[]>(
    `/blog/posts?${q.toString()}`,
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}

export async function getBlogPost(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<BlogPostOut> {
  return request<BlogPostOut>(`/blog/posts/${id}`, "GET", token, tryRefresh);
}

export async function createBlogPost(
  body: BlogPostCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<BlogPostOut> {
  return request<BlogPostOut>("/blog/posts", "POST", token, tryRefresh, body);
}

export async function updateBlogPost(
  id: string,
  body: BlogPostUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<BlogPostOut> {
  return request<BlogPostOut>(`/blog/posts/${id}`, "PATCH", token, tryRefresh, body);
}

export async function deleteBlogPost(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/blog/posts/${id}`, "DELETE", token, tryRefresh);
}

// --- Leads ---
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
  const r = await request<LeadOut[]>(`/leads?${q.toString()}`, "GET", token, tryRefresh);
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

// --- Schedule ---
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
  const r = await request<ScheduleItemOut[]>(
    `/schedule/items?${q.toString()}`,
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

// --- Media ---
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
  const r = await request<MediaItemOut[]>(
    `/media/items?${q.toString()}`,
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

// --- Payments (Stripe products, read-only) ---
export type StripeProductOut = {
  id: string;
  tenant_id: string;
  stripe_product_id: string;
  stripe_price_id: string;
  name: string;
  amount_cents: number;
  currency: string;
  interval: string;
  created_at: string;
  updated_at: string;
};

export async function listPaymentProducts(
  token: string,
  tryRefresh: TryRefresh,
  params?: { limit?: number; offset?: number }
): Promise<StripeProductOut[]> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const r = await request<StripeProductOut[]>(
    `/payments/products?${q.toString()}`,
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}

// --- Reviews ---
export interface ReviewResponse {
  id: string;
  tenant_id: string;
  author_name: string;
  author_photo: string | null;
  rating: number;
  text: string;
  source: "manual" | "google";
  google_review_id: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
export interface ReviewCreate {
  author_name: string;
  rating: number;
  text: string;
  author_photo?: string;
  source?: "manual" | "google";
}
export interface ReviewUpdate {
  author_name?: string;
  rating?: number;
  text?: string;
  author_photo?: string;
  is_published?: boolean;
  sort_order?: number;
}

export async function listReviews(
  token: string,
  tryRefresh: TryRefresh,
  params?: { published?: boolean }
): Promise<ReviewResponse[]> {
  const q = new URLSearchParams();
  if (params?.published === true) q.set("published", "true");
  if (params?.published === false) q.set("published", "false");
  const r = await request<ReviewResponse[]>(
    `/reviews?${q.toString()}`,
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}

export async function createReview(
  data: ReviewCreate,
  token: string,
  tryRefresh: TryRefresh
): Promise<ReviewResponse> {
  return request<ReviewResponse>("/reviews", "POST", token, tryRefresh, data);
}

export async function updateReview(
  id: string,
  data: ReviewUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/reviews/${id}`, "PATCH", token, tryRefresh, data);
}

export async function deleteReview(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/reviews/${id}`, "DELETE", token, tryRefresh);
}

export async function reorderReviews(
  ids: string[],
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>("/reviews/reorder", "POST", token, tryRefresh, { ids });
}

// --- Site pages ---
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
  const r = await request<SitePageOut[]>(
    `/tenant/pages?${q.toString()}`,
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
  return request<SitePageOut>(
    `/tenant/pages/${id}`,
    "PATCH",
    token,
    tryRefresh,
    body
  );
}

export async function deleteSitePage(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/tenant/pages/${id}`, "DELETE", token, tryRefresh);
}

// --- Tenant members ---
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
  const r = await request<TenantMemberOut[]>(
    "/tenant/users",
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}

export async function inviteTenantMember(
  body: TenantMemberInvite,
  token: string,
  tryRefresh: TryRefresh
): Promise<TenantMemberOut> {
  return request<TenantMemberOut>(
    "/tenant/users",
    "POST",
    token,
    tryRefresh,
    body
  );
}

export async function updateTenantMemberRole(
  id: string,
  body: TenantMemberRoleUpdate,
  token: string,
  tryRefresh: TryRefresh
): Promise<TenantMemberOut> {
  return request<TenantMemberOut>(
    `/tenant/users/${id}`,
    "PATCH",
    token,
    tryRefresh,
    body
  );
}

export async function removeTenantMember(
  id: string,
  token: string,
  tryRefresh: TryRefresh
): Promise<void> {
  await request<unknown>(`/tenant/users/${id}`, "DELETE", token, tryRefresh);
}
