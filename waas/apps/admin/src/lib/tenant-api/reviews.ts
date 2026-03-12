import { request, type TryRefresh } from "./client";

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
  const suffix = q.toString();
  const r = await request<ReviewResponse[]>(
    `/reviews${suffix ? `?${suffix}` : ""}`,
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
