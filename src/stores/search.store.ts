import { create } from "zustand";
import { searchVerses } from "@/lib/search.service";
import type { VerseSearchResult } from "@/lib/search.service";

interface SearchStore {
  // State
  query: string;
  results: VerseSearchResult[];
  activeTranslation: string;
  isSearching: boolean;
  error: string | null;

  // Actions
  search: (query: string, translation?: string) => Promise<void>;
  setQuery: (query: string) => void;
  setActiveTranslation: (translation: string) => void;
  clearResults: () => void;
  clearError: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: "",
  results: [],
  activeTranslation: "KJV",
  isSearching: false,
  error: null,

  search: async (query: string, translation?: string) => {
    if (!query.trim()) return;
    set((state) => ({
      query,
      isSearching: true,
      error: null,
      activeTranslation: translation ?? state.activeTranslation,
    }));
    try {
      const results = await searchVerses(
        query,
        translation,
        30
      );
      set({ results, isSearching: false });
    } catch (err) {
      set({ error: (err as Error).message, isSearching: false });
    }
  },

  setQuery: (query) => set({ query }),
  setActiveTranslation: (translation) => set({ activeTranslation: translation }),
  clearResults: () => set({ results: [], query: "" }),
  clearError: () => set({ error: null }),
}));
