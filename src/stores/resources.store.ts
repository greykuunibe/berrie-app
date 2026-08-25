import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Resource, ResourceType, Commentary, CommentaryEntry, Lexicon } from "@/types";
import {
  fetchResources,
  fetchCommentaries,
  fetchCommentaryForChapter,
  fetchLexiconEntry,
  searchLexicon,
} from "@/lib/resources.service";

type ResourceTab = "commentary" | "lexicon" | "concordance" | "maps";

interface ResourcesStore {
  // State
  resources: Resource[];
  commentaries: Commentary[];
  activeCommentaryId: number | null;
  activeChapterId: number | null;
  commentaryEntries: CommentaryEntry[];
  isLoadingCommentary: boolean;
  /** Per-chapter cache keyed by chapterId — enables instant display on re-visit */
  commentaryCache: Record<number, CommentaryEntry[]>;
  isLoadingLexicon: boolean;
  lexiconEntry: Lexicon | null;
  lexiconResults: Lexicon[];
  activeTab: ResourceTab;
  isPanelOpen: boolean;
  isLoading: boolean;
  isLoadingResources: boolean;
  error: string | null;

  /** IDs of translations the user has downloaded locally */
  localTranslationIds: number[];
  /** IDs of other resources (commentaries, lexicons…) downloaded locally */
  localResourceIds: number[];

  // Actions
  loadResources: (type?: ResourceType) => Promise<void>;
  loadCommentaries: () => Promise<void>;
  loadCommentaryForChapter: (chapterId: number) => Promise<void>;
  prefetchCommentaryForChapter: (chapterId: number) => void;
  setActiveCommentary: (commentaryId: number | null) => void;
  lookupLexicon: (strongsNumber: string) => Promise<void>;
  searchLexicon: (query: string, language?: "hebrew" | "greek") => Promise<void>;
  setActiveTab: (tab: ResourceTab) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  clearError: () => void;

  isTranslationLocal: (id: number) => boolean;
  downloadTranslation: (id: number) => void;
  removeTranslation: (id: number) => void;

  isResourceLocal: (id: number) => boolean;
  downloadResource: (id: number) => void;
  removeResource: (id: number) => void;
}

export const useResourcesStore = create<ResourcesStore>()(
  persist(
    (set, get) => ({
  resources: [],
  commentaries: [],
  activeCommentaryId: null,
  activeChapterId: null,
  commentaryCache: {},
  commentaryEntries: [],
  isLoadingCommentary: false,
  isLoadingLexicon: false,
  lexiconEntry: null,
  lexiconResults: [],
  activeTab: "commentary",
  isPanelOpen: false,
  isLoading: false,
  isLoadingResources: false,
  error: null,
  localTranslationIds: [],
  localResourceIds: [],

  loadResources: async (type?: ResourceType) => {
    set({ isLoadingResources: true, error: null });
    try {
      const resources = await fetchResources(type);
      set({ resources, isLoadingResources: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoadingResources: false });
    }
  },

  loadCommentaries: async () => {
    try {
      const commentaries = await fetchCommentaries();
      const activeCommentaryId = commentaries[0]?.id ?? null;
      set({ commentaries, activeCommentaryId });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  loadCommentaryForChapter: async (chapterId: number) => {
    const { activeCommentaryId, commentaryCache } = get();
    set({ activeChapterId: chapterId });

    // Serve from cache immediately — no spinner, no blank state
    const cached = commentaryCache[chapterId];
    if (cached) {
      set({ commentaryEntries: cached, isLoadingCommentary: false });
      return;
    }

    // No cache yet — show loading indicator while keeping previous entries visible
    set({ isLoadingCommentary: true, error: null });
    try {
      const entries = await fetchCommentaryForChapter(
        chapterId,
        activeCommentaryId ?? undefined,
      );
      set(state => ({
        commentaryEntries: entries,
        commentaryCache: { ...state.commentaryCache, [chapterId]: entries },
        isLoadingCommentary: false,
      }));
    } catch (err) {
      console.error("[resources] commentary load failed:", err);
      set({ error: (err as Error).message, isLoadingCommentary: false });
    }
  },

  // Silent background prefetch — fills the cache without touching isLoadingCommentary
  prefetchCommentaryForChapter: (chapterId: number) => {
    const { activeCommentaryId, commentaryCache } = get();
    if (commentaryCache[chapterId]) return; // already cached
    fetchCommentaryForChapter(chapterId, activeCommentaryId ?? undefined)
      .then(entries => {
        set(state => ({
          commentaryCache: { ...state.commentaryCache, [chapterId]: entries },
        }));
      })
      .catch(() => { /* silent — prefetch failures are non-critical */ });
  },

  setActiveCommentary: (commentaryId) => {
    // Clear cache so new commentary loads fresh data, then reload current chapter
    set({ activeCommentaryId: commentaryId, commentaryEntries: [], commentaryCache: {} });
    const { activeChapterId, loadCommentaryForChapter } = get();
    if (activeChapterId != null) loadCommentaryForChapter(activeChapterId);
  },

  lookupLexicon: async (strongsNumber: string) => {
    set({ isLoadingLexicon: true, lexiconEntry: null });
    try {
      const entry = await fetchLexiconEntry(strongsNumber);
      set({ lexiconEntry: entry, isLoadingLexicon: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoadingLexicon: false });
    }
  },

  searchLexicon: async (query: string, language?: "hebrew" | "greek") => {
    set({ isLoadingLexicon: true });
    try {
      const results = await searchLexicon(query, language);
      set({ lexiconResults: results, isLoadingLexicon: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoadingLexicon: false });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  clearError: () => set({ error: null }),

  isTranslationLocal: (id) => get().localTranslationIds.includes(id),
  downloadTranslation: (id) =>
    set(state => ({
      localTranslationIds: state.localTranslationIds.includes(id)
        ? state.localTranslationIds
        : [...state.localTranslationIds, id],
    })),
  removeTranslation: (id) =>
    set(state => ({ localTranslationIds: state.localTranslationIds.filter(i => i !== id) })),

  isResourceLocal: (id) => get().localResourceIds.includes(id),
  downloadResource: (id) =>
    set(state => ({
      localResourceIds: state.localResourceIds.includes(id)
        ? state.localResourceIds
        : [...state.localResourceIds, id],
    })),
  removeResource: (id) =>
    set(state => ({ localResourceIds: state.localResourceIds.filter(i => i !== id) })),
    }),
    {
      name: "berrie-resources",
      partialize: (state) => ({
        localTranslationIds: state.localTranslationIds,
        localResourceIds: state.localResourceIds,
      }),
    },
  ),
);
