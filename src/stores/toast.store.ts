import { create } from "zustand";

export type ToastType = "info" | "success" | "error" | "warning" | "loading";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number; // ms — 0 = persistent until manually dismissed
  action?: ToastAction;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<Omit<ToastItem, "id">>) => void;
  clear: () => void;
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  add: (toast) => {
    const id = makeId();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    return id;
  },

  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  update: (id, updates) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  clear: () => set({ toasts: [] }),
}));
