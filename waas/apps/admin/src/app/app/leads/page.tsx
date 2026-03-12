"use client";

import { Modal } from "@/components/ui/modal";
import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { LeadCreate, LeadOut } from "@/lib/tenant-api";
import { createLead, listLeads } from "@/lib/tenant-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AppLeadsPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<LeadOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<"create" | "view" | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadOut | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const token = getAccessToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    listLeads(token, tryRefresh)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [token, tryRefresh]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
    if (isAuthenticated && !hasTenant) router.replace("/");
  }, [isAuthenticated, hasTenant, router]);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token, load]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const source = (form.elements.namedItem("source") as HTMLInputElement).value.trim() || null;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim() || null;
    if (!name || !email) {
      setFormError(t("catalog.codeAndNameRequired"));
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    const body: LeadCreate = { name, email, source, message };
    createLead(body, token, tryRefresh)
      .then(() => {
        setModalOpen(null);
        load();
      })
      .catch((err) => setFormError(err instanceof Error ? err.message : String(err)))
      .finally(() => setSubmitLoading(false));
  };

  if (!isAuthenticated) return null;
  if (hasTenant === false) return null;

  return (
    <TenantLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">{t("nav.leads")}</h1>
        <div className="mt-4 flex items-center justify-between">
          <span />
          <button
            type="button"
            onClick={() => {
              setModalOpen("create");
              setFormError(null);
            }}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            {t("leads.addLead")}
          </button>
        </div>
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhum lead.</p>
        ) : (
          <table className="mt-2 w-full table-auto border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("leads.name")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("leads.email")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("leads.source")}
                </th>
                <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700">
                  {t("leads.viewLead")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{item.email}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.source ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setViewingLead(item);
                        setModalOpen("view");
                      }}
                      className="text-sm text-gray-700 hover:text-gray-900"
                    >
                      {t("leads.viewLead")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen === "create"}
        onClose={() => setModalOpen(null)}
        title={t("leads.addLead")}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("leads.name")} *
            </label>
            <input
              name="name"
              type="text"
              required
              maxLength={255}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("leads.email")} *
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("leads.source")}
            </label>
            <input
              name="source"
              type="text"
              maxLength={100}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("leads.message")}
            </label>
            <textarea
              name="message"
              rows={3}
              maxLength={2000}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(null)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-900 disabled:opacity-50"
            >
              {submitLoading ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modalOpen === "view" && viewingLead !== null}
        onClose={() => {
          setModalOpen(null);
          setViewingLead(null);
        }}
        title={t("leads.detail")}
      >
        {viewingLead && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-gray-700">{t("leads.name")}:</span>{" "}
              {viewingLead.name}
            </p>
            <p>
              <span className="font-medium text-gray-700">{t("leads.email")}:</span>{" "}
              {viewingLead.email}
            </p>
            <p>
              <span className="font-medium text-gray-700">{t("leads.source")}:</span>{" "}
              {viewingLead.source ?? "—"}
            </p>
            <p>
              <span className="font-medium text-gray-700">{t("leads.message")}:</span>{" "}
              {viewingLead.message ?? "—"}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(null);
                  setViewingLead(null);
                }}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </TenantLayout>
  );
}
