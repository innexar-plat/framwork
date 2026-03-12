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
        <h1 className="font-bold text-2xl text-[#e8eaf0]">
          {t("platform.dashboardTitle")}
        </h1>
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#1e2230] bg-[#111318] p-5">
            <h2 className="text-sm font-medium text-[#8892a4]">
              {t("platform.tenantsTitle")}
            </h2>
            <p className="mt-2 font-semibold text-2xl text-[#e8eaf0]">
              {tenantCount !== null ? tenantCount : "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/platform/tenants"
                className="text-sm font-medium text-[#4f6ef7] hover:text-[#6b8cff]"
              >
                {t("platform.viewList")} →
              </Link>
              <Link
                href="/onboarding"
                className="rounded-lg bg-[#4f6ef7] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#3d5ce4]"
              >
                {t("platform.newBriefing")}
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-[#1e2230] bg-[#111318] p-5">
            <h2 className="text-sm font-medium text-[#8892a4]">
              {t("platform.auditTitle")}
            </h2>
            <p className="mt-2 font-semibold text-2xl text-[#e8eaf0]">
              {t("platform.recentCount")}: {auditCount !== null ? auditCount : "—"}
            </p>
            <Link
              href="/platform/audit"
              className="mt-2 inline-block text-sm font-medium text-[#4f6ef7] hover:text-[#6b8cff]"
            >
              {t("platform.viewLog")} →
            </Link>
          </div>
        </section>
        <div className="mt-6">
          <Link
            href="/admin/catalog"
            className="inline-block rounded-lg border border-[#252a38] bg-[#181b23] px-4 py-2 text-sm font-medium text-[#e8eaf0] hover:bg-[#1e2230]"
          >
            {t("nav.catalog")}
          </Link>
        </div>
      </div>
    </PlatformLayout>
  );
}
