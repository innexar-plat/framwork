"use client";

import { PlatformLayout } from "@/components/admin/platform-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PlatformSettingsPage() {
  const { t } = useI18n();
  const { isAuthenticated, isPlatformAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  if (!isPlatformAdmin) {
    router.replace("/");
    return null;
  }

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("platform.settingsTitle")}
        </h1>
        <p className="mt-2 text-gray-500">Em breve.</p>
      </div>
    </PlatformLayout>
  );
}
