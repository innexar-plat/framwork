"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type {
  SitePageCreate,
  SitePageOut,
  SitePageUpdate,
} from "@/lib/tenant-api";
import {
  createSitePage,
  deleteSitePage,
  listSitePages,
  updateSitePage,
} from "@/lib/tenant-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AppPagesPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<SitePageOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<"create" | "edit" | null>(null);
  const [editingPage, setEditingPage] = useState<SitePageOut | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const token = getAccessToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    listSitePages(token, tryRefresh, {
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
    if (!token || !hasTenant) return;
    load();
  }, [token, hasTenant, load]);

  const openCreate = () => {
    setEditingPage(null);
    setModalOpen("create");
    setFormError(null);
  };
  const openEdit = (p: SitePageOut) => {
    setEditingPage(p);
    setModalOpen("edit");
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const slug = (form.elements.namedItem("slug") as HTMLInputElement).value.trim();
    const content =
      (form.elements.namedItem("content") as HTMLTextAreaElement).value.trim() ||
      null;
    const status =
      (form.elements.namedItem("status") as HTMLSelectElement).value || "draft";
    const sortOrder = parseInt(
      (form.elements.namedItem("sort_order") as HTMLInputElement).value || "0",
      10
    );
    if (!title || !slug) {
      setFormError(t("catalog.codeAndNameRequired"));
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    if (editingPage) {
      const body: SitePageUpdate = {
        title,
        slug,
        content,
        status,
        sort_order: sortOrder,
      };
      updateSitePage(editingPage.id, body, token, tryRefresh)
        .then(() => {
          setModalOpen(null);
          setEditingPage(null);
          load();
        })
        .catch((err) =>
          setFormError(err instanceof Error ? err.message : String(err))
        )
        .finally(() => setSubmitLoading(false));
    } else {
      const body: SitePageCreate = {
        title,
        slug,
        content,
        status,
        sort_order: sortOrder,
      };
      createSitePage(body, token, tryRefresh)
        .then(() => {
          setModalOpen(null);
          load();
        })
        .catch((err) =>
          setFormError(err instanceof Error ? err.message : String(err))
        )
        .finally(() => setSubmitLoading(false));
    }
  };

  const handleDeleteConfirm = () => {
    if (!token || !confirmDeleteId) return;
    setSubmitLoading(true);
    deleteSitePage(confirmDeleteId, token, tryRefresh)
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
          {t("pages.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("nav.pages")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {t("pages.addPage")}
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">{t("blog.filterByStatus")}</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhuma página.</p>
        ) : (
          <table className="mt-4 w-full table-auto border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("blog.title")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("blog.slug")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("blog.status")}
                </th>
                <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700">
                  {t("common.edit")} / {t("common.delete")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {item.title}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.slug}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.status}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="mr-2 text-sm text-blue-600 hover:underline"
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

      {modalOpen && (
        <Modal
          title={editingPage ? t("pages.editPage") : t("pages.addPage")}
          onClose={() => {
            setModalOpen(null);
            setEditingPage(null);
          }}
        >
          <form onSubmit={handleSubmit}>
            {formError && (
              <p className="mb-2 text-sm text-red-600">{formError}</p>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("blog.title")}
              </label>
              <input
                name="title"
                type="text"
                defaultValue={editingPage?.title}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <label className="block text-sm font-medium text-gray-700">
                {t("blog.slug")}
              </label>
              <input
                name="slug"
                type="text"
                defaultValue={editingPage?.slug}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <label className="block text-sm font-medium text-gray-700">
                {t("blog.content")}
              </label>
              <textarea
                name="content"
                rows={4}
                defaultValue={editingPage?.content ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <label className="block text-sm font-medium text-gray-700">
                {t("blog.status")}
              </label>
              <select
                name="status"
                defaultValue={editingPage?.status ?? "draft"}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
              <label className="block text-sm font-medium text-gray-700">
                {t("catalog.sortOrder")}
              </label>
              <input
                name="sort_order"
                type="number"
                min={0}
                defaultValue={editingPage?.sort_order ?? 0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={submitLoading}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitLoading ? t("common.loading") : t("common.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(null);
                  setEditingPage(null);
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={t("common.delete")}
        message={t("pages.confirmDelete")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
        confirmLabel={t("common.delete")}
        loading={submitLoading}
      />
    </TenantLayout>
  );
}
