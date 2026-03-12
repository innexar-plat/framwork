"use client";

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

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0b0f] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#1e2230] bg-[#111318] p-8 text-center">
          <div className="text-4xl font-bold text-[#10b981]">✓</div>
          <h1 className="mt-4 font-['Syne',sans-serif] text-xl font-bold text-[#e8eaf0]">
            We received your briefing!
          </h1>
          <p className="mt-2 text-[#8892a4]">
            Your site will be live within 24 hours. We will email you at {form.client_email} with next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-[#e8eaf0]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-['Syne',sans-serif] text-2xl font-bold">Get your site</h1>
        <p className="mt-1 text-sm text-[#8892a4]">Complete the form below. Your site will be provisioned within 24h.</p>

        <div className="mt-6 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${
                i + 1 <= step ? "bg-[#4f6ef7]" : "bg-[#1e2230]"
              }`}
              aria-hidden
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-[#ef4444]/50 bg-[#ef4444]/10 px-4 py-2 text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-[#8892a4]">Loading...</p>
        ) : (
          <div className="mt-8 rounded-xl border border-[#1e2230] bg-[#111318] p-6">
            {step === 1 && (
              <>
                <h2 className="font-['Syne',sans-serif] text-lg font-bold">Step 1 — Identification</h2>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Full name *</label>
                    <input
                      value={form.client_name}
                      onChange={(e) => update("client_name", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Email *</label>
                    <input
                      type="email"
                      value={form.client_email}
                      onChange={(e) => update("client_email", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Phone / WhatsApp</label>
                    <input
                      value={form.client_phone}
                      onChange={(e) => update("client_phone", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Business name *</label>
                    <input
                      value={form.business_name}
                      onChange={(e) => update("business_name", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-['Syne',sans-serif] text-lg font-bold">Step 2 — Segment</h2>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Plan *</label>
                    <select
                      value={form.plan_code}
                      onChange={(e) => update("plan_code", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
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
                    <label className="block text-xs font-medium text-[#8892a4]">Niche *</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {niches.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => update("niche_code", n.code)}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            form.niche_code === n.code
                              ? "border-[#4f6ef7] bg-[#4f6ef7]/20 text-[#e8eaf0]"
                              : "border-[#252a38] bg-[#181b23] text-[#8892a4] hover:border-[#252a38]"
                          }`}
                        >
                          {NICHE_EMOJI[n.code] ?? NICHE_EMOJI.default} {n.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Slogan / tagline</label>
                    <input
                      value={form.slogan}
                      onChange={(e) => update("slogan", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Business description</label>
                    <textarea
                      value={form.business_description}
                      onChange={(e) => update("business_description", e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-['Syne',sans-serif] text-lg font-bold">Step 3 — Visual identity</h2>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Logo URL</label>
                    <input
                      type="url"
                      value={form.logo_url}
                      onChange={(e) => update("logo_url", e.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#8892a4]">Primary color</label>
                      <input
                        type="color"
                        value={form.primary_color}
                        onChange={(e) => update("primary_color", e.target.value)}
                        className="mt-1 h-10 w-full cursor-pointer rounded border border-[#252a38] bg-[#181b23]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8892a4]">Secondary color</label>
                      <input
                        type="color"
                        value={form.secondary_color}
                        onChange={(e) => update("secondary_color", e.target.value)}
                        className="mt-1 h-10 w-full cursor-pointer rounded border border-[#252a38] bg-[#181b23]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-['Syne',sans-serif] text-lg font-bold">Step 4 — Location & contact</h2>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-[#8892a4]">City</label>
                      <input
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8892a4]">State</label>
                      <input
                        value={form.state}
                        onChange={(e) => update("state", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8892a4]">ZIP</label>
                      <input
                        value={form.zip_code}
                        onChange={(e) => update("zip_code", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="font-['Syne',sans-serif] text-lg font-bold">Step 5 — Domain</h2>
                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.use_custom_domain}
                      onChange={(e) => update("use_custom_domain", e.target.checked)}
                      className="rounded border-[#252a38]"
                    />
                    I have my own domain
                  </label>
                  {!form.use_custom_domain && (
                    <div>
                      <label className="block text-xs font-medium text-[#8892a4]">Subdomain *</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          value={form.slug_requested}
                          onChange={(e) => update("slug_requested", e.target.value)}
                          onBlur={() => form.slug_requested.trim() && checkSlug(form.slug_requested)}
                          placeholder="my-business"
                          className="flex-1 rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                        />
                        <span className="flex items-center text-sm text-[#8892a4]">
                          .waasfl.com
                        </span>
                      </div>
                      {slugChecking && <p className="mt-1 text-xs text-[#8892a4]">Checking...</p>}
                      {!slugChecking && slugAvailable === false && (
                        <p className="mt-1 text-xs text-[#ef4444]">This subdomain is not available.</p>
                      )}
                      {!slugChecking && slugAvailable === true && (
                        <p className="mt-1 text-xs text-[#10b981]">Available.</p>
                      )}
                    </div>
                  )}
                  {form.use_custom_domain && (
                    <div>
                      <label className="block text-xs font-medium text-[#8892a4]">Your domain</label>
                      <input
                        value={form.custom_domain_requested}
                        onChange={(e) => update("custom_domain_requested", e.target.value)}
                        placeholder="www.example.com"
                        className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                      />
                      <p className="mt-1 text-xs text-[#8892a4]">We will send you CNAME instructions after submission.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <h2 className="font-['Syne',sans-serif] text-lg font-bold">Step 6 — Modules & notes</h2>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Modules you want</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {modules.map((m) => (
                        <label
                          key={m.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-sm"
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
                            className="rounded border-[#252a38]"
                          />
                          {m.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8892a4]">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-[#252a38] bg-[#181b23] px-3 py-2 text-[#e8eaf0] outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.terms_accepted}
                      onChange={(e) => update("terms_accepted", e.target.checked)}
                      className="mt-0.5 rounded border-[#252a38]"
                    />
                    <span>I accept the terms and confirm the information above is correct. *</span>
                  </label>
                </div>
              </>
            )}

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="rounded-lg border border-[#252a38] px-4 py-2 text-sm font-medium text-[#8892a4] hover:bg-[#181b23] disabled:opacity-50"
              >
                Back
              </button>
              {step < 6 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className="rounded-lg bg-[#4f6ef7] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d5ce4] disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canNext() || submitLoading}
                  className="rounded-lg bg-[#10b981] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d9668] disabled:opacity-50"
                >
                  {submitLoading ? "Sending…" : "Submit briefing"}
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
        <div className="flex min-h-screen items-center justify-center bg-[#0a0b0f]">
          <div className="text-[#8892a4]">Loading…</div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
