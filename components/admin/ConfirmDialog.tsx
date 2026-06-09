"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, Info, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  loading?: boolean;
}

const VARIANT_META: Record<
  DialogVariant,
  { icon: typeof Info; iconClasses: string; confirmClasses: string }
> = {
  danger: {
    icon: AlertCircle,
    iconClasses: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/50",
    confirmClasses:
      "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
  },
  warning: {
    icon: AlertTriangle,
    iconClasses: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/50",
    confirmClasses:
      "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600",
  },
  info: {
    icon: Info,
    iconClasses: "bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/50",
    confirmClasses:
      "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy && !loading) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, loading, onClose]);

  if (!open) return null;

  const meta = VARIANT_META[variant];
  const Icon = meta.icon;

  async function handleConfirm() {
    if (busy || loading) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={() => !busy && !loading && onClose()}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <div
            className={cn(
              "grid h-10 w-10 flex-shrink-0 place-items-center rounded-full ring-1",
              meta.iconClasses
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              {title}
            </h3>
            {description && (
              <div className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                {description}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={busy || loading}
            className="grid h-7 w-7 flex-shrink-0 place-items-center rounded text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50/50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={busy || loading}
            className="rounded-md border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || loading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition disabled:opacity-60",
              meta.confirmClasses
            )}
          >
            {busy || loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                处理中...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
