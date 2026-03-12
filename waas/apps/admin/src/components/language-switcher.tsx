"use client";

import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};

interface LanguageSwitcherProps {
  variant?: "light" | "dark";
}

export function LanguageSwitcher({ variant = "light" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const isDark = variant === "dark";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${isDark ? "text-[#8892a4]" : "text-gray-500"}`}>
        {LOCALE_LABELS[locale]}
      </span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={`rounded border px-2 py-1 text-sm ${
          isDark
            ? "border-[#252a38] bg-[#181b23] text-[#e8eaf0]"
            : "border-gray-300 bg-white text-gray-700"
        }`}
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
