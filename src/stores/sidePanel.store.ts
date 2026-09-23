import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidePanelContent = "resources";

interface SidePanelStore {
  content: SidePanelContent | null;
  open: (content: SidePanelContent) => void;
  close: () => void;
  toggle: (content: SidePanelContent) => void;
}

export const useSidePanelStore = create<SidePanelStore>()(
  persist(
    (set, get) => ({
      content: null,
      open: (content) => set({ content }),
      close: () => set({ content: null }),
      toggle: (content) => set({ content: get().content === content ? null : content }),
    }),
    { name: "berrie-side-panel", partialize: (s) => ({ content: s.content }) }
  )
);
