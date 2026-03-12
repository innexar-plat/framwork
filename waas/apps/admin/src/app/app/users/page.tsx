"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { TenantLayout } from "@/components/admin/tenant-layout";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { TenantMemberOut } from "@/lib/tenant-api";
import {
  inviteTenantMember,
  listTenantMembers,
  removeTenantMember,
  updateTenantMemberRole,
} from "@/lib/tenant-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AppUsersPage() {
  const { t } = useI18n();
  const { isAuthenticated, hasTenant, me, getAccessToken, tryRefresh } =
    useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TenantMemberOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const token = getAccessToken();
  const isAdmin = me?.role === "admin";

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    listTenantMembers(token, tryRefresh)
      .then(setMembers)
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

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!inviteEmail.trim()) {
      setFormError(t("tenantUsers.email") + " required");
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    inviteTenantMember({ email: inviteEmail.trim(), role: inviteRole }, token, tryRefresh)
      .then(() => {
        setInviteOpen(false);
        setInviteEmail("");
        setInviteRole("member");
        load();
      })
      .catch((err) =>
        setFormError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setSubmitLoading(false));
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    if (!token) return;
    setSubmitLoading(true);
    updateTenantMemberRole(memberId, { role: newRole }, token, tryRefresh)
      .then(() => load())
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setSubmitLoading(false));
  };

  const handleRemoveConfirm = () => {
    if (!token || !confirmRemoveId) return;
    setSubmitLoading(true);
    removeTenantMember(confirmRemoveId, token, tryRefresh)
      .then(() => {
        setConfirmRemoveId(null);
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
          {t("tenantUsers.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("nav.users")}</p>
        {isAdmin && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setInviteOpen(true);
                setFormError(null);
              }}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              {t("tenantUsers.invite")}
            </button>
          </div>
        )}
        {loading ? (
          <p className="mt-4 text-gray-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhum membro.</p>
        ) : (
          <table className="mt-4 w-full table-auto border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("tenantUsers.email")}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {t("tenantUsers.role")}
                </th>
                {isAdmin && (
                  <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700">
                    {t("common.delete")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {m.name ? `${m.name} (${m.email})` : m.email}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {isAdmin ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        disabled={submitLoading}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="editor">editor</option>
                      </select>
                    ) : (
                      m.role
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(m.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {inviteOpen && (
        <Modal
          title={t("tenantUsers.invite")}
          onClose={() => {
            setInviteOpen(false);
            setFormError(null);
          }}
        >
          <form onSubmit={handleInvite}>
            {formError && (
              <p className="mb-2 text-sm text-red-600">{formError}</p>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("tenantUsers.email")}
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <label className="block text-sm font-medium text-gray-700">
                {t("tenantUsers.role")}
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="admin">admin</option>
                <option value="member">member</option>
                <option value="editor">editor</option>
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={submitLoading}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitLoading ? t("common.loading") : t("tenantUsers.invite")}
              </button>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={confirmRemoveId !== null}
        title={t("common.delete")}
        message={t("tenantUsers.confirmRemove")}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmRemoveId(null)}
        confirmLabel={t("common.delete")}
        loading={submitLoading}
      />
    </TenantLayout>
  );
}
