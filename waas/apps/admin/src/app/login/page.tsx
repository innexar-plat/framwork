"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function LoginPage() {
  const { t } = useI18n();
  const { login, isAuthenticated, me } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const me = await login(email, password);
        if (me?.global_role && ["super_admin", "catalog_admin"].includes(me.global_role) && !me.tenant) {
          router.replace("/platform");
        } else {
          router.replace("/");
        }
      } catch {
        setError(t("auth.loginError"));
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, router, t]
  );

  if (isAuthenticated) {
    if (me?.global_role && ["super_admin", "catalog_admin"].includes(me.global_role) && !me.tenant) {
      router.replace("/platform");
    } else {
      router.replace("/");
    }
    return null;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-bg overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-light/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/3 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-accent" aria-hidden>
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary font-heading tracking-tight">
            WaaS
          </h1>
          <p className="mt-1 text-sm text-secondary">Website as a Service</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-primary font-heading">
            {t("auth.login")}
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="label"
              >
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="label"
              >
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-500" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("common.loading")}
                </>
              ) : (
                t("auth.login")
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-4 text-center text-sm text-secondary">
            <Link href="/onboarding" className="font-medium text-accent hover:text-accent-hover transition-colors">
              New client? Submit your briefing →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
