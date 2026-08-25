export type Testament = "OT" | "NT";

export type BookCategory =
  | "Law"
  | "History"
  | "Poetry & Wisdom"
  | "Major Prophets"
  | "Minor Prophets"
  | "Gospels"
  | "Acts"
  | "Pauline Epistles"
  | "General Epistles"
  | "Prophecy";

export interface Translation {
  id: number;
  abbreviation: string;
  title: string;
  language: string;
  license: string | null;
  created_at: string;
}

export interface Book {
  id: number;
  name: string;
  abbreviation: string;
  testament: Testament;
  category: BookCategory;
  book_order: number;
  chapter_count: number;
  history: string | null;
}

export interface Chapter {
  id: number;
  book_id: number;
  number: number;
}

export interface Verse {
  id: number;
  chapter_id: number;
  translation_id: number;
  number: number;
  text: string;
}

export interface CrossReference {
  id: number;
  from_book_id: number;
  from_chapter: number;
  from_verse: number;
  to_book_id: number;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  votes: number;
}

export interface Highlight {
  id: string;
  user_id: string;
  book_id: number;
  chapter: number;
  verse: number;
  color: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  book_id: number;
  chapter: number;
  verse: number;
  created_at: string;
}

export interface DbVerseHighlight {
  id: string;
  book_id: number;
  chapter_num: number;
  verse_num: number;
  start_off: number;
  end_off: number;
  color: string;
  created_at: string;
}

export interface DbVerseNote {
  id: string;
  book_id: number;
  chapter_num: number;
  verse_num: number;
  start_off: number;
  end_off: number;
  content: string;
  created_at: string;
}

export interface DbVerseReaction {
  id: string;
  book_id: number;
  chapter_num: number;
  verse_num: number;
  start_off: number;
  end_off: number;
  emoji: string;
  created_at: string;
}
