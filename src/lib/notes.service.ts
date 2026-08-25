import { supabase } from "./supabase";
import type { Note, NoteBlock, NoteBlockType } from "@/types";

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNoteBlocks(noteId: string): Promise<NoteBlock[]> {
  const { data, error } = await supabase
    .from("note_blocks")
    .select("*")
    .eq("note_id", noteId)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

export async function createNote(title = "Untitled"): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .insert({ title })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, "title">>
): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw error;
}

export async function createBlock(block: {
  note_id: string;
  type: NoteBlockType;
  content: Record<string, unknown>;
  position: number;
}): Promise<NoteBlock> {
  const { data, error } = await supabase
    .from("note_blocks")
    .insert(block)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBlock(
  id: string,
  updates: Partial<Pick<NoteBlock, "content" | "position" | "type">>
): Promise<NoteBlock> {
  const { data, error } = await supabase
    .from("note_blocks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBlock(id: string): Promise<void> {
  const { error } = await supabase
    .from("note_blocks")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function reorderBlocks(
  blocks: Array<{ id: string; position: number }>
): Promise<void> {
  await Promise.all(
    blocks.map(({ id, position }) =>
      supabase.from("note_blocks").update({ position }).eq("id", id)
    )
  );
}
