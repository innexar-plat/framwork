"use client";

import { PlatformLayout } from "@/components/admin/platform-layout";
import {
  getPlatformIntegrationsStatus,
  testPlatformCloudflare,
  testPlatformSmtp,
  type PlatformIntegrationsStatus,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function SectionCard({
  title,
  configured,
  children,
  testLabel,
  onTest,
  testing,
}: {
  title: string;
  configured: boolean;
  children: React.ReactNode;
  testLabel?: string;
  onTest?: () => void;
  testing?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1e2230] bg-[#111318] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#e8eaf0]">{title}</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            configured
              ? "bg-[rgba(16,185,129,0.12)] text-[#10b981]"
              : "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]"
          }`}
        >
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>
      <div className="space-y-1.5 text-sm text-[#8892a4]">{children}</div>
      {onTest && testLabel && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onTest}
            disabled={testing}
            className="rounded-lg bg-[#4f6ef7] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#3d5ce4] disabled:opacity-50"
          >
            {testing ? "Testing…" : testLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex gap-2">
      <span className="font-medium text-[#4a5568]">{label}:</span>
      <span className="font-mono text-[#e8eaf0]">{value}</span>
    </div>
  );
}

export default function PlatformIntegrationsPage() {
  const { t } = useI18n();
  const { isAuthenticated, isPlatformAdmin, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<PlatformIntegrationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingCf, setTestingCf] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await getPlatformIntegrationsStatus(token);
      if (res.success && res.data) setStatus(res.data);
    } catch {
      const newToken = await tryRefresh();
      if (newToken) {
        const res = await getPlatformIntegrationsStatus(newToken);
        if (res.success && res.data) setStatus(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, tryRefresh]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    load();
  }, [isPlatformAdmin, load]);

  const handleTestCloudflare = async () => {
    const token = getAccessToken();
    if (!token) return;
    setTestingCf(true);
    setTestMessage(null);
    try {
      const res = await testPlatformCloudflare(token);
      if (res.success && res.data) {
        setTestMessage(res.data.ok ? "Cloudflare: connection OK" : res.data.message);
      } else {
        setTestMessage(res.error ?? "Request failed");
      }
    } catch (e) {
      setTestMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setTestingCf(false);
    }
  };

  const handleTestSmtp = async () => {
    const token = getAccessToken();
    if (!token) return;
    setTestingSmtp(true);
    setTestMessage(null);
    try {
      const res = await testPlatformSmtp(token);
      if (res.success && res.data) {
        setTestMessage(res.data.ok ? "Test email sent." : res.data.message);
      } else {
        setTestMessage(res.error ?? "Request failed");
      }
    } catch (e) {
      setTestMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setTestingSmtp(false);
    }
  };

  if (!isAuthenticated) return null;
  if (!isPlatformAdmin) {
    router.replace("/");
    return null;
  }

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-bold text-2xl text-[#e8eaf0]">
          {t("nav.platformIntegrations")}
        </h1>
        <p className="mt-1 text-sm text-[#8892a4]">
          Configure via environment variables (.env). Values shown are masked.
        </p>

        {testMessage && (
          <div
            className={`mt-4 rounded-lg border px-4 py-2 text-sm ${
              testMessage.startsWith("Cloudflare:") || testMessage === "Test email sent."
                ? "border-[#10b981]/40 bg-[rgba(16,185,129,0.08)] text-[#10b981]"
                : "border-[#f59e0b]/40 bg-[rgba(245,158,11,0.08)] text-[#f59e0b]"
            }`}
          >
            {testMessage}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-[#8892a4]">{t("common.loading")}</p>
        ) : status ? (
          <div className="mt-6 space-y-6">
            <SectionCard
              title="Cloudflare DNS"
              configured={status.cloudflare.configured}
              testLabel="Test connection"
              onTest={handleTestCloudflare}
              testing={testingCf}
            >
              <FieldRow label="Zone ID" value={status.cloudflare.zone_id ?? undefined} />
              <FieldRow label="Base domain" value={status.cloudflare.base_domain ?? undefined} />
              <FieldRow label="CNAME target" value={status.cloudflare.cname_target ?? undefined} />
              <FieldRow label="Token" value={status.cloudflare.token_masked ?? undefined} />
            </SectionCard>

            <SectionCard title="GitHub / Git" configured={status.git.configured}>
              <FieldRow label="Template owner" value={status.git.template_owner ?? undefined} />
              <FieldRow label="Template repo" value={status.git.template_repo ?? undefined} />
              <FieldRow label="Token" value={status.git.token_masked ?? undefined} />
            </SectionCard>

            <SectionCard
              title="Email (SMTP)"
              configured={status.smtp.configured}
              testLabel="Send test email"
              onTest={handleTestSmtp}
              testing={testingSmtp}
            >
              <FieldRow label="Host" value={status.smtp.host ?? undefined} />
              <FieldRow label="Port" value={status.smtp.port?.toString() ?? undefined} />
              <FieldRow label="From" value={status.smtp.from_address ?? undefined} />
              <FieldRow label="User" value={status.smtp.user_masked ?? undefined} />
            </SectionCard>

            <SectionCard title="Domain" configured={!!(status.domain.panel_base_url && status.domain.site_base_domain)}>
              <FieldRow label="Panel base URL" value={status.domain.panel_base_url ?? undefined} />
              <FieldRow label="Site base domain" value={status.domain.site_base_domain ?? undefined} />
            </SectionCard>
          </div>
        ) : (
          <p className="mt-6 text-[#8892a4]">Could not load integrations status.</p>
        )}
      </div>
    </PlatformLayout>
  );
}
