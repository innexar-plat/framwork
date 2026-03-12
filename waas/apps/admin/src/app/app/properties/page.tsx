"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { PropertyItemCreate, PropertyItemOut } from "@/lib/tenant-api";
import {
  createPropertyItem,
  deletePropertyItem,
  listPropertyItems,
} from "@/lib/tenant-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AppPropertiesPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PropertyItemOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const token = getAccessToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    listPropertyItems(token, tryRefresh)
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
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const address = (form.elements.namedItem("address") as HTMLInputElement).value.trim() || null;
    const status = (form.elements.namedItem("status") as HTMLInputElement).value.trim() || "draft";
    if (!title) {
      setFormError(t("catalog.codeAndNameRequired"));
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    const body: PropertyItemCreate = { title, address, status };
    createPropertyItem(body, token, tryRefresh)
      .then(() => {
        setModalOpen(false);
        load();
      })
      .catch((err) => setFormError(err instanceof Error ? err.message : String(err)))
      .finally(() => setSubmitLoading(false));
  };

  const handleDeleteConfirm = () => {
    if (!token || !confirmDeleteId) return;
    setSubmitLoading(true);
    deletePropertyItem(confirmDeleteId, token, tryRefresh)
      .then(() => {
        setConfirmDeleteId(null);
        load();
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setSubmitLoading(false));
  };

  if (!isAuthenticated) return null;
  if (hasTenant === false) return null;

  return (
    <TenantLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("nav.properties")}
        </h1>
        <div className="mt-4 flex items-center justify-between">
          <span />
          <button
            type="button"
            onClick={() => {
              setModalOpen(true);
              setFormError(null);
            }}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            {t("property.addProperty")}
          </button>
        </div>
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhum item.</p>
        ) : (
          <table className="mt-2 w-full table-auto border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("property.title")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("property.address")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("property.status")}
                </th>
                <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700">
                  {t("common.delete")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-900">{item.title}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.address ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">{item.status}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("property.addProperty")}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("property.title")} *
            </label>
            <input
              name="title"
              type="text"
              required
              maxLength={500}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("property.address")}
            </label>
            <input
              name="address"
              type="text"
              maxLength={500}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("property.status")}
            </label>
            <select
              name="status"
              defaultValue="draft"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
            </select>
          </div>
          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={t("common.delete")}
        message={t("property.confirmDelete")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
        confirmLabel={t("common.delete")}
        loading={submitLoading}
      />
    </TenantLayout>
  );
}
