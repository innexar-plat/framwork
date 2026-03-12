"use client";

import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { TenantSettingsOut, TenantSettingsUpdate } from "@/lib/tenant-api";
import { getTenantSettings, updateTenantSettings } from "@/lib/tenant-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AppSettingsPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<TenantSettingsOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TenantSettingsUpdate>({});

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTenantSettings(token, tryRefresh);
      setData(res);
      setForm({
        name: res.name,
        logo_url: res.logo_url ?? undefined,
        favicon_url: res.favicon_url ?? undefined,
        primary_color: res.primary_color ?? undefined,
        footer_text: res.footer_text ?? undefined,
        timezone: res.timezone ?? undefined,
        meta_title: res.meta_title ?? undefined,
        meta_description: res.meta_description ?? undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, tryRefresh]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
    if (isAuthenticated && !hasTenant) router.replace("/");
  }, [isAuthenticated, hasTenant, router]);

  useEffect(() => {
    if (isAuthenticated && hasTenant) load();
  }, [isAuthenticated, hasTenant, load]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    updateTenantSettings(form, token, tryRefresh)
      .then((res) => {
        setData(res);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setSaving(false));
  };

  if (!isAuthenticated) return null;
  if (hasTenant === false) return null;

  return (
    <TenantLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("nav.settings")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("settings.siteSettings")}
        </p>
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : data ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("settings.siteName")}
              </label>
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("settings.logoUrl")}
              </label>
              <input
                type="url"
                value={form.logo_url ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, logo_url: e.target.value || undefined }))
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("settings.metaTitle")}
              </label>
              <input
                type="text"
                value={form.meta_title ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    meta_title: e.target.value || undefined,
                  }))
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("settings.metaDescription")}
              </label>
              <textarea
                value={form.meta_description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    meta_description: e.target.value || undefined,
                  }))
                }
                rows={2}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? t("common.loading") : t("common.save")}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </TenantLayout>
  );
}
