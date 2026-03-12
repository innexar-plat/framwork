"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type {
  ScheduleItemCreate,
  ScheduleItemOut,
  ScheduleItemUpdate,
} from "@/lib/tenant-api";
import {
  createScheduleItem,
  deleteScheduleItem,
  listScheduleItems,
  updateScheduleItem,
} from "@/lib/tenant-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function toLocalDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return "";
  }
}

export default function AppSchedulePage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ScheduleItemOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<"create" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItemOut | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const token = getAccessToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    listScheduleItems(token, tryRefresh, {
      status: statusFilter || undefined,
      limit: 50,
    })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [token, tryRefresh, statusFilter]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
    if (isAuthenticated && !hasTenant) router.replace("/");
  }, [isAuthenticated, hasTenant, router]);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token, load]);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen("create");
    setFormError(null);
  };
  const openEdit = (item: ScheduleItemOut) => {
    setEditingItem(item);
    setModalOpen("edit");
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const startAt = (form.elements.namedItem("start_at") as HTMLInputElement).value;
    const endAt = (form.elements.namedItem("end_at") as HTMLInputElement).value;
    const status = (form.elements.namedItem("status") as HTMLInputElement).value.trim() || "scheduled";
    const contact_name = (form.elements.namedItem("contact_name") as HTMLInputElement).value.trim() || null;
    const contact_email = (form.elements.namedItem("contact_email") as HTMLInputElement).value.trim() || null;
    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement).value.trim() || null;
    if (!title || !startAt || !endAt) {
      setFormError(t("catalog.codeAndNameRequired"));
      return;
    }
    const startIso = new Date(startAt).toISOString();
    const endIso = new Date(endAt).toISOString();
    setSubmitLoading(true);
    setFormError(null);
    if (editingItem) {
      const body: ScheduleItemUpdate = {
        title,
        start_at: startIso,
        end_at: endIso,
        status,
        contact_name,
        contact_email,
        notes,
      };
      updateScheduleItem(editingItem.id, body, token, tryRefresh)
        .then(() => {
          setModalOpen(null);
          setEditingItem(null);
          load();
        })
        .catch((err) => setFormError(err instanceof Error ? err.message : String(err)))
        .finally(() => setSubmitLoading(false));
    } else {
      const body: ScheduleItemCreate = {
        title,
        start_at: startIso,
        end_at: endIso,
        status,
        contact_name,
        contact_email,
        notes,
      };
      createScheduleItem(body, token, tryRefresh)
        .then(() => {
          setModalOpen(null);
          load();
        })
        .catch((err) => setFormError(err instanceof Error ? err.message : String(err)))
        .finally(() => setSubmitLoading(false));
    }
  };

  const handleDeleteConfirm = () => {
    if (!token || !confirmDeleteId) return;
    setSubmitLoading(true);
    deleteScheduleItem(confirmDeleteId, token, tryRefresh)
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
          {t("nav.schedule")}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">{t("blog.filterByStatus")}: —</option>
            <option value="scheduled">scheduled</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button
            type="button"
            onClick={openCreate}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            {t("schedule.addItem")}
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
                  {t("schedule.title")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("schedule.startAt")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("schedule.endAt")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("schedule.status")}
                </th>
                <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700">
                  {t("common.edit")} / {t("common.delete")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-900">{item.title}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.start_at ? new Date(item.start_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.end_at ? new Date(item.end_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">{item.status}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="mr-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                      {t("common.edit")}
                    </button>
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
        open={modalOpen !== null}
        onClose={() => {
          setModalOpen(null);
          setEditingItem(null);
        }}
        title={editingItem ? t("schedule.editItem") : t("schedule.addItem")}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("schedule.title")} *
            </label>
            <input
              name="title"
              type="text"
              required
              maxLength={500}
              defaultValue={editingItem?.title}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("schedule.startAt")} *
              </label>
              <input
                name="start_at"
                type="datetime-local"
                required
                defaultValue={
                  editingItem?.start_at
                    ? toLocalDatetime(editingItem.start_at)
                    : ""
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("schedule.endAt")} *
              </label>
              <input
                name="end_at"
                type="datetime-local"
                required
                defaultValue={
                  editingItem?.end_at
                    ? toLocalDatetime(editingItem.end_at)
                    : ""
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("schedule.status")}
            </label>
            <select
              name="status"
              defaultValue={editingItem?.status ?? "scheduled"}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="scheduled">scheduled</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("schedule.contactName")}
            </label>
            <input
              name="contact_name"
              type="text"
              maxLength={255}
              defaultValue={editingItem?.contact_name ?? ""}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("schedule.contactEmail")}
            </label>
            <input
              name="contact_email"
              type="email"
              maxLength={255}
              defaultValue={editingItem?.contact_email ?? ""}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("schedule.notes")}
            </label>
            <textarea
              name="notes"
              rows={2}
              maxLength={2000}
              defaultValue={editingItem?.notes ?? ""}
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
              onClick={() => {
                setModalOpen(null);
                setEditingItem(null);
              }}
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
        message={t("schedule.confirmDelete")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
        confirmLabel={t("common.delete")}
        loading={submitLoading}
      />
    </TenantLayout>
  );
}
