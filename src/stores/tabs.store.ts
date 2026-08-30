import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tab, TabDescriptor, TabParams } from "@/types/tabs";

const DEFAULT_TABS: Tab[] = [
  { id: "default-home",  type: "home",       label: "Home",  params: {} },
  { id: "default-notes", type: "notes-list", label: "Notes", params: {} },
];

const GENESIS_TAB: Tab = {
  id: "initial-genesis",
  type: "reader",
  label: "Genesis",
  params: { bookId: "1" },
};

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Checks whether descriptor params are a subset of the existing tab's params.
// Allows stored tabs to have extra runtime params (e.g. chapter) without breaking deduplication.
function paramsSubset(descriptor: TabParams, existing: TabParams): boolean {
  return Object.keys(descriptor).every((k) => existing[k] === descriptor[k]);
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

export const useTabsStore = create<TabsStore>()(
  persist(
    (set, get) => ({
  tabs: [...DEFAULT_TABS, GENESIS_TAB],
  activeTabId: GENESIS_TAB.id,
  sideTabId: null,
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
      (t) => t.type === descriptor.type && paramsSubset(descriptor.params, t.params)
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
      (t) => t.type === descriptor.type && paramsSubset(descriptor.params, t.params)
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
    const tab = tabs.find((t) => t.id === id);
    if (!tab || tab.type === "home" || tab.type === "bible-library" || tab.type === "notes-list") return;
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    // If closing the active tab, prefer the adjacent user tab;
    // if no user tabs remain, fall back to the Bible (library) tab.
    let newActive = activeTabId;
    if (id === activeTabId) {
      const remainingUser = next.filter((t) => t.type !== "bible-library" && t.type !== "notes-list");
      if (remainingUser.length > 0) {
        newActive = next[Math.max(0, idx - 1)].id;
      } else {
        newActive = "default-home";
      }
    }
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
    }),
    {
      name: "berrie-tabs",
      merge(persisted: any, current) {
        const stored: Tab[] = persisted?.tabs ?? [];
        const defaults = DEFAULT_TABS.map((d) => stored.find((t) => t.id === d.id) ?? d);
        // Strip any stale navigation tabs that are no longer in DEFAULT_TABS
        const NAV_TYPES = new Set(["home", "bible-library", "notes-list"]);
        const userTabs = stored.filter(
          (t) => !DEFAULT_TABS.some((d) => d.id === t.id) && !NAV_TYPES.has(t.type)
        );
        return {
          ...current,
          ...persisted,
          tabs: [...defaults, ...userTabs],
        };
      },
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);
