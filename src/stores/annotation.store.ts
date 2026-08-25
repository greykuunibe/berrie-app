import { create } from "zustand";
import {
  fetchAnnotationsForChapter,
  insertHighlight,
  deleteHighlight,
  insertNote,
  deleteNote,
  upsertReaction,
  deleteReaction,
} from "@/lib/annotation.service";
import type { HighlightColor } from "@components/bible";

// ── Runtime types (rendering) ─────────────────────────────────────────────────
// dbId is carried internally so we can delete from Supabase; it's stripped before
// passing to VerseBlock which only needs start/end/color|emoji|text.

export interface StoredHighlight {
  dbId?: string;
  start: number;
  end: number;
  color: HighlightColor;
}

export interface StoredNote {
  dbId?: string;
  start: number;
  end: number;
  text: string;
}

export interface StoredReaction {
  dbId?: string;
  start: number;
  end: number;
  emoji: string;
}

// ── Key helper ────────────────────────────────────────────────────────────────

export function verseKey(bookId: number, chapter: number, verse: number) {
  return `${bookId}:${chapter}:${verse}`;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface AnnotationStore {
  highlights: Record<string, StoredHighlight[]>;
  notes: Record<string, StoredNote[]>;
  reactions: Record<string, StoredReaction[]>;

  loadChapter: (bookId: number, chapterNumber: number) => Promise<void>;

  addHighlight: (bookId: number, chapter: number, verse: number, start: number, end: number, color: HighlightColor) => Promise<void>;
  removeHighlight: (bookId: number, chapter: number, verse: number, start: number, end: number) => Promise<void>;

  addNote: (bookId: number, chapter: number, verse: number, start: number, end: number, text: string) => Promise<void>;

  addReaction: (bookId: number, chapter: number, verse: number, start: number, end: number, emoji: string) => Promise<void>;
}

export const useAnnotationStore = create<AnnotationStore>()((set, get) => ({
  highlights: {},
  notes: {},
  reactions: {},

  // ── Load all annotations for one chapter from Supabase ──────────────────────
  loadChapter: async (bookId, chapterNumber) => {
    const { highlights, notes, reactions } = await fetchAnnotationsForChapter(bookId, chapterNumber);

    const hlMap: Record<string, StoredHighlight[]> = {};
    for (const h of highlights) {
      const k = verseKey(bookId, h.chapter_num, h.verse_num);
      hlMap[k] = [...(hlMap[k] ?? []), { dbId: h.id, start: h.start_off, end: h.end_off, color: h.color as HighlightColor }];
    }

    const noteMap: Record<string, StoredNote[]> = {};
    for (const n of notes) {
      const k = verseKey(bookId, n.chapter_num, n.verse_num);
      noteMap[k] = [...(noteMap[k] ?? []), { dbId: n.id, start: n.start_off, end: n.end_off, text: n.content }];
    }

    const rxMap: Record<string, StoredReaction[]> = {};
    for (const r of reactions) {
      const k = verseKey(bookId, r.chapter_num, r.verse_num);
      rxMap[k] = [...(rxMap[k] ?? []), { dbId: r.id, start: r.start_off, end: r.end_off, emoji: r.emoji }];
    }

    set(state => ({
      highlights: { ...state.highlights, ...hlMap },
      notes: { ...state.notes, ...noteMap },
      reactions: { ...state.reactions, ...rxMap },
    }));
  },

  // ── Highlights ───────────────────────────────────────────────────────────────
  addHighlight: async (bookId, chapter, verse, start, end, color) => {
    const k = verseKey(bookId, chapter, verse);
    // Optimistic: remove any overlap then add without dbId
    set(state => {
      const existing = (state.highlights[k] ?? []).filter(h => h.end <= start || h.start >= end);
      return { highlights: { ...state.highlights, [k]: [...existing, { start, end, color }] } };
    });
    // Persist: get id from Supabase, patch local entry
    const saved = await insertHighlight(bookId, chapter, verse, start, end, color);
    if (saved) {
      set(state => ({
        highlights: {
          ...state.highlights,
          [k]: (state.highlights[k] ?? []).map(h =>
            h.start === start && h.end === end && h.color === color && !h.dbId
              ? { ...h, dbId: saved.id }
              : h,
          ),
        },
      }));
    }
  },

  removeHighlight: async (bookId, chapter, verse, start, end) => {
    const k = verseKey(bookId, chapter, verse);
    const target = (get().highlights[k] ?? []).find(h => h.start === start && h.end === end);
    // Optimistic remove
    set(state => ({
      highlights: {
        ...state.highlights,
        [k]: (state.highlights[k] ?? []).filter(h => !(h.start === start && h.end === end)),
      },
    }));
    if (target?.dbId) await deleteHighlight(target.dbId);
  },

  // ── Notes ────────────────────────────────────────────────────────────────────
  addNote: async (bookId, chapter, verse, start, end, text) => {
    const k = verseKey(bookId, chapter, verse);
    set(state => {
      const existing = (state.notes[k] ?? []).filter(n => n.end <= start || n.start >= end);
      return { notes: { ...state.notes, [k]: [...existing, { start, end, text }] } };
    });
    const saved = await insertNote(bookId, chapter, verse, start, end, text);
    if (saved) {
      set(state => ({
        notes: {
          ...state.notes,
          [k]: (state.notes[k] ?? []).map(n =>
            n.start === start && n.end === end && n.text === text && !n.dbId
              ? { ...n, dbId: saved.id }
              : n,
          ),
        },
      }));
    }
  },

  // ── Reactions ────────────────────────────────────────────────────────────────
  addReaction: async (bookId, chapter, verse, start, end, emoji) => {
    const k = verseKey(bookId, chapter, verse);
    const existing = get().reactions[k] ?? [];
    const current = existing.find(r => r.start === start && r.end === end);

    if (current?.emoji === emoji) {
      // Toggle off — remove
      set(state => ({
        reactions: {
          ...state.reactions,
          [k]: (state.reactions[k] ?? []).filter(r => !(r.start === start && r.end === end)),
        },
      }));
      if (current.dbId) await deleteReaction(current.dbId);
      return;
    }

    // Replace or add optimistically
    set(state => {
      const filtered = (state.reactions[k] ?? []).filter(r => !(r.start === start && r.end === end));
      return { reactions: { ...state.reactions, [k]: [...filtered, { start, end, emoji }] } };
    });
    const saved = await upsertReaction(bookId, chapter, verse, start, end, emoji);
    if (saved) {
      set(state => ({
        reactions: {
          ...state.reactions,
          [k]: (state.reactions[k] ?? []).map(r =>
            r.start === start && r.end === end && r.emoji === emoji && !r.dbId
              ? { ...r, dbId: saved.id }
              : r,
          ),
        },
      }));
    }
  },
}));
