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
        <h1 className="text-2xl font-bold text-primary font-heading tracking-tight">
          {t("platform.dashboardTitle")}
        </h1>

        {/* Stats */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card p-6 group">
            <div className="flex items-center justify-between">
              <h2 className="stat-label">
                {t("platform.tenantsTitle")}
              </h2>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-accent" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <p className="mt-3 stat-number">
              {tenantCount !== null ? tenantCount : "—"}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/platform/tenants"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
              >
                {t("platform.viewList")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <Link
                href="/onboarding"
                className="btn-primary text-sm py-1.5 px-3"
              >
                {t("platform.newBriefing")}
              </Link>
            </div>
          </div>

          <div className="card p-6 group">
            <div className="flex items-center justify-between">
              <h2 className="stat-label">
                {t("platform.auditTitle")}
              </h2>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-accent" aria-hidden>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
            </div>
            <p className="mt-3 stat-number">
              {auditCount !== null ? auditCount : "—"}
            </p>
            <p className="text-sm text-secondary mt-1">{t("platform.recentCount")}</p>
            <Link
              href="/platform/audit"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {t("platform.viewLog")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Quick action */}
        <div className="mt-6">
          <Link
            href="/admin/catalog"
            className="btn-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            {t("nav.catalog")}
          </Link>
        </div>
      </div>
    </PlatformLayout>
  );
}
