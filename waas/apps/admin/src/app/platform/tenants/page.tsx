"use client";

import { PlatformLayout } from "@/components/admin/platform-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { getPlatformTenants } from "@/lib/api-client";
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
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("platform.tenantsTitle")}
        </h1>
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : tenants.length === 0 ? (
          <p className="mt-4 text-gray-500">{t("platform.noTenants")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {tenants.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded border border-gray-200 bg-white px-4 py-2"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-gray-500">{t.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PlatformLayout>
  );
}
