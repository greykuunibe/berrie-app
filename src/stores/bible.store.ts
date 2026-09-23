import { create } from "zustand";
import type { Book, Chapter, Verse, Translation, Highlight } from "@/types";
import {
  fetchBooks,
  fetchChapters,
  fetchVerses,
  fetchTranslations,
  clearVerseCache,
} from "@/lib/bible.service";

interface BibleStore {
  // State
  books: Book[];
  currentBook: Book | null;
  currentChapter: Chapter | null;
  chapters: Chapter[];
  verses: Verse[];
  translations: Translation[];
  activeTranslation: Translation | null;
  highlights: Highlight[];
  isLoadingBooks: boolean;
  isLoadingChapters: boolean;
  isLoadingVerses: boolean;
  error: string | null;

  // Actions
  loadBooks: () => Promise<void>;
  loadChapters: (bookId: number) => Promise<void>;
  loadVerses: (chapterId: number) => Promise<void>;
  loadTranslations: () => Promise<void>;
  selectBook: (book: Book) => void;
  selectChapter: (chapter: Chapter) => void;
  setActiveTranslation: (translation: Translation) => void;
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (bookId: number, chapter: number, verse: number) => void;
  clearError: () => void;
}

export const useBibleStore = create<BibleStore>((set, get) => ({
  books: [],
  currentBook: null,
  currentChapter: null,
  chapters: [],
  verses: [],
  translations: [],
  activeTranslation: null,
  highlights: [],
  isLoadingBooks: false,
  isLoadingChapters: false,
  isLoadingVerses: false,
  error: null,

  loadBooks: async () => {
    if (get().isLoadingBooks) return;
    set({ isLoadingBooks: true, error: null });
    try {
      const books = await fetchBooks();
      console.log("[bible] loadBooks →", books.length, "books");
      set({ books, isLoadingBooks: false });
    } catch (err) {
      console.error("[bible] loadBooks failed:", err);
      set({ error: (err as Error).message, isLoadingBooks: false });
    }
  },

  loadChapters: async (bookId: number) => {
    set({ isLoadingChapters: true, error: null, chapters: [] });
    try {
      const chapters = await fetchChapters(bookId);
      set({ chapters, isLoadingChapters: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoadingChapters: false });
    }
  },

  loadVerses: async (chapterId: number) => {
    const { activeTranslation } = get();
    if (!activeTranslation) return;
    set({ isLoadingVerses: true, error: null, verses: [] });
    try {
      const verses = await fetchVerses(chapterId, activeTranslation.id);
      set({ verses, isLoadingVerses: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoadingVerses: false });
    }
  },

  loadTranslations: async () => {
    try {
      const translations = await fetchTranslations();
      const activeTranslation =
        translations.find((t) => t.abbreviation === "KJV") ?? translations[0] ?? null;
      set({ translations, activeTranslation });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  selectBook: (book) =>
    set({ currentBook: book, currentChapter: null, chapters: [], verses: [] }),

  selectChapter: (chapter) =>
    set({ currentChapter: chapter, verses: [] }),

  setActiveTranslation: (translation) => {
    clearVerseCache();
    set({ activeTranslation: translation, verses: [] });
  },

  addHighlight: (highlight) =>
    set((state) => ({ highlights: [...state.highlights, highlight] })),

  removeHighlight: (bookId, chapter, verse) =>
    set((state) => ({
      highlights: state.highlights.filter(
        (h) => !(h.book_id === bookId && h.chapter === chapter && h.verse === verse)
      ),
    })),

  clearError: () => set({ error: null }),
}));
