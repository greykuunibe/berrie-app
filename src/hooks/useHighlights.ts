import { useBibleStore } from "@/stores/bible.store";
import type { HighlightColor } from "@components/bible/TextSelectionToolbar";

export function useHighlights(bookId: number, chapterNumber: number) {
  const highlights = useBibleStore((s) => s.highlights);
  const addHighlight = useBibleStore((s) => s.addHighlight);
  const removeHighlight = useBibleStore((s) => s.removeHighlight);

  function getHighlight(verseNumber: number): HighlightColor | null {
    const h = highlights.find(
      (h) =>
        h.book_id === bookId &&
        h.chapter === chapterNumber &&
        h.verse === verseNumber,
    );
    return h ? (h.color as HighlightColor) : null;
  }

  function setHighlight(verseNumber: number, color: HighlightColor | null) {
    if (color === null) {
      removeHighlight(bookId, chapterNumber, verseNumber);
    } else {
      addHighlight({
        id: `${bookId}-${chapterNumber}-${verseNumber}`,
        user_id: "local",
        book_id: bookId,
        chapter: chapterNumber,
        verse: verseNumber,
        color,
        created_at: new Date().toISOString(),
      });
    }
  }

  return { getHighlight, setHighlight };
}
