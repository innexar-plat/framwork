"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { BlogPostCreate, BlogPostOut, BlogPostUpdate } from "@/lib/tenant-api";
import {
  createBlogPost,
  deleteBlogPost,
  listBlogPosts,
  updateBlogPost,
} from "@/lib/tenant-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AppBlogPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<BlogPostOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<"create" | "edit" | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPostOut | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const token = getAccessToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    listBlogPosts(token, tryRefresh, {
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
    setEditingPost(null);
    setModalOpen("create");
    setFormError(null);
  };
  const openEdit = (p: BlogPostOut) => {
    setEditingPost(p);
    setModalOpen("edit");
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const slug = (form.elements.namedItem("slug") as HTMLInputElement).value.trim();
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value.trim() || null;
    const status = (form.elements.namedItem("status") as HTMLInputElement).value.trim() || "draft";
    if (!title || !slug) {
      setFormError(t("catalog.codeAndNameRequired"));
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    if (editingPost) {
      const body: BlogPostUpdate = { title, slug, content, status };
      updateBlogPost(editingPost.id, body, token, tryRefresh)
        .then(() => {
          setModalOpen(null);
          setEditingPost(null);
          load();
        })
        .catch((err) => setFormError(err instanceof Error ? err.message : String(err)))
        .finally(() => setSubmitLoading(false));
    } else {
      const body: BlogPostCreate = { title, slug, content, status };
      createBlogPost(body, token, tryRefresh)
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
    deleteBlogPost(confirmDeleteId, token, tryRefresh)
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
        <h1 className="text-2xl font-semibold text-gray-900">{t("nav.blog")}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              {t("blog.filterByStatus")}:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">—</option>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            {t("blog.addPost")}
          </button>
        </div>
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhum post.</p>
        ) : (
          <table className="mt-2 w-full table-auto border border-gray-200">
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
                  <td className="px-3 py-2 text-sm text-gray-900">{item.title}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{item.slug}</td>
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

      {modalOpen !== null && (
      <Modal
        onClose={() => {
          setModalOpen(null);
          setEditingPost(null);
        }}
        title={editingPost ? t("blog.editPost") : t("blog.addPost")}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("blog.title")} *
            </label>
            <input
              name="title"
              type="text"
              required
              maxLength={500}
              defaultValue={editingPost?.title}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("blog.slug")} *
            </label>
            <input
              name="slug"
              type="text"
              required
              maxLength={500}
              defaultValue={editingPost?.slug}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("blog.content")}
            </label>
            <textarea
              name="content"
              rows={5}
              maxLength={50000}
              defaultValue={editingPost?.content ?? ""}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("blog.status")}
            </label>
            <select
              name="status"
              defaultValue={editingPost?.status ?? "draft"}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
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
              onClick={() => {
                setModalOpen(null);
                setEditingPost(null);
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
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={t("common.delete")}
        message={t("blog.confirmDelete")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
        confirmLabel={t("common.delete")}
        loading={submitLoading}
      />
    </TenantLayout>
  );
}
