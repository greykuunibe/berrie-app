import type { ReactNode } from "react";
import { Icon } from "@components/primitives/Icons";
import { Note } from "@Icons";
import { HIGHLIGHT_COLORS } from "./TextSelectionToolbar";
import type { HighlightColor } from "./TextSelectionToolbar";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TextHighlight {
  start: number;
  end: number;
  color: HighlightColor;
}

export interface VerseNote {
  start: number;
  end: number;
  text: string;
}

export interface VerseBlockProps {
  number: number;
  text: string;
  highlights?: TextHighlight[];
  hasNote?: boolean;
  searchQuery?: string;
  searchRange?: { start: number; end: number };
  /** Callback to register the verse text span with ChapterBlock for selection detection */
  onRegisterTextRef?: (el: HTMLSpanElement | null) => void;
  /** Called when the user clicks an existing highlight mark */
  onHighlightClick?: (start: number, end: number, color: HighlightColor, rect: DOMRect) => void;
}

// ── Render highlighted + reacted text ────────────────────────────────────────

function renderHighlightedText(
  text: string,
  highlights: TextHighlight[],
  onHighlightClick: (start: number, end: number, color: HighlightColor, rect: DOMRect) => void,
) {
  if (!highlights.length) return <>{text}</>;

  const pts = [...new Set([
    0, text.length,
    ...highlights.flatMap(h => [h.start, h.end]),
  ])].sort((a, b) => a - b);

  const atoms = pts.slice(0, -1).map((start, i) => {
    const end = pts[i + 1];
    const hl = highlights.find(h => h.start <= start && h.end >= end) ?? null;
    return { start, end, content: text.slice(start, end), hl };
  });

  const nodes: ReactNode[] = atoms.map((atom, i) =>
    atom.hl ? (
      <mark
        key={`hl-${atom.start}-${i}`}
        style={{ background: HIGHLIGHT_COLORS[atom.hl.color].bg, borderRadius: 2, paddingInline: 1, cursor: "pointer" }}
        onClick={(e) => { e.stopPropagation(); onHighlightClick(atom.hl!.start, atom.hl!.end, atom.hl!.color, (e.currentTarget as HTMLElement).getBoundingClientRect()); }}
      >
        {atom.content}
      </mark>
    ) : (
      <span key={`t-${atom.start}-${i}`}>{atom.content}</span>
    )
  );

  return <>{nodes}</>;
}

// ── VerseBlock ────────────────────────────────────────────────────────────────

export function VerseBlock({
  number,
  text,
  highlights = [],
  hasNote,
  searchQuery,
  searchRange,
  onRegisterTextRef,
  onHighlightClick,
}: VerseBlockProps) {
  function renderWithSearch() {
    if (!searchQuery) return renderHighlightedText(text, highlights, onHighlightClick ?? (() => {}));

    const q = searchQuery.toLowerCase();
    const lower = text.toLowerCase();
    const segments: { content: string; isFill: boolean; isMatch: boolean }[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      const idx = lower.indexOf(q, cursor);
      if (idx < 0) { segments.push({ content: text.slice(cursor), isFill: false, isMatch: false }); break; }
      if (idx > cursor) segments.push({ content: text.slice(cursor, idx), isFill: false, isMatch: false });
      const isFill = !!(searchRange && searchRange.start === idx && searchRange.end === idx + q.length);
      segments.push({ content: text.slice(idx, idx + q.length), isFill, isMatch: true });
      cursor = idx + q.length;
    }

    return (
      <>
        {segments.map((seg, i) =>
          seg.isMatch ? (
            <mark key={i} style={{
              background: seg.isFill ? "#FEF08A" : "transparent",
              border: "1.5px solid #FEF08A",
              borderRadius: 3,
              paddingInline: 1,
            }}>
              {seg.content}
            </mark>
          ) : (
            <span key={i}>{seg.content}</span>
          )
        )}
      </>
    );
  }

  return (
    <div className="relative self-stretch flex items-baseline gap-1.5">
      <span className="text-xs font-medium leading-4 text-text-muted shrink-0 select-none cursor-default">
        {number}
      </span>

      <span
        ref={onRegisterTextRef}
        className="text-base font-medium leading-6.25 text-text-primary grow cursor-text"
      >
        {renderWithSearch()}
      </span>

      {hasNote && (
        <button
          type="button"
          className="shrink-0 flex items-center justify-center brand-gradient border border-border-brand rounded-full select-none"
          style={{ width: 20, height: 20, padding: 3 }}
        >
          <Icon icon={Note} size={8} color="white" />
        </button>
      )}
    </div>
  );
}
