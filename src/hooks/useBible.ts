import { useEffect } from "react";
import { useBibleStore } from "@/stores/bible.store";

export function useBible() {
  const store = useBibleStore();

  // Auto-load books and translations on first use
  useEffect(() => {
    if (store.books.length === 0 && !store.isLoadingBooks) {
      store.loadBooks();
    }
    if (store.translations.length === 0) {
      store.loadTranslations();
    }
  }, []);

  // Auto-load chapters when a book is selected
  useEffect(() => {
    if (store.currentBook && store.chapters.length === 0 && !store.isLoadingChapters) {
      store.loadChapters(store.currentBook.id);
    }
  }, [store.currentBook]);

  // Auto-load verses when a chapter is selected
  useEffect(() => {
    if (store.currentChapter && store.verses.length === 0 && !store.isLoadingVerses) {
      store.loadVerses(store.currentChapter.id);
    }
  }, [store.currentChapter, store.activeTranslation]);

  return store;
}
