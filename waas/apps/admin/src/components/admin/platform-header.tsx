"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
      className="flex h-16 shrink-0 items-center justify-end gap-3 border-b border-border bg-surface/80 backdrop-blur-sm px-6"
      role="banner"
    >
      <div className="flex flex-1 items-center justify-end gap-3">
        {hasTenant && (
          <Link
            href="/"
            className="btn-ghost text-sm py-1.5 px-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {t("nav.goToWorkspace")}
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
