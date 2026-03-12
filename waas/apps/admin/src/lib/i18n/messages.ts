import type { Locale } from "./types";

import en from "./messages/en.json";
import pt from "./messages/pt.json";
import es from "./messages/es.json";

export const messages: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  pt: pt as Record<string, unknown>,
  es: es as Record<string, unknown>,
};

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let value: unknown = obj;
  for (const part of parts) {
    value = (value as Record<string, unknown>)?.[part];
    if (value === undefined) return undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export function getMessage(locale: Locale, key: string): string {
  const msg = messages[locale] ?? messages.en;
  const out = getNested(msg, key);
  if (out) return out;
  const fallback = getNested(messages.en, key);
  return fallback ?? key;
}
