import { create } from "zustand";
import type { Tab, TabDescriptor, TabParams } from "@/types/tabs";

const DEFAULT_TAB: Tab = {
  id: "default-bible-library",
  type: "bible-library",
  label: "Library",
  params: {},
};

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function paramsMatch(a: TabParams, b: TabParams): boolean {
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  return ka.join() === kb.join() && ka.every((k) => a[k] === b[k]);
}

interface TabsStore {
  tabs: Tab[];
  activeTabId: string;
  sideTabId: string | null;

  openTab(descriptor: TabDescriptor, opts?: { replace?: boolean }): void;
  openInNewTab(descriptor: TabDescriptor): void;
  openInSide(descriptor: TabDescriptor): void;
  closeTab(id: string): void;
  closeSide(): void;
  activateTab(id: string): void;
  updateTabParams(id: string, params: Partial<TabParams>): void;
  updateTabLabel(id: string, label: string): void;
}

export const useTabsStore = create<TabsStore>((set, get) => ({
  tabs: [DEFAULT_TAB],
  activeTabId: DEFAULT_TAB.id,
  sideTabId: null,

  openTab(descriptor, opts) {
    const { tabs, activeTabId } = get();

    if (opts?.replace) {
      set({
        tabs: tabs.map((t) =>
          t.id === activeTabId ? { ...descriptor, id: activeTabId } : t
        ),
      });
      return;
    }

    const existing = tabs.find(
      (t) => t.type === descriptor.type && paramsMatch(t.params, descriptor.params)
    );
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    const id = makeId();
    set({ tabs: [...tabs, { ...descriptor, id }], activeTabId: id });
  },

  openInNewTab(descriptor) {
    const id = makeId();
    set((s) => ({ tabs: [...s.tabs, { ...descriptor, id }], activeTabId: id }));
  },

  openInSide(descriptor) {
    const { tabs } = get();
    const existing = tabs.find(
      (t) => t.type === descriptor.type && paramsMatch(t.params, descriptor.params)
    );
    if (existing) {
      set({ sideTabId: existing.id });
      return;
    }
    const id = makeId();
    set((s) => ({ tabs: [...s.tabs, { ...descriptor, id }], sideTabId: id }));
  },

  closeTab(id) {
    const { tabs, activeTabId, sideTabId } = get();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    const newActive =
      id === activeTabId ? next[Math.max(0, idx - 1)].id : activeTabId;
    set({ tabs: next, activeTabId: newActive, sideTabId: sideTabId === id ? null : sideTabId });
  },

  closeSide() {
    set({ sideTabId: null });
  },

  activateTab(id) {
    set({ activeTabId: id });
  },

  updateTabParams(id, params) {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, params: { ...t.params, ...params } } : t
      ),
    }));
  },

  updateTabLabel(id, label) {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, label } : t)),
    }));
  },
}));
