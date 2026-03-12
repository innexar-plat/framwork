"use client";

import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { StripeProductOut } from "@/lib/tenant-api";
import { listPaymentProducts } from "@/lib/tenant-api";
import { useRouter } from "next/navigation";

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
import { useCallback, useEffect, useState } from "react";

export default function AppBillingPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh, me } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<StripeProductOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = getAccessToken();
  const hasPaymentsModule = (me?.enabled_modules ?? []).includes("stripe_payments");

  const load = useCallback(() => {
    if (!token || !hasPaymentsModule) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    listPaymentProducts(token, tryRefresh)
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [token, tryRefresh, hasPaymentsModule]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
    if (isAuthenticated && !hasTenant) router.replace("/");
  }, [isAuthenticated, hasTenant, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAuthenticated) return null;

  return (
    <TenantLayout>
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="font-semibold text-[#e8eaf0] text-2xl">
          {t("nav.billing")}
        </h1>

        {!hasPaymentsModule && (
          <p className="mt-4 text-[#8892a4]">{t("payments.comingSoon")}</p>
        )}

        {hasPaymentsModule && loading && (
          <p className="mt-4 text-[#8892a4]">{t("common.loading")}</p>
        )}

        {hasPaymentsModule && !loading && error && (
          <p className="mt-4 text-[#ef4444]">{t("payments.loadError")}</p>
        )}

        {hasPaymentsModule && !loading && !error && products.length === 0 && (
          <p className="mt-4 text-[#8892a4]">{t("payments.empty")}</p>
        )}

        {hasPaymentsModule && !loading && !error && products.length > 0 && (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-[#1e2230] bg-[#111318] p-4"
              >
                <div className="flex items-start gap-3">
                  <CreditCardIcon className="h-5 w-5 shrink-0 text-[#4f6ef7]" />
                  <div>
                    <h2 className="font-medium text-[#e8eaf0]">{p.name}</h2>
                    <p className="mt-1 text-[#8892a4] text-sm">
                      {(p.amount_cents / 100).toFixed(2)} {p.currency.toUpperCase()}
                      {p.interval === "month"
                        ? t("payments.pricePerMonth")
                        : p.interval === "year"
                          ? t("payments.pricePerYear")
                          : ` / ${p.interval}`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TenantLayout>
  );
}
