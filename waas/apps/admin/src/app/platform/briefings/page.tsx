"use client";

import { PlatformLayout } from "@/components/admin/platform-layout";
import {
  fetchBriefings,
  postProvision,
  type BriefingResponse,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "provisioning", label: "Provisioning" },
  { value: "provisioned", label: "Provisioned" },
  { value: "failed", label: "Failed" },
] as const;

const PLAN_CLASS: Record<string, string> = {
  starter: "bg-[rgba(6,182,212,0.1)] text-[#06b6d4]",
  pro: "bg-[rgba(79,110,247,0.1)] text-[#4f6ef7]",
  enterprise: "bg-[rgba(124,58,237,0.1)] text-[#a78bfa]",
};

function planChipClass(planCode: string): string {
  const key = planCode?.toLowerCase() ?? "";
  return PLAN_CLASS[key] ?? "bg-[#181b23] text-[#8892a4]";
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]";
    case "provisioning":
      return "bg-[rgba(79,110,247,0.12)] text-[#4f6ef7] animate-pulse";
    case "provisioned":
      return "bg-[rgba(16,185,129,0.12)] text-[#10b981]";
    case "failed":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444]";
    default:
      return "bg-[#181b23] text-[#8892a4]";
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function PlatformBriefingsPage() {
  const { t } = useI18n();
  const { isAuthenticated, isPlatformAdmin, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [briefings, setBriefings] = useState<BriefingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [provisionModal, setProvisionModal] = useState<BriefingResponse | null>(null);
  const [provisionSlug, setProvisionSlug] = useState("");
  const [provisioning, setProvisioning] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchBriefings(token, {
        status: statusFilter || undefined,
        limit: 200,
      });
      if (res.success && res.data) setBriefings(res.data);
    } catch {
      const newToken = await tryRefresh();
      if (newToken) {
        const res = await fetchBriefings(newToken, {
          status: statusFilter || undefined,
          limit: 200,
        });
        if (res.success && res.data) setBriefings(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, tryRefresh, statusFilter]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    load();
  }, [isPlatformAdmin, load]);

  const openProvisionModal = (b: BriefingResponse) => {
    setProvisionModal(b);
    setProvisionSlug(b.slug_requested?.trim() || b.business_name.toLowerCase().replace(/\s+/g, "-").slice(0, 50) || "site");
  };

  const runProvision = async () => {
    if (!provisionModal) return;
    const token = getAccessToken();
    if (!token) return;
    setProvisioning(true);
    try {
      const res = await postProvision(token, {
        briefing_id: provisionModal.id,
        override_slug: provisionSlug.trim() || null,
      });
      if (res.success) {
        setProvisionModal(null);
        router.push(`/platform/provision/${provisionModal.id}`);
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProvisioning(false);
    }
  };

  const filtered = briefings.filter((b: BriefingResponse) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.client_name.toLowerCase().includes(q) ||
      b.client_email.toLowerCase().includes(q) ||
      b.business_name.toLowerCase().includes(q)
    );
  });

  const pendingCount = briefings.filter((b: BriefingResponse) => b.status === "pending").length;

  if (!isAuthenticated) return null;
  if (!isPlatformAdmin) {
    router.replace("/");
    return null;
  }

  return (
    <PlatformLayout>
      <div className="min-h-full bg-[#0a0b0f] text-[#e8eaf0]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1e2230] bg-[#111318] px-6 py-4">
          <h1 className="font-['Syne',sans-serif] text-[17px] font-bold">
            {t("nav.briefings")}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2">
              <svg className="h-4 w-4 text-[#8892a4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder={t("briefings.searchPlaceholder")}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="w-48 bg-transparent text-sm text-[#e8eaf0] outline-none placeholder:text-[#4a5568]"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 flex gap-1 border-b border-[#1e2230]">
            {STATUS_TABS.map(({ value, label }) => (
              <button
                key={value || "all"}
                onClick={() => setStatusFilter(value)}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === value
                    ? "border-[#4f6ef7] text-[#4f6ef7]"
                    : "border-transparent text-[#8892a4] hover:text-[#e8eaf0]"
                }`}
              >
                {label}
                {value === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-[#4f6ef7] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-[#1e2230] bg-[#111318]">
            {loading ? (
              <div className="p-12 text-center text-[#8892a4]">{t("common.loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                <p className="text-[#8892a4]">{t("briefings.noBriefingsFound")}</p>
                <Link
                  href="/onboarding"
                  className="rounded-lg bg-[#4f6ef7] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d5ce4]"
                >
                  {t("briefings.createBriefing")}
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-[#1e2230] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">
                        Client
                      </th>
                      <th className="border-b border-[#1e2230] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">
                        Plan
                      </th>
                      <th className="border-b border-[#1e2230] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">
                        Niche
                      </th>
                      <th className="border-b border-[#1e2230] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">
                        Modules
                      </th>
                      <th className="border-b border-[#1e2230] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">
                        Status
                      </th>
                      <th className="border-b border-[#1e2230] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">
                        Created
                      </th>
                      <th className="border-b border-[#1e2230] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-[#1e2230] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3">
                          <div className="font-medium">{b.client_name}</div>
                          <div className="text-xs text-[#4a5568]">{b.client_email}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${planChipClass(b.plan_code)}`}
                          >
                            {b.plan_code}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded bg-[#181b23] px-2.5 py-1 text-[11px] font-medium text-[#8892a4]">
                            {b.niche_code}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(b.modules_requested ?? []).slice(0, 3).map((m: string) => (
                              <span
                                key={m}
                                className="rounded bg-[rgba(79,110,247,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#4f6ef7]"
                              >
                                {m}
                              </span>
                            ))}
                            {(b.modules_requested?.length ?? 0) > 3 && (
                              <span className="text-[11px] text-[#4a5568]">+{(b.modules_requested?.length ?? 0) - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(b.status)}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {b.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-[#8892a4]">
                          {formatDate(b.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          {b.status === "pending" && (
                            <button
                              onClick={() => openProvisionModal(b)}
                              className="rounded-md bg-[#10b981] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0d9668]"
                            >
                              Provision
                            </button>
                          )}
                          {b.status === "provisioning" && (
                            <Link
                              href={`/platform/provision/${b.id}`}
                              className="inline-block rounded-md border border-[#252a38] bg-transparent px-3 py-1.5 text-xs font-medium text-[#8892a4] hover:bg-[#181b23] hover:text-[#e8eaf0]"
                            >
                              View status
                            </Link>
                          )}
                          {b.status === "provisioned" && b.tenant_id && (
                            <Link
                              href={`/platform/tenants`}
                              className="inline-block rounded-md border border-[#252a38] bg-transparent px-3 py-1.5 text-xs font-medium text-[#8892a4] hover:bg-[#181b23] hover:text-[#e8eaf0]"
                            >
                              View tenant
                            </Link>
                          )}
                          {b.status === "failed" && (
                            <>
                              <button
                                onClick={() => openProvisionModal(b)}
                                className="mr-1 rounded-md border border-[#252a38] px-2 py-1 text-xs font-medium text-[#8892a4] hover:bg-[#181b23]"
                              >
                                Retry
                              </button>
                              <Link
                                href={`/platform/provision/${b.id}`}
                                className="inline-block rounded-md border border-[rgba(239,68,68,0.3)] px-2 py-1 text-xs font-medium text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)]"
                              >
                                View error
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {provisionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#252a38] bg-[#111318] p-7 shadow-xl">
            <h2 className="font-['Syne',sans-serif] text-lg font-bold text-[#e8eaf0]">
              Confirm provision
            </h2>
            <p className="mt-1 text-sm text-[#8892a4]">
              {provisionModal.client_name} · {provisionModal.plan_code} · {provisionModal.niche_code}
            </p>
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8892a4]">
                Subdomain (slug)
              </label>
              <input
                type="text"
                value={provisionSlug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProvisionSlug(e.target.value)}
                className="w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2.5 text-sm text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                placeholder="my-site"
              />
              <p className="mt-1.5 text-xs text-[#4a5568]">
                Preview: {provisionSlug.trim() || "slug"}.waasfl.com
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProvisionModal(null)}
                disabled={provisioning}
                className="rounded-lg border border-[#252a38] bg-transparent px-4 py-2 text-sm font-medium text-[#8892a4] hover:bg-[#181b23] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runProvision}
                disabled={provisioning}
                className="rounded-lg bg-[#4f6ef7] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d5ce4] disabled:opacity-50"
              >
                {provisioning ? "Provisioning…" : "Confirm & provision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PlatformLayout>
  );
}
