export type TextSize = "sm" | "md" | "lg" | "xl";
export type LineSpacing = "compact" | "normal" | "relaxed";
export type ParagraphMode = "verses" | "paragraphs";

export interface UserProfile {
  id: string;
  full_name: string | null;
  language: string;
  default_translation_id: number | null;
  text_size: TextSize;
  line_spacing: LineSpacing;
  paragraph_mode: ParagraphMode;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  text_size: TextSize;
  line_spacing: LineSpacing;
  paragraph_mode: ParagraphMode;
  default_translation_id: number | null;
  language: string;
}
