import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { VerseBlock } from "../VerseBlock";
import { TextSelectionToolbar, EmojiPicker } from "../TextSelectionToolbar";
import { EmptyState } from "@components/primitives";
import { Bible } from "@Icons";
import { useAnnotationStore, verseKey } from "@/stores/annotation.store";
import type { HighlightColor } from "../TextSelectionToolbar";
import type { Verse } from "@/types";

export interface ChapterBlockProps {
  bookId: number;
  chapterNumber: number;
  verses: Verse[];
  isActive?: boolean;
  isLoading?: boolean;
  /** Set to true only after the fetch completed and genuinely returned no verses */
  isEmpty?: boolean;
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

export function ChapterBlock({ bookId, chapterNumber, verses, isActive, isLoading, isEmpty }: ChapterBlockProps) {
  const { highlights, notes, reactions, loadChapter, addHighlight, removeHighlight, addNote, addReaction } =
    useAnnotationStore();

  // Load persisted annotations from Supabase when verses are ready
  useEffect(() => {
    if (verses.length > 0) loadChapter(bookId, chapterNumber);
  }, [bookId, chapterNumber, verses.length]);

  const verseTextRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const skipNextMouseUp = useRef(false);

  const [activeSelection, setActiveSelection] = useState<{
    ranges: SelectionRange[];
    rect: { top: number; left: number; width: number };
  } | null>(null);

  const [reactionPicker, setReactionPicker] = useState<{
    verseNumber: number;
    start: number;
    end: number;
    currentEmoji: string;
    rect: DOMRect;
  } | null>(null);

  useEffect(() => {
    function handleMouseUp() {
      if (skipNextMouseUp.current) {
        skipNextMouseUp.current = false;
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;

      const range = sel.getRangeAt(0);
      const selectedRanges: SelectionRange[] = [];

      const sortedEntries = [...verseTextRefs.current.entries()].sort((a, b) => a[0] - b[0]);

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
      setActiveSelection({ ranges: selectedRanges, rect: { top: rect.top, left: rect.left, width: rect.width } });
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  function dismiss() {
    setActiveSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  const overlappingColor: HighlightColor | null = activeSelection
    ? (() => {
        const colors = activeSelection.ranges.map(r => {
          const key = verseKey(bookId, chapterNumber, r.verseNumber);
          return (highlights[key] ?? []).find(h => h.start < r.end && h.end > r.start)?.color ?? null;
        });
        const unique = [...new Set(colors.filter(Boolean))];
        return unique.length === 1 ? (unique[0] as HighlightColor) : null;
      })()
    : null;

  return (
    <div className="flex flex-col items-start mt-2 p-4 bg-surface-1 border border-border-gray-1 card-shadow rounded-2xl w-full max-w-212.5 min-h-[900px]">
      <span
        className={`font-alter-bridge text-[32px] leading-12.5 mb-4 ${
          isActive ? "text-text-brand" : "text-text-muted"
        }`}
      >
        Chapter {chapterNumber}
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
                <VerseBlock
                  key={v.id}
                  number={v.number}
                  text={v.text}
                  highlights={highlights[vKey] ?? []}
                  reactions={reactions[vKey] ?? []}
                  hasNote={(notes[vKey]?.length ?? 0) > 0}
                  onRegisterTextRef={el => {
                    if (el) verseTextRefs.current.set(v.number, el);
                    else verseTextRefs.current.delete(v.number);
                  }}
                  onReactionBadgeClick={(start, end, emoji, rect) =>
                    setReactionPicker({ verseNumber: v.number, start, end, currentEmoji: emoji, rect })
                  }
                />
              );
            })}
      </div>

      {reactionPicker &&
        createPortal(
          <>
            <div className="fixed inset-0 z-998" onClick={() => setReactionPicker(null)} />
            <div
              className="fixed z-999"
              style={{
                top: reactionPicker.rect.top - 8,
                left: reactionPicker.rect.left + reactionPicker.rect.width / 2,
                transform: "translate(-50%, -100%)",
              }}
            >
              <EmojiPicker
                activeEmoji={reactionPicker.currentEmoji}
                onPick={emoji => {
                  addReaction(bookId, chapterNumber, reactionPicker.verseNumber, reactionPicker.start, reactionPicker.end, emoji);
                  setReactionPicker(null);
                }}
              />
            </div>
          </>,
          document.body,
        )}

      {activeSelection &&
        createPortal(
          <>
            <div className="fixed inset-0 z-998" onClick={dismiss} />
            <div
              className="fixed z-999"
              data-selection-toolbar
              onMouseDown={() => { skipNextMouseUp.current = true; }}
              style={{
                top: activeSelection.rect.top - 48,
                left: activeSelection.rect.left + activeSelection.rect.width / 2 - 157,
              }}
            >
              <TextSelectionToolbar
                activeColor={overlappingColor}
                onHighlight={color => {
                  activeSelection.ranges.forEach(r => {
                    if (color === null) removeHighlight(bookId, chapterNumber, r.verseNumber, r.start, r.end);
                    else addHighlight(bookId, chapterNumber, r.verseNumber, r.start, r.end, color);
                  });
                  dismiss();
                }}
                onSaveNote={noteText => {
                  const [r] = activeSelection.ranges;
                  addNote(bookId, chapterNumber, r.verseNumber, r.start, r.end, noteText);
                  dismiss();
                }}
                onAddReaction={emoji => {
                  if (activeSelection.ranges.length === 1) {
                    const [r] = activeSelection.ranges;
                    addReaction(bookId, chapterNumber, r.verseNumber, r.start, r.end, emoji);
                  }
                  dismiss();
                }}
                onClose={dismiss}
              />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
