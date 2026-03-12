import { request, type TryRefresh } from "./client";

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
  const suffix = q.toString();
  const r = await request<BlogPostOut[]>(
    `/blog/posts${suffix ? `?${suffix}` : ""}`,
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
