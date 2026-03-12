"use client";

import { getPlatformAudit, getPlatformTenants } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { PlatformLayout } from "@/components/admin/platform-layout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlatformDashboardPage() {
  const { t } = useI18n();
  const { isAuthenticated, isPlatformAdmin, getAccessToken, tryRefresh } =
    useAuth();
  const router = useRouter();
  const [tenantCount, setTenantCount] = useState<number | null>(null);
  const [auditCount, setAuditCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    const token = getAccessToken();
    if (!token) return;
    const run = async () => {
      try {
        const [tRes, aRes] = await Promise.all([
          getPlatformTenants(token).catch(() => null),
          getPlatformAudit(token, 5).catch(() => null),
        ]);
        if (tRes?.success && tRes.data) setTenantCount(tRes.data.length);
        if (aRes?.success && aRes.data) setAuditCount(aRes.data.length);
      } catch {
        const newToken = await tryRefresh();
        if (newToken) {
          const [tRes, aRes] = await Promise.all([
            getPlatformTenants(newToken).catch(() => null),
            getPlatformAudit(newToken, 5).catch(() => null),
          ]);
          if (tRes?.success && tRes.data) setTenantCount(tRes.data.length);
          if (aRes?.success && aRes.data) setAuditCount(aRes.data.length);
        }
      }
    };
    run();
  }, [isPlatformAdmin, getAccessToken, tryRefresh]);

  if (!isAuthenticated) return null;
  if (!isPlatformAdmin) {
    router.replace("/");
    return null;
  }

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("platform.dashboardTitle")}
        </h1>
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-gray-900">
              {t("platform.tenantsTitle")}
            </h2>
            <p className="mt-2 text-2xl font-semibold text-gray-700">
              {tenantCount !== null ? tenantCount : "—"}
            </p>
            <Link
              href="/platform/tenants"
              className="mt-2 inline-block text-sm text-gray-600 hover:text-gray-900"
            >
              {t("platform.viewList")} →
            </Link>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-gray-900">
              {t("platform.auditTitle")}
            </h2>
            <p className="mt-2 text-2xl font-semibold text-gray-700">
              {t("platform.recentCount")}: {auditCount !== null ? auditCount : "—"}
            </p>
            <Link
              href="/platform/audit"
              className="mt-2 inline-block text-sm text-gray-600 hover:text-gray-900"
            >
              {t("platform.viewLog")} →
            </Link>
          </div>
        </section>
        <div className="mt-6">
          <Link
            href="/admin/catalog"
            className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {t("nav.catalog")}
          </Link>
        </div>
      </div>
    </PlatformLayout>
  );
}
