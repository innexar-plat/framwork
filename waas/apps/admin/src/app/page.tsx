"use client";

import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  listBlogPosts,
  listLeads,
  listPropertyItems,
  listScheduleItems,
} from "@/lib/tenant-api";
import type { BlogPostOut, LeadOut, ScheduleItemOut } from "@/lib/tenant-api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type DashboardData = {
  leads: LeadOut[];
  leadsTotal: number;
  propertiesTotal: number;
  posts: BlogPostOut[];
  scheduleItems: ScheduleItemOut[];
};

export default function Home() {
  const { t } = useI18n();
  const { isAuthenticated, isPlatformAdmin, hasTenant, getAccessToken, tryRefresh } =
    useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isPlatformAdmin && !hasTenant) {
      router.replace("/platform");
    }
  }, [isAuthenticated, isPlatformAdmin, hasTenant, router]);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const [leads, properties, posts, scheduleItems] = await Promise.allSettled([
        listLeads(token, tryRefresh, { limit: 5 }),
        listPropertyItems(token, tryRefresh, { limit: 100 }),
        listBlogPosts(token, tryRefresh, { limit: 5 }),
        listScheduleItems(token, tryRefresh, { limit: 5 }),
      ]);
      const leadsList = leads.status === "fulfilled" ? leads.value : [];
      const propsList = properties.status === "fulfilled" ? properties.value : [];
      const postsList = posts.status === "fulfilled" ? posts.value : [];
      const scheduleList =
        scheduleItems.status === "fulfilled" ? scheduleItems.value : [];
      setData({
        leads: leadsList,
        leadsTotal: leadsList.length,
        propertiesTotal: Array.isArray(propsList) ? propsList.length : 0,
        posts: postsList,
        scheduleItems: scheduleList,
      });
    } catch {
      setData({
        leads: [],
        leadsTotal: 0,
        propertiesTotal: 0,
        posts: [],
        scheduleItems: [],
      });
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, tryRefresh]);

  useEffect(() => {
    if (isAuthenticated && hasTenant && !isPlatformAdmin) {
      load();
    }
  }, [isAuthenticated, hasTenant, isPlatformAdmin, load]);

  if (!isAuthenticated) return null;
  if (isPlatformAdmin && !hasTenant) return null;

  return (
    <TenantLayout>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-primary font-heading tracking-tight">
          {t("home.title")}
        </h1>
        <p className="mt-1 text-secondary">{t("home.subtitle")}</p>

        {loading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-secondary">
            <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("common.loading")}
          </div>
        )}

        {!loading && data && (
          <section className="mt-8" aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="text-lg font-semibold text-primary font-heading">
              {t("dashboard.overview")}
            </h2>

            {/* Stats Grid */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t("dashboard.leads"), value: data.leadsTotal, href: "/app/leads", icon: "👥" },
                { label: t("dashboard.properties"), value: data.propertiesTotal, href: "/app/properties", icon: "🏠" },
                { label: t("dashboard.posts"), value: data.posts.length, href: "/app/blog", icon: "✍️" },
                { label: t("dashboard.schedule"), value: data.scheduleItems.length, href: "/app/schedule", icon: "📅" },
              ].map(({ label, value, href, icon }) => (
                <div key={href} className="card p-5 group">
                  <div className="flex items-center justify-between">
                    <h3 className="stat-label">{label}</h3>
                    <span className="text-xl">{icon}</span>
                  </div>
                  <p className="mt-2 stat-number">{value}</p>
                  <Link
                    href={href}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
                  >
                    {t("dashboard.viewAll")}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>

            {/* Bottom Section */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-primary font-heading">
                  {t("dashboard.quickActions")}
                </h3>
                <p className="mt-2 text-sm text-secondary">
                  {t("dashboard.goToCatalog")}
                </p>
                <Link
                  href="/admin/catalog"
                  className="btn-primary mt-4 text-sm py-2"
                >
                  {t("nav.catalog")}
                </Link>
              </div>
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-primary font-heading">
                  {t("dashboard.recentActivity")}
                </h3>
                {data.leads.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {data.leads.slice(0, 3).map((lead) => (
                      <li key={lead.id} className="flex items-center gap-2 text-sm text-secondary">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        {lead.name || lead.email}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    {t("dashboard.noActivity")}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </TenantLayout>
  );
}
