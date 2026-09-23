import { useToastStore } from "@/stores/toast.store";
import type { ToastAction, ToastType } from "@/stores/toast.store";

const DURATIONS: Record<ToastType, number> = {
  info:    3000,
  success: 3000,
  warning: 4000,
  error:   5000,
  loading: 0,
};

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

function add(type: ToastType, message: string, options?: ToastOptions): string {
  return useToastStore.getState().add({
    type,
    message,
    duration: options?.duration ?? DURATIONS[type],
    action: options?.action,
  });
}

function dismiss(id?: string) {
  if (id) {
    useToastStore.getState().remove(id);
  } else {
    useToastStore.getState().clear();
  }
}

async function promise<T>(
  p: Promise<T>,
  messages: { loading: string; success: string | ((data: T) => string); error: string | ((err: unknown) => string) },
  options?: ToastOptions,
): Promise<T> {
  const id = add("loading", messages.loading, { duration: 0 });
  try {
    const result = await p;
    const msg = typeof messages.success === "function" ? messages.success(result) : messages.success;
    useToastStore.getState().update(id, { type: "success", message: msg, duration: options?.duration ?? DURATIONS.success });
    return result;
  } catch (err) {
    const msg = typeof messages.error === "function" ? messages.error(err) : messages.error;
    useToastStore.getState().update(id, { type: "error", message: msg, duration: options?.duration ?? DURATIONS.error });
    throw err;
  }
}

export const toast = {
  info:    (message: string, options?: ToastOptions) => add("info",    message, options),
  success: (message: string, options?: ToastOptions) => add("success", message, options),
  warning: (message: string, options?: ToastOptions) => add("warning", message, options),
  error:   (message: string, options?: ToastOptions) => add("error",   message, options),
  loading: (message: string, options?: ToastOptions) => add("loading", message, { duration: 0, ...options }),
  promise,
  dismiss,
};
