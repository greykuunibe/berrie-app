import { create } from "zustand";
import {
  fetchAnnotationsForChapter,
  insertHighlight,
  deleteHighlight,
  insertNote,
} from "@/lib/annotation.service";
import type { HighlightColor } from "@components/bible";

// ── Runtime types ─────────────────────────────────────────────────────────────

export interface StoredHighlight {
  dbId?: string;
  fromVerse: number;
  fromOffset: number;
  toVerse: number;
  toOffset: number;
  color: HighlightColor;
}

export interface StoredNote {
  dbId?: string;
  start: number;
  end: number;
  text: string;
}

// ── Key helpers ───────────────────────────────────────────────────────────────

export function verseKey(bookId: number, chapter: number, verse: number) {
  return `${bookId}:${chapter}:${verse}`;
}

export function chapterKey(bookId: number, chapter: number) {
  return `${bookId}:${chapter}`;
}

// ── Overlap detection (scalar projection across verse+offset space) ────────────

function toScalar(verse: number, offset: number) {
  return verse * 1_000_000 + offset;
}

function overlaps(
  a: StoredHighlight,
  b: { fromVerse: number; fromOffset: number; toVerse: number; toOffset: number },
): boolean {
  return (
    toScalar(a.fromVerse, a.fromOffset) < toScalar(b.toVerse, b.toOffset) &&
    toScalar(a.toVerse, a.toOffset)     > toScalar(b.fromVerse, b.fromOffset)
  );
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface AnnotationStore {
  // highlights keyed by "bookId:chapter" → StoredHighlight[]
  highlights: Record<string, StoredHighlight[]>;
  // notes keyed by "bookId:chapter:verse" → StoredNote[]
  notes: Record<string, StoredNote[]>;

  loadChapter: (bookId: number, chapterNumber: number) => Promise<void>;

  addHighlight: (
    bookId: number, chapter: number,
    fromVerse: number, fromOffset: number,
    toVerse: number, toOffset: number,
    color: HighlightColor,
  ) => Promise<void>;

  removeHighlight: (
    bookId: number, chapter: number,
    fromVerse: number, fromOffset: number,
    toVerse: number, toOffset: number,
  ) => Promise<void>;

  addNote: (bookId: number, chapter: number, verse: number, start: number, end: number, text: string) => Promise<void>;
}

const _loadedChapters = new Set<string>();

export const useAnnotationStore = create<AnnotationStore>()((set, get) => ({
  highlights: {},
  notes: {},

  loadChapter: async (bookId, chapterNumber) => {
    const key = chapterKey(bookId, chapterNumber);
    if (_loadedChapters.has(key)) return;
    _loadedChapters.add(key);
    const { highlights, notes } = await fetchAnnotationsForChapter(bookId, chapterNumber);

    const hlList: StoredHighlight[] = highlights.map(h => ({
      dbId: h.id,
      fromVerse: h.from_verse_num,
      fromOffset: h.from_off,
      toVerse: h.to_verse_num,
      toOffset: h.to_off,
      color: h.color as HighlightColor,
    }));

    const noteMap: Record<string, StoredNote[]> = {};
    for (const n of notes) {
      const k = verseKey(bookId, n.chapter_num, n.verse_num);
      noteMap[k] = [...(noteMap[k] ?? []), { dbId: n.id, start: n.start_off, end: n.end_off, text: n.content }];
    }

    set(state => ({
      highlights: { ...state.highlights, [key]: hlList },
      notes: { ...state.notes, ...noteMap },
    }));
  },

  addHighlight: async (bookId, chapter, fromVerse, fromOffset, toVerse, toOffset, color) => {
    const k = chapterKey(bookId, chapter);
    const newRange = { fromVerse, fromOffset, toVerse, toOffset };
    const current = get().highlights[k] ?? [];
    const overlapping = current.filter(h => overlaps(h, newRange));

    // Compute tails — parts of overlapping highlights that fall outside the new range
    const tails: StoredHighlight[] = [];
    for (const h of overlapping) {
      // Left tail: existing starts before new
      if (toScalar(h.fromVerse, h.fromOffset) < toScalar(fromVerse, fromOffset)) {
        tails.push({ fromVerse: h.fromVerse, fromOffset: h.fromOffset, toVerse: fromVerse, toOffset: fromOffset, color: h.color });
      }
      // Right tail: existing ends after new
      if (toScalar(h.toVerse, h.toOffset) > toScalar(toVerse, toOffset)) {
        tails.push({ fromVerse: toVerse, fromOffset: toOffset, toVerse: h.toVerse, toOffset: h.toOffset, color: h.color });
      }
    }

    const newHighlight: StoredHighlight = { fromVerse, fromOffset, toVerse, toOffset, color };

    // Optimistic update
    set(state => {
      const kept = (state.highlights[k] ?? []).filter(h => !overlaps(h, newRange));
      return { highlights: { ...state.highlights, [k]: [...kept, ...tails, newHighlight] } };
    });

    // Persist: delete overlapping, insert tails + new
    await Promise.all(overlapping.filter(h => h.dbId).map(h => deleteHighlight(h.dbId!)));

    const tailResults = await Promise.all(
      tails.map(t => insertHighlight(bookId, chapter, t.fromVerse, t.fromOffset, t.toVerse, t.toOffset, t.color))
    );
    for (let i = 0; i < tails.length; i++) {
      const saved = tailResults[i];
      const tail = tails[i];
      if (saved) {
        set(state => ({
          highlights: {
            ...state.highlights,
            [k]: (state.highlights[k] ?? []).map(h =>
              h.fromVerse === tail.fromVerse && h.fromOffset === tail.fromOffset &&
              h.toVerse === tail.toVerse && h.toOffset === tail.toOffset &&
              h.color === tail.color && !h.dbId
                ? { ...h, dbId: saved.id } : h
            ),
          },
        }));
      }
    }

    const saved = await insertHighlight(bookId, chapter, fromVerse, fromOffset, toVerse, toOffset, color);
    if (saved) {
      set(state => ({
        highlights: {
          ...state.highlights,
          [k]: (state.highlights[k] ?? []).map(h =>
            h.fromVerse === fromVerse && h.fromOffset === fromOffset &&
            h.toVerse === toVerse && h.toOffset === toOffset &&
            h.color === color && !h.dbId
              ? { ...h, dbId: saved.id } : h
          ),
        },
      }));
    }
  },

  removeHighlight: async (bookId, chapter, fromVerse, fromOffset, toVerse, toOffset) => {
    const k = chapterKey(bookId, chapter);
    const newRange = { fromVerse, fromOffset, toVerse, toOffset };
    const current = get().highlights[k] ?? [];
    const overlapping = current.filter(h => overlaps(h, newRange));

    const tails: StoredHighlight[] = [];
    for (const h of overlapping) {
      if (toScalar(h.fromVerse, h.fromOffset) < toScalar(fromVerse, fromOffset)) {
        tails.push({ fromVerse: h.fromVerse, fromOffset: h.fromOffset, toVerse: fromVerse, toOffset: fromOffset, color: h.color });
      }
      if (toScalar(h.toVerse, h.toOffset) > toScalar(toVerse, toOffset)) {
        tails.push({ fromVerse: toVerse, fromOffset: toOffset, toVerse: h.toVerse, toOffset: h.toOffset, color: h.color });
      }
    }

    set(state => {
      const kept = (state.highlights[k] ?? []).filter(h => !overlaps(h, newRange));
      return { highlights: { ...state.highlights, [k]: [...kept, ...tails] } };
    });

    await Promise.all(overlapping.filter(h => h.dbId).map(h => deleteHighlight(h.dbId!)));

    const tailResults = await Promise.all(
      tails.map(t => insertHighlight(bookId, chapter, t.fromVerse, t.fromOffset, t.toVerse, t.toOffset, t.color))
    );
    for (let i = 0; i < tails.length; i++) {
      const saved = tailResults[i];
      const tail = tails[i];
      if (saved) {
        set(state => ({
          highlights: {
            ...state.highlights,
            [k]: (state.highlights[k] ?? []).map(h =>
              h.fromVerse === tail.fromVerse && h.fromOffset === tail.fromOffset &&
              h.toVerse === tail.toVerse && h.toOffset === tail.toOffset &&
              h.color === tail.color && !h.dbId
                ? { ...h, dbId: saved.id } : h
            ),
          },
        }));
      }
    }
  },

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
              ? { ...n, dbId: saved.id } : n,
          ),
        },
      }));
    }
  },
}));
