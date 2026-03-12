import { request, type TryRefresh } from "./client";

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
  const suffix = q.toString();
  const r = await request<StripeProductOut[]>(
    `/payments/products${suffix ? `?${suffix}` : ""}`,
    "GET",
    token,
    tryRefresh
  );
  return Array.isArray(r) ? r : [];
}
