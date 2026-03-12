"use client";

import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/platform", labelKey: "nav.platformDashboard" },
  { href: "/platform/briefings", labelKey: "nav.briefings" },
  { href: "/admin/catalog", labelKey: "nav.catalog" },
  { href: "/platform/tenants", labelKey: "nav.tenants" },
  { href: "/platform/audit", labelKey: "nav.audit" },
  { href: "/platform/integrations", labelKey: "nav.platformIntegrations" },
  { href: "/platform/settings", labelKey: "nav.platformSettings" },
] as const;

export function PlatformSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <aside
      className="flex w-56 flex-col border-r border-gray-200 bg-white"
      aria-label="Platform sidebar"
    >
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-sm font-semibold text-gray-900">
          {t("nav.platformTitle")}
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Main">
        {NAV_ITEMS.map(({ href, labelKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
