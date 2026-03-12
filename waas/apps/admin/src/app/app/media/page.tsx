"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { MediaItemOut } from "@/lib/tenant-api";
import {
  deleteMediaItem,
  listMediaItems,
  uploadMediaFile,
} from "@/lib/tenant-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AppMediaPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, getAccessToken, tryRefresh } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<MediaItemOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const token = getAccessToken();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    uploadMediaFile(file, token, tryRefresh)
      .then(() => {
        load();
        e.target.value = "";
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setUploading(false));
  };

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    listMediaItems(token, tryRefresh)
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

  const handleDeleteConfirm = () => {
    if (!token || !confirmDeleteId) return;
    setSubmitLoading(true);
    deleteMediaItem(confirmDeleteId, token, tryRefresh)
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
        <h1 className="text-2xl font-semibold text-gray-900">{t("nav.media")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("media.upload")} para adicionar arquivos (imagens ou PDF).
        </p>
        <div className="mt-3">
          <label className="inline-block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {uploading ? t("common.loading") : t("media.upload")}
            <input
              type="file"
              accept="image/*,.pdf"
              className="sr-only"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        </div>
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhum item.</p>
        ) : (
          <table className="mt-4 w-full table-auto border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("media.name")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("media.storageKey")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("media.mimeType")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("media.sizeBytes")}
                </th>
                <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700">
                  {t("common.delete")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                  <td className="max-w-[120px] truncate px-3 py-2 text-sm text-gray-600">
                    {item.storage_key}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.mime_type ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item.size_bytes != null ? String(item.size_bytes) : "—"}
                  </td>
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

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={t("common.delete")}
        message={t("media.confirmDelete")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
        confirmLabel={t("common.delete")}
        loading={submitLoading}
      />
    </TenantLayout>
  );
}
