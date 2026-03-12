"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminHeader() {
  const { t } = useI18n();
  const { logout } = useAuth();
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
      <div className="flex flex-1 justify-end items-center gap-3">
        <LanguageSwitcher />
        <Link
          href="/admin/catalog"
          className="btn-ghost text-sm py-1.5 px-3"
        >
          {t("home.catalogAdmin")}
        </Link>
        <ThemeToggle />
        <div className="h-5 w-px bg-border" />
        <button
          type="button"
          onClick={handleLogout}
          className="btn-ghost text-sm py-1.5 px-3"
        >
          {t("home.logout")}
        </button>
      </div>
    </header>
  );
}
