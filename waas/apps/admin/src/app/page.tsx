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
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("home.title")}
        </h1>
        <p className="mt-1 text-gray-600">{t("home.subtitle")}</p>

        {loading && (
          <p className="mt-4 text-sm text-gray-500">{t("common.loading")}</p>
        )}

        {!loading && data && (
          <section className="mt-8" aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="text-lg font-medium text-gray-900">
              {t("dashboard.overview")}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600">
                  {t("dashboard.leads")}
                </h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {data.leadsTotal}
                </p>
                {data.leads.length > 0 && (
                  <Link
                    href="/app/leads"
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    {t("dashboard.viewAll")}
                  </Link>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600">
                  {t("dashboard.properties")}
                </h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {data.propertiesTotal}
                </p>
                <Link
                  href="/app/properties"
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  {t("dashboard.viewAll")}
                </Link>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600">
                  {t("dashboard.posts")}
                </h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {data.posts.length}
                </p>
                {data.posts.length > 0 && (
                  <Link
                    href="/app/blog"
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    {t("dashboard.viewAll")}
                  </Link>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600">
                  {t("dashboard.schedule")}
                </h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {data.scheduleItems.length}
                </p>
                {data.scheduleItems.length > 0 && (
                  <Link
                    href="/app/schedule"
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    {t("dashboard.viewAll")}
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-900">
                  {t("dashboard.quickActions")}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {t("dashboard.goToCatalog")}
                </p>
                <Link
                  href="/admin/catalog"
                  className="mt-3 inline-block rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  {t("nav.catalog")}
                </Link>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-900">
                  {t("dashboard.recentActivity")}
                </h3>
                {data.leads.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
                    {data.leads.slice(0, 3).map((lead) => (
                      <li key={lead.id}>{lead.name || lead.email}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
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
