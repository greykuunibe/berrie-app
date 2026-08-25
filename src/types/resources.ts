export type ResourceType =
  | "translation"
  | "commentary"
  | "lexicon"
  | "concordance"
  | "maps";

export interface Resource {
  id: number;
  name: string;
  type: ResourceType;
  language: string;
  license: string | null;
  description: string | null;
  is_free: boolean;
  created_at: string;
}

export interface Commentary {
  id: number;
  resource_id: number | null;
  name: string;
  author: string | null;
  language: string;
}

export interface CommentaryEntry {
  id: number;
  commentary_id: number;
  book_id: number | null;
  chapter_id: number | null;
  from_verse: number | null;
  to_verse: number | null;
  content: string;
}

export interface Lexicon {
  id: number;
  resource_id: number | null;
  strongs_number: string;
  word: string;
  transliteration: string | null;
  pronunciation: string | null;
  definition: string;
  kjv_definition: string | null;
  language: "hebrew" | "greek";
}
