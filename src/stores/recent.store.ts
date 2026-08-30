import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentItemType = "book" | "note";

export interface RecentItem {
  id: string;
  type: RecentItemType;
  label: string;
  params: Record<string, string>;
  openedAt: number;
}

interface RecentStore {
  items: RecentItem[];
  addRecent: (item: Omit<RecentItem, "openedAt">) => void;
  clearRecents: () => void;
}

const MAX = 12;

export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      items: [],

      addRecent(item) {
        set((s) => {
          const deduped = s.items.filter(
            (i) => !(i.type === item.type && i.id === item.id)
          );
          return {
            items: [{ ...item, openedAt: Date.now() }, ...deduped].slice(0, MAX),
          };
        });
      },

      clearRecents() {
        set({ items: [] });
      },
    }),
    { name: "berrie-recents" }
  )
);
