"use client";

import { PlatformLayout } from "@/components/admin/platform-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { getPlatformTenants } from "@/lib/api-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlatformTenantsPage() {
  const { t } = useI18n();
  const { isAuthenticated, isPlatformAdmin, getAccessToken, tryRefresh } =
    useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<
    { id: string; name: string; slug: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    const token = getAccessToken();
    if (!token) return;
    const run = async () => {
      setLoading(true);
      try {
        const res = await getPlatformTenants(token);
        if (res.success && res.data) setTenants(res.data);
      } catch {
        const newToken = await tryRefresh();
        if (newToken) {
          const res = await getPlatformTenants(newToken);
          if (res.success && res.data) setTenants(res.data);
        }
      } finally {
        setLoading(false);
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
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-bold text-2xl text-[#e8eaf0]">
            {t("platform.tenantsTitle")}
          </h1>
          <Link
            href="/onboarding"
            className="rounded-lg bg-[#4f6ef7] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d5ce4]"
          >
            {t("platform.newBriefing")}
          </Link>
        </div>
        {loading ? (
          <p className="mt-4 text-[#8892a4]">{t("common.loading")}</p>
        ) : tenants.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[#1e2230] bg-[#111318] p-8 text-center">
            <p className="text-[#8892a4]">{t("platform.noTenants")}</p>
            <p className="mt-2 text-sm text-[#4a5568]">
              {t("platform.noTenantsHint")}
            </p>
            <Link
              href="/onboarding"
              className="mt-4 inline-block rounded-lg bg-[#4f6ef7] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d5ce4]"
            >
              {t("platform.newBriefing")}
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {tenants.map((tenant) => (
              <li
                key={tenant.id}
                className="flex items-center justify-between rounded-xl border border-[#1e2230] bg-[#111318] px-4 py-3"
              >
                <span className="font-medium text-[#e8eaf0]">{tenant.name}</span>
                <span className="text-sm text-[#8892a4]">{tenant.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PlatformLayout>
  );
}
