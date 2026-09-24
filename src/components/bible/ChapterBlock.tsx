import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { VerseBlock } from "./VerseBlock";
import { TextSelectionToolbar } from "./TextSelectionToolbar";
import { EmptyState } from "@components/primitives";
import { Bible } from "@Icons";
import { useAnnotationStore, verseKey, chapterKey } from "@/stores/annotation.store";
import { toWords } from "@/lib/toWords";
import { toast } from "@/lib/toast";
import type { HighlightColor } from "./TextSelectionToolbar";
import type { TextHighlight } from "./VerseBlock";
import type { StoredHighlight } from "@/stores/annotation.store";
import type { Verse } from "@/types";

export interface ChapterBlockProps {
  bookId: number;
  chapterNumber: number;
  verses: Verse[];
  isActive?: boolean;
  isLoading?: boolean;
  isEmpty?: boolean;
  searchQuery?: string;
  searchMatch?: { verse: number; start: number; end: number };
}

type SelectionRange = { verseNumber: number; start: number; end: number };

function getAbsoluteOffset(container: Node, node: Node, offset: number): number {
  let total = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();
  while (current) {
    if (current === node) return total + offset;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return total + offset;
}

// Projects chapter-level cross-verse highlights down to per-verse {start,end} slices
function sliceHighlightsForVerse(
  chapterHighlights: StoredHighlight[],
  verseNum: number,
  verseTextLength: number,
): TextHighlight[] {
  return chapterHighlights
    .filter(h => h.fromVerse <= verseNum && h.toVerse >= verseNum)
    .map(h => ({
      start: h.fromVerse === verseNum ? h.fromOffset : 0,
      end:   h.toVerse   === verseNum ? h.toOffset   : verseTextLength,
      color: h.color,
    }))
    .filter(h => h.start < h.end);
}

export function ChapterBlock({ bookId, chapterNumber, verses, isActive, isLoading, isEmpty, searchQuery, searchMatch }: ChapterBlockProps) {
  const { highlights, notes, addHighlight, removeHighlight, addNote } = useAnnotationStore();

  const chapterHighlights = highlights[chapterKey(bookId, chapterNumber)] ?? [];

  const verseTextRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const skipNextMouseUp = useRef(false);

  const [activeSelection, setActiveSelection] = useState<{
    ranges: SelectionRange[];
    rect: { top: number; bottom: number; left: number; width: number };
    text: string;
  } | null>(null);

  useEffect(() => {
    function handleMouseUp() {
      console.log("[toolbar] mouseup fired, skipNext:", skipNextMouseUp.current);
      if (skipNextMouseUp.current) {
        skipNextMouseUp.current = false;
        return;
      }

      const sel = window.getSelection();
      console.log("[toolbar] sel:", sel?.toString(), "collapsed:", sel?.isCollapsed);
      if (!sel || sel.isCollapsed) return;

      const range = sel.getRangeAt(0);
      const selectedRanges: SelectionRange[] = [];

      const sortedEntries = [...verseTextRefs.current.entries()].sort((a, b) => a[0] - b[0]);
      console.log("[toolbar] verseTextRefs size:", verseTextRefs.current.size, "selectedRanges after loop:", selectedRanges.length);

      for (const [verseNum, textEl] of sortedEntries) {
        if (!textEl || !range.intersectsNode(textEl)) continue;

        const startInVerse = textEl.contains(range.startContainer);
        const endInVerse = textEl.contains(range.endContainer);

        let start: number;
        let end: number;

        if (startInVerse && endInVerse) {
          start = getAbsoluteOffset(textEl, range.startContainer, range.startOffset);
          end = getAbsoluteOffset(textEl, range.endContainer, range.endOffset);
        } else if (startInVerse) {
          start = getAbsoluteOffset(textEl, range.startContainer, range.startOffset);
          end = textEl.textContent?.length ?? 0;
        } else if (endInVerse) {
          start = 0;
          end = getAbsoluteOffset(textEl, range.endContainer, range.endOffset);
        } else {
          start = 0;
          end = textEl.textContent?.length ?? 0;
        }

        if (start < end) selectedRanges.push({ verseNumber: verseNum, start, end });
      }

      if (!selectedRanges.length) return;

      const rect = range.getBoundingClientRect();
      console.log("[toolbar] rect:", { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width });
      setActiveSelection({ ranges: selectedRanges, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width }, text: sel.toString() });
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  function dismiss() {
    setActiveSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  // Determine if the current selection sits entirely within a single existing highlight
  const overlappingColor: HighlightColor | null = activeSelection
    ? (() => {
        if (!activeSelection.ranges.length) return null;
        const first = activeSelection.ranges[0];
        const last = activeSelection.ranges[activeSelection.ranges.length - 1];
        const hl = chapterHighlights.find(h =>
          h.fromVerse <= first.verseNumber && h.fromOffset <= first.start &&
          h.toVerse >= last.verseNumber && h.toOffset >= last.end
        );
        return hl?.color ?? null;
      })()
    : null;

  return (
    <div className={`flex flex-col items-start p-4 w-full${isLoading ? " h-full min-h-225" : ""}`}>
      <span className="text-[24px] w-full py-4 border-b border-border-gray-1 uppercase font-semibold mb-6">
        Chapter {toWords(chapterNumber)}
      </span>

      <div className="flex flex-col gap-3 w-full flex-1">
        {isLoading
          ? Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded-full bg-surface-0 animate-pulse"
                style={{ width: `${55 + (i % 7) * 7}%` }}
              />
            ))
          : isEmpty
          ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <EmptyState
                  icon={Bible}
                  title="No verses found"
                  description="This chapter couldn't be loaded. Try switching translations."
                />
              </div>
            )
          : verses.map(v => {
              const vKey = verseKey(bookId, chapterNumber, v.number);
              return (
                <div key={v.id} data-chapter={chapterNumber} data-verse={v.number}>
                  <VerseBlock
                    number={v.number}
                    text={v.text}
                    highlights={sliceHighlightsForVerse(chapterHighlights, v.number, v.text.length)}
                    hasNote={(notes[vKey]?.length ?? 0) > 0}
                    searchQuery={searchQuery}
                    searchRange={searchMatch?.verse === v.number ? { start: searchMatch.start, end: searchMatch.end } : undefined}
                    onRegisterTextRef={el => {
                      if (el) verseTextRefs.current.set(v.number, el);
                      else verseTextRefs.current.delete(v.number);
                    }}
                    onHighlightClick={(start, end, color, rect) => {
                      // Find the cross-verse highlight that covers this click point
                      const hl = chapterHighlights.find(h =>
                        h.color === color &&
                        h.fromVerse <= v.number && h.toVerse >= v.number &&
                        (h.fromVerse < v.number || h.fromOffset <= start) &&
                        (h.toVerse   > v.number || h.toOffset   >= end)
                      );
                      if (!hl) return;

                      // Reconstruct the full multi-verse selection from the stored highlight
                      const ranges: SelectionRange[] = [];
                      for (let n = hl.fromVerse; n <= hl.toVerse; n++) {
                        const verse = verses.find(vv => vv.number === n);
                        if (!verse) continue;
                        ranges.push({
                          verseNumber: n,
                          start: n === hl.fromVerse ? hl.fromOffset : 0,
                          end:   n === hl.toVerse   ? hl.toOffset   : verse.text.length,
                        });
                      }

                      const text = ranges
                        .map(r => verses.find(vv => vv.number === r.verseNumber)?.text.slice(r.start, r.end) ?? "")
                        .join(" ");

                      setActiveSelection({
                        ranges,
                        rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width },
                        text,
                      });
                    }}
                  />
                </div>
              );
            })}
      </div>

      {activeSelection &&
        createPortal(
          <>
            <div className="fixed inset-0 z-998" onClick={dismiss} />
            <div
              className="fixed z-999"
              data-selection-toolbar
              onMouseDown={() => { skipNextMouseUp.current = true; }}
              style={{
                top: activeSelection.rect.bottom - 200,
                left: Math.max(8, Math.min(
                  window.innerWidth - 322,
                  activeSelection.rect.left + activeSelection.rect.width / 2 - 157,
                )),
              }}
            >
              <TextSelectionToolbar
                activeColor={overlappingColor}
                onHighlight={color => {
                  const first = activeSelection.ranges[0];
                  const last = activeSelection.ranges[activeSelection.ranges.length - 1];
                  if (color === null) {
                    removeHighlight(bookId, chapterNumber, first.verseNumber, first.start, last.verseNumber, last.end);
                  } else {
                    addHighlight(bookId, chapterNumber, first.verseNumber, first.start, last.verseNumber, last.end, color);
                  }
                  dismiss();
                }}
                onSaveNote={noteText => {
                  const [r] = activeSelection.ranges;
                  addNote(bookId, chapterNumber, r.verseNumber, r.start, r.end, noteText);
                  toast.success("Note saved");
                  dismiss();
                }}
                onClose={() => {
                  const text = activeSelection?.text ?? "";
                  if (text) {
                    navigator.clipboard.writeText(text)
                      .then(() => toast.success("Copied to clipboard"))
                      .catch(() => toast.error("Failed to copy"));
                  }
                  dismiss();
                }}
              />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
