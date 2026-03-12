"use client";

type ConfirmDialogProps = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  title?: string;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  title,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;
  const confirmClass =
    variant === "danger"
      ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/30"
      : "btn-primary";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl bg-surface border border-border p-5 shadow-lg">
        {title && (
          <h3 className="mb-2 text-base font-semibold text-primary font-heading">
            {title}
          </h3>
        )}
        <p className="mb-5 text-sm text-secondary leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-ghost text-sm py-2 px-4"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${confirmClass}`}
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
