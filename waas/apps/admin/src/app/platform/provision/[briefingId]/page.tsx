"use client";

import { PlatformLayout } from "@/components/admin/platform-layout";
import {
  getProvisionStatus,
  postProvision,
  type ProvisionStatusResponse,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STEP_NAMES = [
  "Validate briefing",
  "Generate unique slug",
  "Create tenant in database",
  "Configure Cloudflare DNS",
  "Create Git repository",
  "Generate credentials",
  "Create admin user",
  "Link user to tenant",
  "Send welcome email",
  "Finalize provisioning",
];

export default function ProvisionProgressPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const briefingId = typeof params.briefingId === "string" ? params.briefingId : "";
  const { isAuthenticated, isPlatformAdmin, getAccessToken, tryRefresh } = useAuth();
  const [status, setStatus] = useState<ProvisionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!briefingId) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await getProvisionStatus(token, briefingId);
      if (res.success && res.data) setStatus(res.data);
    } catch {
      const newToken = await tryRefresh();
      if (newToken) {
        const res = await getProvisionStatus(newToken, briefingId);
        if (res.success && res.data) setStatus(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [briefingId, getAccessToken, tryRefresh]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isPlatformAdmin || !briefingId) return;
    fetchStatus();
  }, [isPlatformAdmin, briefingId, fetchStatus]);

  useEffect(() => {
    if (!briefingId) return;
    const done = status?.briefing_status === "provisioned" || status?.briefing_status === "failed";
    if (done) return;
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [briefingId, status?.briefing_status, fetchStatus]);

  const handleRetry = async () => {
    const token = getAccessToken();
    if (!token) return;
    setRetrying(true);
    try {
      const res = await postProvision(token, { briefing_id: briefingId });
      if (res.success) {
        setStatus(null);
        setLoading(true);
        await fetchStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRetrying(false);
    }
  };

  if (!isAuthenticated) return null;
  if (!isPlatformAdmin) {
    router.replace("/");
    return null;
  }
  if (!briefingId) {
    return (
      <PlatformLayout>
        <div className="p-6 text-[#8892a4]">Invalid briefing ID.</div>
      </PlatformLayout>
    );
  }

  const done = status?.briefing_status === "provisioned" || status?.briefing_status === "failed";
  const success = status?.briefing_status === "provisioned";
  const subdomain =
    status?.steps?.find((s) => s.step_name.toLowerCase().includes("slug"))?.message ||
    status?.tenant_id;

  return (
    <PlatformLayout>
      <div className="min-h-full bg-[#0a0b0f] text-[#e8eaf0]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1e2230] bg-[#111318] px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/platform/briefings"
              className="text-sm font-medium text-[#8892a4] hover:text-[#e8eaf0]"
            >
              ← Briefings
            </Link>
            <h1 className="font-['Syne',sans-serif] text-[17px] font-bold">
              Provisioning progress
            </h1>
          </div>
        </div>

        <div className="p-6">
          {loading && !status ? (
            <div className="py-12 text-center text-[#8892a4]">Loading...</div>
          ) : !status ? (
            <div className="py-12 text-center text-[#8892a4]">Could not load status.</div>
          ) : (
            <>
              <div className="mb-8 rounded-xl border border-[#1e2230] bg-[#111318] p-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4a5568]">
                  Briefing
                </div>
                <div className="font-medium">
                  Status:{" "}
                  <span
                    className={
                      status.briefing_status === "provisioned"
                        ? "text-[#10b981]"
                        : status.briefing_status === "failed"
                          ? "text-[#ef4444]"
                          : "text-[#4f6ef7]"
                    }
                  >
                    {status.briefing_status}
                  </span>
                  {status.provisioning_status && (
                    <span className="ml-2 text-[#8892a4]">
                      (tenant: {status.provisioning_status})
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#1e2230] bg-[#111318] p-6">
                <div className="mb-4 text-sm font-semibold text-[#8892a4]">
                  Steps
                </div>
                <ul className="space-y-4">
                  {STEP_NAMES.map((name, i) => {
                    const step = status.steps?.find((s) => s.step_number === i + 1);
                    const stepStatus = step?.status ?? "waiting";
                    const completedCount = status.steps?.filter((s) => s.status === "success").length ?? 0;
                    const isCurrentRunning =
                      !done &&
                      status.briefing_status === "provisioning" &&
                      completedCount === i &&
                      stepStatus !== "success" &&
                      stepStatus !== "failed";
                    return (
                      <li key={i} className="flex items-start gap-4">
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${
                            stepStatus === "success"
                              ? "bg-[rgba(16,185,129,0.2)] text-[#10b981]"
                              : stepStatus === "failed"
                                ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444]"
                                : isCurrentRunning
                                  ? "border-2 border-[#4f6ef7] text-[#4f6ef7]"
                                  : "border border-[#252a38] bg-[#181b23] text-[#4a5568]"
                          }`}
                        >
                          {stepStatus === "success" ? (
                            "✓"
                          ) : stepStatus === "failed" ? (
                            "✕"
                          ) : isCurrentRunning ? (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#4f6ef7] border-t-transparent" />
                          ) : (
                            i + 1
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-[#e8eaf0]">{name}</div>
                          {step?.message && (
                            <div className="mt-0.5 truncate text-xs text-[#8892a4]">
                              {step.message}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {done && success && status.tenant_id && (
                <div className="mt-8 rounded-xl border border-[#10b981]/30 bg-[rgba(16,185,129,0.06)] p-6">
                  <div className="mb-3 font-semibold text-[#10b981]">Provisioning complete</div>
                  <div className="space-y-1 text-sm text-[#e8eaf0]">
                    <p>Site: {subdomain ? `${subdomain}.waasfl.com` : "—"}</p>
                    <p>Panel: app.waasfl.com</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href="/platform/tenants"
                      className="rounded-lg bg-[#4f6ef7] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d5ce4]"
                    >
                      View tenant
                    </Link>
                    <Link
                      href="/platform/briefings"
                      className="rounded-lg border border-[#252a38] px-4 py-2 text-sm font-medium text-[#8892a4] hover:bg-[#181b23] hover:text-[#e8eaf0]"
                    >
                      Back to briefings
                    </Link>
                  </div>
                </div>
              )}

              {done && !success && (
                <div className="mt-8 rounded-xl border border-[#ef4444]/30 bg-[rgba(239,68,68,0.06)] p-6">
                  <div className="mb-3 font-semibold text-[#ef4444]">Provisioning failed</div>
                  <p className="text-sm text-[#8892a4]">
                    Check the step that failed above for the error message.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={retrying}
                      className="rounded-lg bg-[#4f6ef7] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d5ce4] disabled:opacity-50"
                    >
                      {retrying ? "Retrying…" : "Try again"}
                    </button>
                    <Link
                      href="/platform/briefings"
                      className="rounded-lg border border-[#252a38] px-4 py-2 text-sm font-medium text-[#8892a4] hover:bg-[#181b23] hover:text-[#e8eaf0]"
                    >
                      Back to briefings
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
}
