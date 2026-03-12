"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function TenantHeader() {
  const { t } = useI18n();
  const { logout, isPlatformAdmin, me } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6"
      role="banner"
    >
      <span className="text-sm font-medium text-gray-700">
        {me?.tenant ? me.tenant.name : t("home.subtitle")}
      </span>
      <div className="flex items-center gap-4">
        {isPlatformAdmin && (
          <Link
            href="/platform"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {t("nav.goToPlatform")}
          </Link>
        )}
        <LanguageSwitcher />
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          {t("home.logout")}
        </button>
      </div>
    </header>
  );
}
