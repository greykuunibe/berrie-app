import { supabase } from "./supabase";
import type { Book, Chapter, Translation, Verse, CrossReference } from "@/types";

// ── Session-level verse cache ─────────────────────────────────────────────────
// Key: `${translationId}:${chapterId}` — cleared when translation changes
const verseCache = new Map<string, Verse[]>();

export function clearVerseCache() {
  verseCache.clear();
}

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("book_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchBooksByTestament(testament: "OT" | "NT"): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("testament", testament)
    .order("book_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchTranslations(): Promise<Translation[]> {
  const { data, error } = await supabase
    .from("translations")
    .select("*")
    .order("abbreviation");
  if (error) throw error;
  return data ?? [];
}

export async function fetchChapters(bookId: number): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .order("number");
  if (error) throw error;
  return data ?? [];
}

export async function fetchVerses(
  chapterId: number,
  translationId: number
): Promise<Verse[]> {
  const key = `${translationId}:${chapterId}`;
  if (verseCache.has(key)) return verseCache.get(key)!;

  const { data, error } = await supabase
    .from("verses")
    .select("*")
    .eq("chapter_id", chapterId)
    .eq("translation_id", translationId)
    .order("number");
  if (error) throw error;
  const verses = data ?? [];
  // Only cache non-empty results — an empty array could be a transient failure
  if (verses.length > 0) verseCache.set(key, verses);
  return verses;
}

export async function fetchVersesByRef(
  bookId: number,
  chapterNumber: number,
  translationId: number
): Promise<Verse[]> {
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("book_id", bookId)
    .eq("number", chapterNumber)
    .single();
  if (!chapter) return [];
  return fetchVerses(chapter.id, translationId);
}

export async function fetchCrossReferencesForChapter(
  bookId: number,
  chapter: number,
  minVotes = 3
): Promise<CrossReference[]> {
  const { data, error } = await supabase
    .from("cross_references")
    .select("*")
    .eq("from_book_id", bookId)
    .eq("from_chapter", chapter)
    .gte("votes", minVotes)
    .order("from_verse")
    .order("votes", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCrossReferences(
  bookId: number,
  chapter: number,
  verse: number,
  minVotes = 5
): Promise<CrossReference[]> {
  const { data, error } = await supabase
    .from("cross_references")
    .select("*")
    .eq("from_book_id", bookId)
    .eq("from_chapter", chapter)
    .eq("from_verse", verse)
    .gte("votes", minVotes)
    .order("votes", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
