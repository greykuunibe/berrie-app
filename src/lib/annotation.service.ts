import { supabase } from "./supabase";
import type { DbVerseHighlight, DbVerseNote, DbVerseReaction } from "@/types";

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchAnnotationsForChapter(bookId: number, chapterNumber: number) {
  const filter = { book_id: bookId, chapter_num: chapterNumber };

  const [hlRes, noteRes, rxRes] = await Promise.all([
    supabase.from("verse_highlights").select("*").match(filter).order("created_at"),
    supabase.from("verse_notes").select("*").match(filter).order("created_at"),
    supabase.from("verse_reactions").select("*").match(filter).order("created_at"),
  ]);

  return {
    highlights: (hlRes.data ?? []) as DbVerseHighlight[],
    notes: (noteRes.data ?? []) as DbVerseNote[],
    reactions: (rxRes.data ?? []) as DbVerseReaction[],
  };
}

// ── Highlights ────────────────────────────────────────────────────────────────

export async function insertHighlight(
  bookId: number,
  chapterNum: number,
  verseNum: number,
  startOff: number,
  endOff: number,
  color: string,
): Promise<DbVerseHighlight | null> {
  const { data, error } = await supabase
    .from("verse_highlights")
    .insert({ book_id: bookId, chapter_num: chapterNum, verse_num: verseNum, start_off: startOff, end_off: endOff, color })
    .select()
    .single();
  if (error) { console.error("[annotation] insertHighlight", error); return null; }
  return data as DbVerseHighlight;
}

export async function deleteHighlight(id: string): Promise<void> {
  const { error } = await supabase.from("verse_highlights").delete().eq("id", id);
  if (error) console.error("[annotation] deleteHighlight", error);
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function insertNote(
  bookId: number,
  chapterNum: number,
  verseNum: number,
  startOff: number,
  endOff: number,
  content: string,
): Promise<DbVerseNote | null> {
  const { data, error } = await supabase
    .from("verse_notes")
    .insert({ book_id: bookId, chapter_num: chapterNum, verse_num: verseNum, start_off: startOff, end_off: endOff, content })
    .select()
    .single();
  if (error) { console.error("[annotation] insertNote", error); return null; }
  return data as DbVerseNote;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("verse_notes").delete().eq("id", id);
  if (error) console.error("[annotation] deleteNote", error);
}

// ── Reactions ─────────────────────────────────────────────────────────────────

export async function upsertReaction(
  bookId: number,
  chapterNum: number,
  verseNum: number,
  startOff: number,
  endOff: number,
  emoji: string,
): Promise<DbVerseReaction | null> {
  const { data, error } = await supabase
    .from("verse_reactions")
    .upsert(
      { book_id: bookId, chapter_num: chapterNum, verse_num: verseNum, start_off: startOff, end_off: endOff, emoji },
      { onConflict: "book_id,chapter_num,verse_num,start_off,end_off" },
    )
    .select()
    .single();
  if (error) { console.error("[annotation] upsertReaction", error); return null; }
  return data as DbVerseReaction;
}

export async function deleteReaction(id: string): Promise<void> {
  const { error } = await supabase.from("verse_reactions").delete().eq("id", id);
  if (error) console.error("[annotation] deleteReaction", error);
}
