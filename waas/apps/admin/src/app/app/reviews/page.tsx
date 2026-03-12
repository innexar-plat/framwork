"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type {
  ReviewCreate,
  ReviewResponse,
  ReviewUpdate,
} from "@/lib/tenant-api";
import {
  createReview,
  deleteReview,
  listReviews,
  updateReview,
} from "@/lib/tenant-api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STAR_FILL = "#f59e0b";
const STAR_EMPTY = "#4a5568";

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5" role={readonly ? undefined : "slider"} aria-valuenow={value}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(i)}
          className="disabled:cursor-default"
          aria-label={readonly ? undefined : `Rating ${i}`}
        >
          <svg
            className="h-5 w-5"
            fill={i <= value ? STAR_FILL : STAR_EMPTY}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function AppReviewsPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "published" | "drafts">("all");
  const [modalOpen, setModalOpen] = useState<"create" | "edit" | null>(null);
  const [editingReview, setEditingReview] = useState<ReviewResponse | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [modalRating, setModalRating] = useState(5);
  const token = getAccessToken();

  useEffect(() => {
    if (editingReview) setModalRating(editingReview.rating);
    else setModalRating(5);
  }, [editingReview, modalOpen]);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const published: boolean | undefined =
      tab === "published" ? true : tab === "drafts" ? false : undefined;
    listReviews(token, tryRefresh, {
      ...(published !== undefined && { published }),
    })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [token, tryRefresh, tab]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
    if (isAuthenticated && !hasTenant) router.replace("/");
  }, [isAuthenticated, hasTenant, router]);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token, load]);

  const handleTogglePublished = (r: ReviewResponse) => {
    if (!token) return;
    updateReview(r.id, { is_published: !r.is_published }, token, tryRefresh)
      .then(() => load())
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const author_name = (form.elements.namedItem("author_name") as HTMLInputElement).value.trim();
    const rating = modalRating;
    const text = (form.elements.namedItem("text") as HTMLTextAreaElement).value.trim();
    const author_photo = (form.elements.namedItem("author_photo") as HTMLInputElement)?.value.trim() || undefined;
    const source = ((form.elements.namedItem("source") as HTMLSelectElement)?.value ?? "manual") as "manual" | "google";
    const publish_now = (form.elements.namedItem("publish_now") as HTMLInputElement)?.checked ?? false;
    if (!author_name || !text || rating < 1 || rating > 5) {
      setFormError("Author name, rating (1–5), and text are required.");
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    if (editingReview) {
      const body: ReviewUpdate = {
        author_name,
        rating,
        text,
        author_photo: author_photo || undefined,
        is_published: publish_now,
      };
      updateReview(editingReview.id, body, token, tryRefresh)
        .then(() => {
          setModalOpen(null);
          setEditingReview(null);
          load();
        })
        .catch((err) => setFormError(err instanceof Error ? err.message : String(err)))
        .finally(() => setSubmitLoading(false));
    } else {
      const body: ReviewCreate = {
        author_name,
        rating,
        text,
        author_photo,
        source,
      };
      createReview(body, token, tryRefresh)
        .then((created) => {
          if (publish_now) {
            return updateReview(created.id, { is_published: true }, token, tryRefresh);
          }
          return Promise.resolve(created);
        })
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
    deleteReview(confirmDeleteId, token, tryRefresh)
      .then(() => {
        setConfirmDeleteId(null);
        load();
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setSubmitLoading(false));
  };

  const openEdit = (r: ReviewResponse) => {
    setEditingReview(r);
    setModalOpen("edit");
    setFormError(null);
  };

  if (!isAuthenticated) return null;
  if (hasTenant === false) return null;

  return (
    <TenantLayout>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("reviews.title")}
          </h1>
          <button
            type="button"
            onClick={() => {
              setEditingReview(null);
              setModalOpen("create");
              setFormError(null);
            }}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            + {t("reviews.add")}
          </button>
        </div>

        <div className="mt-4 flex gap-1 border-b border-gray-200">
          {(["all", "published", "drafts"] as const).map((tabs) => (
            <button
              key={tabs}
              type="button"
              onClick={() => setTab(tabs)}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === tabs
                  ? "border-gray-800 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tabs === "all"
                ? "All"
                : tabs === "published"
                  ? t("reviews.published")
                  : t("reviews.draft")}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-6 text-gray-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-6 text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
            <span className="text-4xl" aria-hidden>
              ⭐
            </span>
            <p className="mt-3 text-gray-600">{t("reviews.empty")}</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <div
                key={r.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                    {r.author_photo ? (
                      <Image
                        src={r.author_photo}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-500">
                        {r.author_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{r.author_name}</p>
                    <StarRating value={r.rating} readonly />
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  &quot;{r.text}&quot;
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {r.source === "google" ? t("reviews.source_google") : t("reviews.source_manual")}
                  </span>
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={r.is_published}
                      onChange={() => handleTogglePublished(r)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-600">
                      {r.is_published ? t("reviews.published") : t("reviews.draft")}
                    </span>
                  </label>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(r.id)}
                    className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen !== null}
        onClose={() => {
          setModalOpen(null);
          setEditingReview(null);
          setFormError(null);
        }}
        title={editingReview ? t("reviews.edit") : t("reviews.add")}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("reviews.author")} *
            </label>
            <input
              name="author_name"
              type="text"
              required
              defaultValue={editingReview?.author_name}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("reviews.rating")} (1–5) *
            </label>
            <StarRating
              value={modalRating}
              onChange={(v) => setModalRating(v)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("reviews.text")} *
            </label>
            <textarea
              name="text"
              required
              rows={4}
              defaultValue={editingReview?.text}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("reviews.photo")}
            </label>
            <input
              name="author_photo"
              type="url"
              defaultValue={editingReview?.author_photo ?? ""}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="https://"
            />
          </div>
          {!editingReview && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("reviews.source")}
              </label>
              <select
                name="source"
                defaultValue="manual"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="manual">{t("reviews.source_manual")}</option>
                <option value="google">{t("reviews.source_google")}</option>
              </select>
            </div>
          )}
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                name="publish_now"
                type="checkbox"
                defaultChecked={editingReview?.is_published ?? false}
                className="rounded border-gray-300"
              />
              {t("reviews.publish_now")}
            </label>
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
                setEditingReview(null);
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
        message={t("reviews.confirmDelete")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
        confirmLabel={t("common.delete")}
        loading={submitLoading}
      />
    </TenantLayout>
  );
}
