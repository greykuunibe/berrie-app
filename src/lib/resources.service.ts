import { supabase } from "./supabase";
import type { Resource, ResourceType, Commentary, CommentaryEntry, Lexicon } from "@/types";

export async function fetchResources(type?: ResourceType): Promise<Resource[]> {
  let query = supabase
    .from("resources")
    .select("*")
    .order("type")
    .order("name");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchCommentaries(): Promise<Commentary[]> {
  const { data, error } = await supabase
    .from("commentaries")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCommentaryForChapter(
  chapterId: number,
  commentaryId?: number,
): Promise<CommentaryEntry[]> {
  let query = supabase
    .from("commentary_entries")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("from_verse");
  if (commentaryId) query = query.eq("commentary_id", commentaryId);
  const { data, error } = await query;
  if (error) {
    console.error("[commentary] fetch failed:", error.message, { chapterId, commentaryId });
    throw error;
  }
  console.log("[commentary] loaded", data?.length ?? 0, "entries — chapter_id:", chapterId, "commentary_id:", commentaryId ?? "all");
  return data ?? [];
}

export async function fetchLexiconEntry(strongsNumber: string): Promise<Lexicon | null> {
  const { data } = await supabase
    .from("lexicons")
    .select("*")
    .eq("strongs_number", strongsNumber)
    .single();
  return data ?? null;
}

export async function searchLexicon(query: string, language?: "hebrew" | "greek"): Promise<Lexicon[]> {
  let q = supabase
    .from("lexicons")
    .select("*")
    .or(`word.ilike.%${query}%,definition.ilike.%${query}%`)
    .limit(20);
  if (language) q = q.eq("language", language);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
