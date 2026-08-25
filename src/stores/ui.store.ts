import { create } from "zustand";
import type { BookCategory, Testament } from "@/types";

type NavSection = "bible" | "notes" | "resources" | "search" | "settings";

interface UIStore {
  activeSection: NavSection;
  isSidebarCollapsed: boolean;
  isResourcePanelOpen: boolean;
  theme: "light" | "dark" | "system";

  // BibleLibrary view state
  bibleLibraryTestament: Testament;
  bibleLibraryCategory: BookCategory | null;

  setActiveSection: (section: NavSection) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleResourcePanel: () => void;
  setResourcePanelOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setBibleLibraryTestament: (testament: Testament) => void;
  setBibleLibraryCategory: (category: BookCategory | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeSection: "bible",
  isSidebarCollapsed: false,
  isResourcePanelOpen: false,
  theme: "system",
  bibleLibraryTestament: "OT",
  bibleLibraryCategory: "Law",

  setActiveSection: (section) => set({ activeSection: section }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleResourcePanel: () =>
    set((state) => ({ isResourcePanelOpen: !state.isResourcePanelOpen })),
  setResourcePanelOpen: (open) => set({ isResourcePanelOpen: open }),
  setTheme: (theme) => set({ theme }),
  setBibleLibraryTestament: (testament) => set({ bibleLibraryTestament: testament }),
  setBibleLibraryCategory: (category) => set({ bibleLibraryCategory: category }),
}));
