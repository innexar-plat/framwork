"use client";

import { PlatformLayout } from "@/components/admin/platform-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { getPlatformAudit } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlatformAuditPage() {
  const { t } = useI18n();
  const { isAuthenticated, isPlatformAdmin, getAccessToken, tryRefresh } =
    useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<
    { id: string; action: string; entity_type: string; created_at: string }[]
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
        const res = await getPlatformAudit(token, 50);
        if (res.success && res.data) setEntries(res.data);
      } catch {
        const newToken = await tryRefresh();
        if (newToken) {
          const res = await getPlatformAudit(newToken, 50);
          if (res.success && res.data) setEntries(res.data);
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
          {t("platform.auditTitle")}
        </h1>
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : entries.length === 0 ? (
          <p className="mt-4 text-gray-500">{t("platform.noAudit")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className="rounded border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                <span className="font-medium">{e.action}</span> — {e.entity_type}{" "}
                <span className="text-gray-500">{e.created_at}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PlatformLayout>
  );
}
