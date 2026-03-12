"use client";

import { CatalogMatrixSection } from "@/app/admin/catalog/catalog-matrix-section";
import { CatalogModulesSection } from "@/app/admin/catalog/catalog-modules-section";
import { CatalogNichesSection } from "@/app/admin/catalog/catalog-niches-section";
import { CatalogPlansSection } from "@/app/admin/catalog/catalog-plans-section";
import { PlatformLayout } from "@/components/admin/platform-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CatalogAdminPage() {
  const { t } = useI18n();
  const { isAuthenticated, isPlatformAdmin, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
    if (isAuthenticated && !isPlatformAdmin) router.replace("/");
  }, [isAuthenticated, isPlatformAdmin, router]);

  if (!isAuthenticated) return null;
  if (!isPlatformAdmin) return null;

  const token = getAccessToken();
  if (!token) {
    return (
      <PlatformLayout>
        <p className="text-[#8892a4]">{t("common.loading")}</p>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="font-bold text-2xl text-[#e8eaf0]">
          {t("catalog.matrix")}
        </h1>
        <p className="mt-1 text-[#8892a4]">
          {t("catalog.plans")}, {t("catalog.niches")}, {t("catalog.modules")}
        </p>
        <div className="mt-6 space-y-8">
          <CatalogPlansSection getAccessToken={getAccessToken} tryRefresh={tryRefresh} />
          <CatalogNichesSection getAccessToken={getAccessToken} tryRefresh={tryRefresh} />
          <CatalogModulesSection getAccessToken={getAccessToken} tryRefresh={tryRefresh} />
          <CatalogMatrixSection getAccessToken={getAccessToken} tryRefresh={tryRefresh} />
        </div>
      </div>
    </PlatformLayout>
  );
}
