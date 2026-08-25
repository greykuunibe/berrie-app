import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Book, Chapter, Verse } from "@/types";

export function useTauri() {
  const isDesktop = isTauri();

  async function getBooks(): Promise<Book[]> {
    if (!isDesktop) return [];
    return invoke<Book[]>("get_books");
  }

  async function getChapters(bookId: number): Promise<Chapter[]> {
    if (!isDesktop) return [];
    return invoke<Chapter[]>("get_chapters", { bookId: bookId });
  }

  async function getVerses(chapterId: number, translationId: number): Promise<Verse[]> {
    if (!isDesktop) return [];
    return invoke<Verse[]>("get_verses", { chapterId: chapterId, translationId: translationId });
  }

  async function searchLocal(query: string): Promise<{ verses: Verse[]; noteIds: number[] }> {
    if (!isDesktop) return { verses: [], noteIds: [] };
    return invoke("full_text_search", { query });
  }

  return { getBooks, getChapters, getVerses, searchLocal, isDesktop };
}
