"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
      className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface/80 backdrop-blur-sm px-6"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-primary">
          {me?.tenant ? me.tenant.name : t("home.subtitle")}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {isPlatformAdmin && (
          <Link
            href="/platform"
            className="btn-ghost text-sm py-1.5 px-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            </svg>
            {t("nav.goToPlatform")}
          </Link>
        )}
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="h-5 w-px bg-border" />
        <button
          type="button"
          onClick={handleLogout}
          className="btn-ghost text-sm py-1.5 px-3"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t("home.logout")}
        </button>
      </div>
    </header>
  );
}
