"use client";

import { useI18n } from "@/lib/i18n";

export function AdminFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer
      className="shrink-0 border-t border-[#1e2230] bg-[#111318] px-6 py-3"
      role="contentinfo"
    >
      <div className="flex items-center justify-between text-sm text-[#8892a4]">
        <span>
          © {year} WaaS. {t("footer.rights")}
        </span>
        <span>{t("footer.tenantPanel")}</span>
      </div>
    </footer>
  );
}
