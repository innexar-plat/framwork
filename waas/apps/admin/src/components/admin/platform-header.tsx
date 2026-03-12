"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PlatformHeader() {
  const { t } = useI18n();
  const { logout, hasTenant } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-[#1e2230] bg-[#111318] px-6"
      role="banner"
    >
      <div className="flex flex-1 items-center justify-end gap-4">
        {hasTenant && (
          <Link
            href="/"
            className="text-sm font-medium text-[#8892a4] hover:text-[#e8eaf0]"
          >
            {t("nav.goToWorkspace")}
          </Link>
        )}
        <LanguageSwitcher variant="dark" />
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-[#8892a4] hover:text-[#e8eaf0]"
        >
          {t("home.logout")}
        </button>
      </div>
    </header>
  );
}
