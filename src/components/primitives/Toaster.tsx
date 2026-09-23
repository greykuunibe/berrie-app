import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useToastStore } from "@/stores/toast.store";
import type { ToastItem, ToastType } from "@/stores/toast.store";

// ── Per-type action color ────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, { color: string }> = {
  success: { color: "#4ade80" },
  error:   { color: "#f87171" },
  warning: { color: "#facc15" },
  info:    { color: "#94a3b8" },
  loading: { color: "#94a3b8" },
};

// ── Single toast pill ─────────────────────────────────────────────────────────

function Toast({ toast }: { toast: ToastItem }) {
  const remove = useToastStore((s) => s.remove);
  const { color } = TYPE_CONFIG[toast.type];

  useEffect(() => {
    if (!toast.duration) return;
    const t = setTimeout(() => remove(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full"
      style={{ background: "#1c1c1e", color: "#f5f5f4" }}
    >
      {/* Message */}
      <p className="flex-1 text-sm font-medium leading-snug" style={{ color: "#f5f5f4" }}>
        {toast.message}
      </p>

      {/* Action */}
      {toast.action && (
        <button
          type="button"
          onClick={() => { toast.action!.onClick(); remove(toast.id); }}
          className="shrink-0 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-70"
          style={{ color }}
        >
          {toast.action.label}
        </button>
      )}
    </motion.div>
  );
}

// ── Toaster container ─────────────────────────────────────────────────────────

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const visible = toasts.slice(-4); // show at most 4

  return createPortal(
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse gap-2 items-center pointer-events-none"
      style={{ width: "max-content", maxWidth: "calc(100vw - 32px)" }}
    >
      <AnimatePresence initial={false} mode="sync">
        {visible.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full">
            <Toast toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
