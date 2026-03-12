"use client";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TENANT_NAV: { href: string; labelKey: string; module?: string }[] = [
  { href: "/", labelKey: "nav.dashboard" },
  { href: "/app/properties", labelKey: "nav.properties", module: "property" },
  { href: "/app/blog", labelKey: "nav.blog", module: "blog" },
  { href: "/app/pages", labelKey: "nav.pages" },
  { href: "/app/leads", labelKey: "nav.leads", module: "leads" },
  { href: "/app/schedule", labelKey: "nav.schedule", module: "schedule" },
  { href: "/app/media", labelKey: "nav.media", module: "media" },
  { href: "/app/reviews", labelKey: "nav.reviews", module: "reviews" },
  { href: "/app/integrations", labelKey: "nav.integrations" },
  { href: "/app/settings", labelKey: "nav.settings" },
  { href: "/app/users", labelKey: "nav.users" },
  { href: "/app/billing", labelKey: "nav.billing", module: "stripe_payments" },
];

export function TenantSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { me } = useAuth();
  const enabledModules = me?.enabled_modules ?? [];

  const items = TENANT_NAV.filter((item) => {
    if (!item.module) return true;
    return enabledModules.includes(item.module);
  });

  return (
    <aside
      className="flex w-56 flex-col border-r border-gray-200 bg-white"
      aria-label="Tenant sidebar"
    >
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-sm font-semibold text-gray-900">WaaS</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Main">
        {items.map(({ href, labelKey }) => {
          const isActive =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href));
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
