import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Resource, ResourceType, Commentary, CommentaryEntry, Lexicon, CrossReference } from "@/types";
import {
  fetchResources,
  fetchCommentaries,
  fetchCommentaryForChapter,
  fetchLexiconEntry,
  searchLexicon,
} from "@/lib/resources.service";
import { fetchCrossReferencesForChapter, fetchChapters, fetchVerses } from "@/lib/bible.service";
import { useBibleStore } from "@/stores/bible.store";

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

  crossRefs: CrossReference[];
  crossRefVerseTexts: Record<string, string>;
  isLoadingCrossRefs: boolean;
  crossRefCache: Record<string, { refs: CrossReference[]; verseTexts: Record<string, string> }>;
  loadCrossRefsForChapter: (bookId: number, chapterNum: number) => Promise<void>;
  prefetchCrossRefsForChapter: (bookId: number, chapterNum: number) => void;

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
  crossRefs: [],
  crossRefVerseTexts: {},
  isLoadingCrossRefs: false,
  crossRefCache: {},

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

  loadCrossRefsForChapter: async (bookId: number, chapterNum: number) => {
    const cacheKey = `${bookId}:${chapterNum}`;
    const cached = get().crossRefCache[cacheKey];
    if (cached) {
      set({ crossRefs: cached.refs, crossRefVerseTexts: cached.verseTexts });
      return;
    }
    set({ isLoadingCrossRefs: true });
    try {
      const refs = await fetchCrossReferencesForChapter(bookId, chapterNum);
      const translationId = useBibleStore.getState().activeTranslation?.id;
      const verseTexts: Record<string, string> = {};
      if (translationId && refs.length) {
        const targets = [...new Map(refs.map(r => [`${r.to_book_id}:${r.to_chapter}`, r])).values()];
        await Promise.all(targets.map(async ref => {
          try {
            const chaps = await fetchChapters(ref.to_book_id);
            const ch = chaps.find(c => c.number === ref.to_chapter);
            if (!ch) return;
            const verses = await fetchVerses(ch.id, translationId);
            verses.forEach(v => {
              verseTexts[`${ref.to_book_id}:${ref.to_chapter}:${v.number}`] = v.text;
            });
          } catch { /* best-effort per target */ }
        }));
      }
      set(state => ({
        crossRefs: refs,
        crossRefVerseTexts: verseTexts,
        isLoadingCrossRefs: false,
        crossRefCache: { ...state.crossRefCache, [cacheKey]: { refs, verseTexts } },
      }));
    } catch (err) {
      set({ isLoadingCrossRefs: false, error: (err as Error).message });
    }
  },

  prefetchCrossRefsForChapter: (bookId: number, chapterNum: number) => {
    const cacheKey = `${bookId}:${chapterNum}`;
    if (get().crossRefCache[cacheKey]) return;
    get().loadCrossRefsForChapter(bookId, chapterNum).catch(() => {});
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
