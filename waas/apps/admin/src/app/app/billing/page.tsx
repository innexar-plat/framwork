"use client";

import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppBillingPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
    if (isAuthenticated && !hasTenant) router.replace("/");
  }, [isAuthenticated, hasTenant, router]);

  if (!isAuthenticated) return null;

  return (
    <TenantLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("nav.billing")}
        </h1>
        <p className="mt-2 text-gray-500">Em breve.</p>
      </div>
    </TenantLayout>
  );
}
