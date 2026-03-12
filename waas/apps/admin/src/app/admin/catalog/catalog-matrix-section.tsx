"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n";
import type {
  MatrixRowOut,
  ModuleOut,
  NicheOut,
  PlanOut,
} from "@/lib/catalog-admin-api";
import {
  createMatrixRow,
  deleteMatrixRow,
  listMatrix,
  listModules,
  listNiches,
  listPlans,
} from "@/lib/catalog-admin-api";
import { useCallback, useEffect, useState } from "react";

type CatalogMatrixSectionProps = {
  getAccessToken: () => string | null;
  tryRefresh: () => Promise<string | null>;
};

type DeleteTarget = { plan_id: string; niche_id: string; module_id: string };

export function CatalogMatrixSection({
  getAccessToken,
  tryRefresh,
}: CatalogMatrixSectionProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState<MatrixRowOut[]>([]);
  const [plans, setPlans] = useState<PlanOut[]>([]);
  const [niches, setNiches] = useState<NicheOut[]>([]);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const token = getAccessToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    Promise.all([
      listMatrix(token, tryRefresh),
      listPlans(token, tryRefresh),
      listNiches(token, tryRefresh),
      listModules(token, tryRefresh),
    ])
      .then(([matrixData, plansData, nichesData, modulesData]) => {
        setRows(matrixData);
        setPlans(plansData);
        setNiches(nichesData);
        setModules(modulesData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, tryRefresh]);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token, load]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const planId = (form.elements.namedItem("planId") as HTMLSelectElement).value;
    const nicheId = (form.elements.namedItem("nicheId") as HTMLSelectElement).value;
    const moduleId = (form.elements.namedItem("moduleId") as HTMLSelectElement).value;
    const isEnabled = (form.elements.namedItem("isEnabled") as HTMLInputElement).checked;
    if (!planId || !nicheId || !moduleId) {
      setFormError(t("catalog.planNicheModuleRequired"));
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    createMatrixRow({ plan_id: planId, niche_id: nicheId, module_id: moduleId, is_enabled: isEnabled }, token, tryRefresh)
      .then(() => {
        handleCloseModal();
        load();
      })
      .catch((err) => setFormError(err.message))
      .finally(() => setSubmitLoading(false));
  };

  const handleDeleteConfirm = () => {
    if (!token || !confirmDelete) return;
    setSubmitLoading(true);
    deleteMatrixRow(
      confirmDelete.plan_id,
      confirmDelete.niche_id,
      confirmDelete.module_id,
      token,
      tryRefresh
    )
      .then(() => {
        setConfirmDelete(null);
        load();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitLoading(false));
  };

  const planCode = (id: string) => plans.find((p) => p.id === id)?.code ?? id.slice(0, 8);
  const nicheCode = (id: string) => niches.find((n) => n.id === id)?.code ?? id.slice(0, 8);
  const moduleCode = (id: string) => modules.find((m) => m.id === id)?.code ?? id.slice(0, 8);

  if (loading) return <p>{t("common.loading")}</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{t("catalog.matrix")}</h2>
        <button
          type="button"
          onClick={() => { setModalOpen(true); setFormError(null); }}
          className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
        >
          {t("catalog.addMatrixRow")}
        </button>
      </div>
      <table className="mt-2 w-full table-auto border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-b px-3 py-2 text-left text-sm">{t("catalog.planId")}</th>
            <th className="border-b px-3 py-2 text-left text-sm">{t("catalog.nicheId")}</th>
            <th className="border-b px-3 py-2 text-left text-sm">{t("catalog.moduleId")}</th>
            <th className="border-b px-3 py-2 text-left text-sm">{t("catalog.isActive")}</th>
            <th className="w-20 border-b px-3 py-2 text-right text-sm" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="px-3 py-2 text-sm">{planCode(r.plan_id)}</td>
              <td className="px-3 py-2 text-sm">{nicheCode(r.niche_id)}</td>
              <td className="px-3 py-2 text-sm">{moduleCode(r.module_id)}</td>
              <td className="px-3 py-2 text-sm">{r.is_enabled ? "✓" : "—"}</td>
              <td className="px-3 py-2 text-right text-sm">
                <button
                  type="button"
                  onClick={() => setConfirmDelete({ plan_id: r.plan_id, niche_id: r.niche_id, module_id: r.module_id })}
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
        <Modal title={t("catalog.addMatrixRow")} onClose={handleCloseModal}>
          <form onSubmit={handleSubmit}>
            {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("catalog.planId")}
                <select
                  name="planId"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  required
                >
                  <option value="">—</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                {t("catalog.nicheId")}
                <select
                  name="nicheId"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  required
                >
                  <option value="">—</option>
                  {niches.map((n) => (
                    <option key={n.id} value={n.id}>{n.code} — {n.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                {t("catalog.moduleId")}
                <select
                  name="moduleId"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  required
                >
                  <option value="">—</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input name="isEnabled" type="checkbox" defaultChecked />
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

      {confirmDelete && (
        <ConfirmDialog
          open={true}
          message={t("catalog.confirmDelete")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </section>
  );
}
