"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useI18n } from "@/lib/i18n";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001"
    : "http://localhost:8001";

type Plan = { id: string; code: string; name: string };
type Niche = { id: string; code: string; name: string };
type Module = { id: string; code: string; name: string };

const STEPS = [
  "Identification",
  "Segment",
  "Visual",
  "Location",
  "Domain",
  "Modules & Notes",
];

const NICHE_EMOJI: Record<string, string> = {
  real_estate: "🏠",
  medical_dental: "🏥",
  law_firm: "⚖️",
  beauty_spa: "💆",
  restaurant: "🍽️",
  home_services: "🔧",
  insurance: "🛡️",
  personal_trainer: "💪",
  immigration: "📋",
  accountant: "📊",
  default: "📌",
};

function OnboardingContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_name: "",
    client_email: searchParams?.get("email") ?? "",
    client_phone: "",
    business_name: "",
    plan_code: searchParams?.get("plan") ?? "",
    niche_code: "",
    slogan: "",
    business_description: "",
    logo_url: "",
    primary_color: "#4f6ef7",
    secondary_color: "#7c3aed",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    social_links: {} as Record<string, string>,
    use_custom_domain: false,
    slug_requested: "",
    custom_domain_requested: "",
    modules_requested: [] as string[],
    notes: "",
    terms_accepted: false,
  });

  useEffect(() => {
    const email = searchParams?.get("email");
    const plan = searchParams?.get("plan");
    if (email) setForm((f) => ({ ...f, client_email: email }));
    if (plan) setForm((f) => ({ ...f, plan_code: plan }));
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/v1/catalog/plans`).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/catalog/niches`).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/catalog/modules`).then((r) => r.json()),
    ])
      .then(([pRes, nRes, mRes]) => {
        if (pRes.success && pRes.data) setPlans(pRes.data);
        if (nRes.success && nRes.data) setNiches(nRes.data);
        if (mRes.success && mRes.data) setModules(mRes.data);
      })
      .catch(() => setError("Could not load catalog"))
      .finally(() => setLoading(false));
  }, []);

  const checkSlug = useCallback(async (slug: string) => {
    const s = (slug || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!s) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    setSlugAvailable(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/public/check-slug/${encodeURIComponent(s)}`);
      const json = await res.json();
      if (json.success && json.data) setSlugAvailable(json.data.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  }, []);

  const update = (key: keyof typeof form, value: string | boolean | string[] | Record<string, string>) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "slug_requested") setSlugAvailable(null);
  };

  const canNext = () => {
    if (step === 1)
      return form.client_name.trim() && form.client_email.trim() && form.business_name.trim();
    if (step === 2) return form.plan_code && form.niche_code;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5)
      return form.use_custom_domain
        ? !!form.custom_domain_requested?.trim()
        : !!form.slug_requested?.trim();
    if (step === 6) return form.terms_accepted;
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitLoading(true);
    const payload = {
      client_name: form.client_name.trim(),
      client_email: form.client_email.trim(),
      client_phone: form.client_phone.trim() || null,
      plan_code: form.plan_code,
      niche_code: form.niche_code,
      slug_requested: form.use_custom_domain ? null : (form.slug_requested.trim() || null),
      business_name: form.business_name.trim(),
      business_description: form.business_description.trim() || null,
      slogan: form.slogan.trim() || null,
      logo_url: form.logo_url.trim() || null,
      primary_color: form.primary_color || null,
      secondary_color: form.secondary_color || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip_code: form.zip_code.trim() || null,
      social_links: Object.keys(form.social_links).length ? form.social_links : null,
      modules_requested: form.modules_requested.length ? form.modules_requested : null,
      use_custom_domain: form.use_custom_domain,
      custom_domain_requested: form.use_custom_domain ? form.custom_domain_requested.trim() || null : null,
      notes: form.notes.trim() || null,
    };
    try {
      const res = await fetch(`${API_BASE}/api/v1/platform/briefings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      if (!json.success) throw new Error(json.error ?? "Request failed");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ─── Success screen ─── */
  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <div className="absolute right-4 top-4 flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-5 text-xl font-bold text-primary font-heading">
            We received your briefing!
          </h1>
          <p className="mt-3 text-sm text-secondary leading-relaxed">
            Your site will be live within 24 hours. We will email you at{" "}
            <span className="font-medium text-accent">{form.client_email}</span>{" "}
            with next steps.
          </p>
        </div>
      </div>
    );
  }

  /* ─── Onboarding wizard ─── */
  return (
    <div className="relative min-h-screen bg-bg text-primary">
      {/* Decorative backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-light/5 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="absolute right-4 top-4 flex items-center gap-3 z-10">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" aria-hidden>
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight">Get your site</h1>
            <p className="text-sm text-secondary">Complete the form below. Your site will be provisioned within 24h.</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? "bg-accent" : "bg-border"
                }`}
                aria-hidden
              />
              <p className={`text-[10px] font-medium text-center transition-colors ${
                i + 1 <= step ? "text-accent" : "text-muted"
              }`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Error alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-12 flex items-center justify-center gap-3 text-secondary">
            <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-card">
            {/* ─── Step 1: Identification ─── */}
            {step === 1 && (
              <>
                <h2 className="text-lg font-bold font-heading">Step 1 — Identification</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label">Full name *</label>
                    <input
                      value={form.client_name}
                      onChange={(e) => update("client_name", e.target.value)}
                      className="input"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      value={form.client_email}
                      onChange={(e) => update("client_email", e.target.value)}
                      className="input"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="label">Phone / WhatsApp</label>
                    <input
                      value={form.client_phone}
                      onChange={(e) => update("client_phone", e.target.value)}
                      className="input"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="label">Business name *</label>
                    <input
                      value={form.business_name}
                      onChange={(e) => update("business_name", e.target.value)}
                      className="input"
                      placeholder="My Business LLC"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ─── Step 2: Segment ─── */}
            {step === 2 && (
              <>
                <h2 className="text-lg font-bold font-heading">Step 2 — Segment</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label">Plan *</label>
                    <select
                      value={form.plan_code}
                      onChange={(e) => update("plan_code", e.target.value)}
                      className="input cursor-pointer"
                    >
                      <option value="">Select plan</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Niche *</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {niches.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => update("niche_code", n.code)}
                          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                            form.niche_code === n.code
                              ? "border-accent bg-accent/10 text-accent shadow-sm"
                              : "border-border bg-surface text-secondary hover:border-accent/30 hover:text-primary"
                          }`}
                        >
                          {NICHE_EMOJI[n.code] ?? NICHE_EMOJI.default} {n.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Slogan / tagline</label>
                    <input
                      value={form.slogan}
                      onChange={(e) => update("slogan", e.target.value)}
                      className="input"
                      placeholder="Your business tagline"
                    />
                  </div>
                  <div>
                    <label className="label">Business description</label>
                    <textarea
                      value={form.business_description}
                      onChange={(e) => update("business_description", e.target.value)}
                      rows={3}
                      className="input resize-none"
                      placeholder="Tell us about your business..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* ─── Step 3: Visual identity ─── */}
            {step === 3 && (
              <>
                <h2 className="text-lg font-bold font-heading">Step 3 — Visual identity</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label">Logo URL</label>
                    <input
                      type="url"
                      value={form.logo_url}
                      onChange={(e) => update("logo_url", e.target.value)}
                      placeholder="https://..."
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Primary color</label>
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          type="color"
                          value={form.primary_color}
                          onChange={(e) => update("primary_color", e.target.value)}
                          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1"
                        />
                        <span className="text-xs text-muted font-mono">{form.primary_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Secondary color</label>
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          type="color"
                          value={form.secondary_color}
                          onChange={(e) => update("secondary_color", e.target.value)}
                          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1"
                        />
                        <span className="text-xs text-muted font-mono">{form.secondary_color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── Step 4: Location ─── */}
            {step === 4 && (
              <>
                <h2 className="text-lg font-bold font-heading">Step 4 — Location & contact</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      className="input"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">City</label>
                      <input
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className="input"
                        placeholder="Orlando"
                      />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input
                        value={form.state}
                        onChange={(e) => update("state", e.target.value)}
                        className="input"
                        placeholder="FL"
                      />
                    </div>
                    <div>
                      <label className="label">ZIP</label>
                      <input
                        value={form.zip_code}
                        onChange={(e) => update("zip_code", e.target.value)}
                        className="input"
                        placeholder="32801"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── Step 5: Domain ─── */}
            {step === 5 && (
              <>
                <h2 className="text-lg font-bold font-heading">Step 5 — Domain</h2>
                <div className="mt-5 space-y-4">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-hover/50 px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-hover">
                    <input
                      type="checkbox"
                      checked={form.use_custom_domain}
                      onChange={(e) => update("use_custom_domain", e.target.checked)}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
                    />
                    I have my own domain
                  </label>
                  {!form.use_custom_domain && (
                    <div>
                      <label className="label">Subdomain *</label>
                      <div className="mt-1 flex gap-2 items-center">
                        <input
                          value={form.slug_requested}
                          onChange={(e) => update("slug_requested", e.target.value)}
                          onBlur={() => form.slug_requested.trim() && checkSlug(form.slug_requested)}
                          placeholder="my-business"
                          className="input flex-1"
                        />
                        <span className="text-sm text-muted font-medium whitespace-nowrap">
                          .waasfl.com
                        </span>
                      </div>
                      {slugChecking && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-secondary">
                          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Checking...
                        </p>
                      )}
                      {!slugChecking && slugAvailable === false && (
                        <p className="mt-2 text-xs text-red-500 font-medium">✕ This subdomain is not available.</p>
                      )}
                      {!slugChecking && slugAvailable === true && (
                        <p className="mt-2 text-xs text-emerald-500 font-medium">✓ Available.</p>
                      )}
                    </div>
                  )}
                  {form.use_custom_domain && (
                    <div>
                      <label className="label">Your domain</label>
                      <input
                        value={form.custom_domain_requested}
                        onChange={(e) => update("custom_domain_requested", e.target.value)}
                        placeholder="www.example.com"
                        className="input"
                      />
                      <p className="mt-2 text-xs text-muted">We will send you CNAME instructions after submission.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── Step 6: Modules & Notes ─── */}
            {step === 6 && (
              <>
                <h2 className="text-lg font-bold font-heading">Step 6 — Modules & notes</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label">Modules you want</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {modules.map((m) => (
                        <label
                          key={m.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                            form.modules_requested.includes(m.code)
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-surface text-secondary hover:border-accent/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.modules_requested.includes(m.code)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.modules_requested, m.code]
                                : form.modules_requested.filter((c) => c !== m.code);
                              update("modules_requested", next);
                            }}
                            className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
                          />
                          {m.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      rows={3}
                      className="input resize-none"
                      placeholder="Any additional notes or requests..."
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-hover/50 px-4 py-3.5 text-sm transition-colors hover:bg-surface-hover">
                    <input
                      type="checkbox"
                      checked={form.terms_accepted}
                      onChange={(e) => update("terms_accepted", e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
                    />
                    <span className="text-secondary leading-relaxed">
                      I accept the terms and confirm the information above is correct. <span className="text-accent font-medium">*</span>
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* ─── Navigation buttons ─── */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="btn-secondary py-2.5 px-5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              {step < 6 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className="btn-primary py-2.5 px-6"
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canNext() || submitLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {submitLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      Submit briefing
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <div className="flex items-center gap-3 text-secondary">
            <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
