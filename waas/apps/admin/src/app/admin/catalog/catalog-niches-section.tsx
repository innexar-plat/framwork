"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n";
import type { NicheCreate, NicheOut, NicheUpdate } from "@/lib/catalog-admin-api";
import {
  createNiche,
  deleteNiche,
  listNiches,
  updateNiche,
} from "@/lib/catalog-admin-api";
import { useCallback, useEffect, useState } from "react";

type CatalogNichesSectionProps = {
  getAccessToken: () => string | null;
  tryRefresh: () => Promise<string | null>;
};

export function CatalogNichesSection({
  getAccessToken,
  tryRefresh,
}: CatalogNichesSectionProps) {
  const { t } = useI18n();
  const [niches, setNiches] = useState<NicheOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<"create" | "edit" | null>(null);
  const [editingNiche, setEditingNiche] = useState<NicheOut | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const token = getAccessToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    listNiches(token, tryRefresh)
      .then(setNiches)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, tryRefresh]);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token, load]);

  const openCreate = () => {
    setEditingNiche(null);
    setModalOpen("create");
    setFormError(null);
  };
  const openEdit = (n: NicheOut) => {
    setEditingNiche(n);
    setModalOpen("edit");
    setFormError(null);
  };
  const handleCloseModal = () => {
    setModalOpen(null);
    setEditingNiche(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const code = (form.elements.namedItem("code") as HTMLInputElement).value.trim();
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const parentId = (form.elements.namedItem("parentId") as HTMLInputElement).value.trim() || null;
    const sortOrder = parseInt((form.elements.namedItem("sortOrder") as HTMLInputElement).value, 10) || 0;
    const isActive = (form.elements.namedItem("isActive") as HTMLInputElement).checked;
    if (!code || !name) {
      setFormError(t("catalog.codeAndNameRequired"));
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    const body: NicheCreate & NicheUpdate = {
      code,
      name,
      parent_id: parentId,
      sort_order: sortOrder,
      is_active: isActive,
    };
    const p = editingNiche
      ? updateNiche(editingNiche.id, body, token, tryRefresh)
      : createNiche(body, token, tryRefresh);
    p.then(() => {
      handleCloseModal();
      load();
    })
      .catch((err) => setFormError(err.message))
      .finally(() => setSubmitLoading(false));
  };

  const handleDeleteConfirm = () => {
    if (!token || !confirmDeleteId) return;
    setSubmitLoading(true);
    deleteNiche(confirmDeleteId, token, tryRefresh)
      .then(() => {
        setConfirmDeleteId(null);
        load();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitLoading(false));
  };

  if (loading) return <p>{t("common.loading")}</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{t("catalog.niches")}</h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
        >
          {t("common.add")} {t("catalog.niches")}
        </button>
      </div>
      <table className="mt-2 w-full table-auto border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-b px-3 py-2 text-left text-sm">{t("catalog.code")}</th>
            <th className="border-b px-3 py-2 text-left text-sm">{t("catalog.name")}</th>
            <th className="border-b px-3 py-2 text-left text-sm">{t("catalog.isActive")}</th>
            <th className="w-24 border-b px-3 py-2 text-right text-sm" />
          </tr>
        </thead>
        <tbody>
          {niches.map((n) => (
            <tr key={n.id} className="border-b">
              <td className="px-3 py-2 text-sm">{n.code}</td>
              <td className="px-3 py-2 text-sm">{n.name}</td>
              <td className="px-3 py-2 text-sm">{n.is_active ? "✓" : "—"}</td>
              <td className="px-3 py-2 text-right text-sm">
                <button type="button" onClick={() => openEdit(n)} className="text-gray-600 hover:text-gray-900">
                  {t("common.edit")}
                </button>
                {" · "}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(n.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  {t("common.delete")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <Modal
          title={editingNiche ? t("catalog.editNiche") : t("catalog.addNiche")}
          onClose={handleCloseModal}
        >
          <form onSubmit={handleSubmit}>
            {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("catalog.code")}
                <input
                  name="code"
                  type="text"
                  defaultValue={editingNiche?.code ?? ""}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                {t("catalog.name")}
                <input
                  name="name"
                  type="text"
                  defaultValue={editingNiche?.name ?? ""}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                {t("catalog.parentIdOptional")}
                <input
                  name="parentId"
                  type="text"
                  defaultValue={editingNiche?.parent_id ?? ""}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                {t("catalog.sortOrder")}
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={editingNiche?.sort_order ?? 0}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={editingNiche?.is_active ?? true}
                />
                <span className="text-sm text-gray-700">{t("catalog.isActive")}</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {t("common.save")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          open={true}
          message={t("catalog.confirmDelete")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </section>
  );
}
