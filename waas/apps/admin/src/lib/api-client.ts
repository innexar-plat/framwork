/**
 * API client for WaaS backend. Uses NEXT_PUBLIC_API_URL.
 */

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type MeUser = { id: string; email: string; name: string | null };
export type MeTenant = {
  id: string;
  name: string;
  slug: string;
  plan_id: string | null;
  niche_id: string | null;
};
export type MeResponse = {
  user: MeUser;
  tenant: MeTenant | null;
  role: string | null;
  global_role: string | null;
  enabled_modules: string[];
};

export async function getMe(
  accessToken: string
): Promise<ApiResponse<MeResponse>> {
  return apiRequest<MeResponse>("/auth/me", { accessToken, method: "GET" });
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<ApiResponse<T>> {
  const { accessToken, ...init } = options;
  const url = `${getBaseUrl()}/api/v1${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }
  const res = await fetch(url, { ...init, headers });
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json;
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<TokenResponse>> {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshTokens(
  refreshToken: string
): Promise<ApiResponse<TokenResponse>> {
  return apiRequest<TokenResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function getAuthHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export type TenantListItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_id: string | null;
  niche_id: string | null;
  created_at: string;
};
export type AuditLogItem = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
};

export async function getPlatformTenants(
  accessToken: string,
  limit = 100
): Promise<ApiResponse<TenantListItem[]>> {
  return apiRequest<TenantListItem[]>(
    `/platform/tenants?limit=${limit}`,
    { accessToken, method: "GET" }
  );
}

export async function getPlatformAudit(
  accessToken: string,
  limit = 50
): Promise<ApiResponse<AuditLogItem[]>> {
  return apiRequest<AuditLogItem[]>(
    `/platform/audit?limit=${limit}`,
    { accessToken, method: "GET" }
  );
}

export type BriefingResponse = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  plan_code: string;
  niche_code: string;
  slug_requested: string | null;
  business_name: string;
  business_description: string | null;
  slogan: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  social_links: Record<string, unknown> | null;
  modules_requested: string[] | null;
  use_custom_domain: boolean;
  custom_domain_requested: string | null;
  notes: string | null;
  status: string;
  tenant_id: string | null;
  provisioned_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchBriefings(
  accessToken: string,
  params?: { status?: string; limit?: number; offset?: number }
): Promise<ApiResponse<BriefingResponse[]>> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));
  const q = search.toString();
  return apiRequest<BriefingResponse[]>(
    `/platform/briefings${q ? `?${q}` : ""}`,
    { accessToken, method: "GET" }
  );
}

export type ProvisionRequest = { briefing_id: string; override_slug?: string | null };
export type ProvisionResult = {
  tenant_id: string;
  subdomain: string;
  panel_url: string;
  admin_email: string;
};

export async function postProvision(
  accessToken: string,
  body: ProvisionRequest
): Promise<ApiResponse<ProvisionResult>> {
  return apiRequest<ProvisionResult>("/platform/provision", {
    accessToken,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ProvisionStepOut = {
  step_number: number;
  step_name: string;
  status: string;
  message: string | null;
};
export type ProvisionStatusResponse = {
  briefing_status: string;
  provisioning_status: string | null;
  tenant_id: string | null;
  steps: ProvisionStepOut[];
};

export async function getProvisionStatus(
  accessToken: string,
  briefingId: string
): Promise<ApiResponse<ProvisionStatusResponse>> {
  return apiRequest<ProvisionStatusResponse>(
    `/platform/provision/${briefingId}/status`,
    { accessToken, method: "GET" }
  );
}

export type IntegrationSection = {
  configured: boolean;
  zone_id?: string | null;
  base_domain?: string | null;
  cname_target?: string | null;
  token_masked?: string | null;
};
export type GitSection = {
  configured: boolean;
  template_owner?: string | null;
  template_repo?: string | null;
  token_masked?: string | null;
};
export type SmtpSection = {
  configured: boolean;
  host?: string | null;
  port?: number | null;
  from_address?: string | null;
  user_masked?: string | null;
};
export type DomainSection = {
  panel_base_url?: string | null;
  site_base_domain?: string | null;
};
export type PlatformIntegrationsStatus = {
  cloudflare: IntegrationSection;
  git: GitSection;
  smtp: SmtpSection;
  domain: DomainSection;
};

export async function getPlatformIntegrationsStatus(
  accessToken: string
): Promise<ApiResponse<PlatformIntegrationsStatus>> {
  return apiRequest<PlatformIntegrationsStatus>("/platform/integrations/status", {
    accessToken,
    method: "GET",
  });
}

export async function testPlatformCloudflare(
  accessToken: string
): Promise<ApiResponse<{ ok: boolean; message: string }>> {
  return apiRequest<{ ok: boolean; message: string }>(
    "/platform/integrations/test/cloudflare",
    { accessToken, method: "POST" }
  );
}

export async function testPlatformSmtp(
  accessToken: string
): Promise<ApiResponse<{ ok: boolean; message: string }>> {
  return apiRequest<{ ok: boolean; message: string }>(
    "/platform/integrations/test/smtp",
    { accessToken, method: "POST" }
  );
}
