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
        <h1 className="font-bold text-2xl text-[#e8eaf0]">
          {t("platform.settingsTitle")}
        </h1>
        <div className="mt-6 rounded-xl border border-[#1e2230] bg-[#111318] p-8">
          <p className="text-[#8892a4]">{t("payments.comingSoon")}</p>
        </div>
      </div>
    </PlatformLayout>
  );
}
