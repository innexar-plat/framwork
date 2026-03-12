"use client";

import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};

const LOCALE_FULL: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};

interface LanguageSwitcherProps {
  variant?: "light" | "dark";
}

export function LanguageSwitcher({ variant: _variant }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="appearance-none rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary
          hover:text-primary hover:border-border
          focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
          transition-all duration-200 cursor-pointer"
        aria-label="Select language"
        title={LOCALE_FULL[locale]}
      >
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
          <option key={loc} value={loc}>
            {LOCALE_LABELS[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
