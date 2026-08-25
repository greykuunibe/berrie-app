export type NoteBlockType =
  | "text"
  | "title"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "bible_verse"
  | "divider"
  | "table"
  | "file"
  | "page";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteBlock {
  id: string;
  note_id: string;
  type: NoteBlockType;
  content: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface NoteFile {
  id: number;
  name: string;
  type: string;
  size: number;
  path: string;
  created_at: string;
}
