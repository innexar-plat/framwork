"use client";

import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">
        {LOCALE_LABELS[locale]}
      </span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
        aria-label="Select language"
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
