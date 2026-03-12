"use client";

import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    labelKey: "nav.dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/catalog",
    labelKey: "nav.catalog",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="16" y2="10" />
      </svg>
    ),
  },
] as const;

export function AdminSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <aside
      className="flex w-60 flex-col border-r border-border sidebar-glass"
      aria-label="Sidebar"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" aria-hidden>
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          </svg>
        </div>
        <span className="text-sm font-bold text-primary tracking-tight">WaaS Admin</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {NAV_ITEMS.map(({ href, labelKey, icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${
                isActive ? "nav-item-active" : "nav-item-inactive"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="shrink-0 [&>svg]:text-current">
                {icon}
              </span>
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
