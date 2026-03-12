"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
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
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">{t("auth.login")}</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("auth.email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("auth.password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("auth.login")}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/onboarding" className="text-[#4f6ef7] hover:underline">
            New client? Submit your briefing
          </Link>
        </p>
      </div>
    </main>
  );
}
