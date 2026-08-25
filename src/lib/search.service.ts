import { supabase } from "./supabase";

export interface VerseSearchResult {
  verse_id: number;
  book_name: string;
  book_id: number;
  chapter_num: number;
  verse_num: number;
  text: string;
  rank: number;
}

export async function searchVerses(
  query: string,
  translation = "KJV",
  limit = 20
): Promise<VerseSearchResult[]> {
  const { data, error } = await supabase.rpc("search_verses", {
    query,
    translation,
    lim: limit,
  });
  if (error) throw error;
  return data ?? [];
}
