import { request, type TryRefresh } from "./client";

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
  return request<TenantSettingsOut>("/tenant/settings", "PATCH", token, tryRefresh, body);
}
