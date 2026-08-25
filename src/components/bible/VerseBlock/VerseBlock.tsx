import type { ReactNode } from "react";
import { Button } from "@components/primitives";
import { Icon } from "@components/primitives/Icons";
import { Note } from "@Icons";
import { HIGHLIGHT_COLORS } from "../TextSelectionToolbar";
import type { HighlightColor } from "../TextSelectionToolbar";

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

export interface VerseReaction {
  start: number;
  end: number;
  emoji: string;
}

export interface VerseBlockProps {
  number: number;
  text: string;
  highlights?: TextHighlight[];
  reactions?: VerseReaction[];
  hasNote?: boolean;
  /** Callback to register the verse text span with ChapterBlock for selection detection */
  onRegisterTextRef?: (el: HTMLSpanElement | null) => void;
  /** Called when the user clicks a floating reaction badge */
  onReactionBadgeClick?: (start: number, end: number, emoji: string, rect: DOMRect) => void;
}

// ── Render highlighted + reacted text ────────────────────────────────────────

function renderHighlightedText(
  text: string,
  highlights: TextHighlight[],
  reactions: VerseReaction[],
  onReactionBadgeClick: (start: number, end: number, emoji: string, rect: DOMRect) => void,
) {
  if (!highlights.length && !reactions.length) return <>{text}</>;

  const pts = [...new Set([
    0, text.length,
    ...highlights.flatMap(h => [h.start, h.end]),
    ...reactions.flatMap(r => [r.start, r.end]),
  ])].sort((a, b) => a - b);

  const atoms = pts.slice(0, -1).map((start, i) => {
    const end = pts[i + 1];
    const hl = highlights.find(h => h.start <= start && h.end >= end) ?? null;
    const rx = reactions.find(r => r.start <= start && r.end >= end) ?? null;
    return { start, end, content: text.slice(start, end), hl, rx };
  });

  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < atoms.length) {
    const atom = atoms[i];
    if (atom.rx) {
      const reaction = atom.rx;
      const chunks: typeof atoms = [];
      while (i < atoms.length && atoms[i].rx?.start === reaction.start) {
        chunks.push(atoms[i++]);
      }
      nodes.push(
        <span key={`rx-${reaction.start}`} className="relative">
          {/* Absolute anchor keeps badge out of text flow */}
          <span
            className="absolute -translate-x-1/2 pointer-events-none"
            style={{ top: "-1.4em", left: "50%" }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="pointer-events-auto min-w-0! h-7! w-7! p-0! rounded-lg! text-base leading-none select-none hover:bg-surface-2! hover:border-border-gray-2!"
              onClick={(e) => {
                onReactionBadgeClick(
                  reaction.start,
                  reaction.end,
                  reaction.emoji,
                  (e.currentTarget as HTMLElement).getBoundingClientRect(),
                );
              }}
            >
              {reaction.emoji}
            </Button>
          </span>
          {chunks.map((c, j) =>
            c.hl ? (
              <mark key={j} style={{ background: HIGHLIGHT_COLORS[c.hl.color].bg, borderRadius: 2, paddingInline: 1 }}>
                {c.content}
              </mark>
            ) : c.content
          )}
        </span>
      );
    } else {
      nodes.push(
        atom.hl ? (
          <mark key={`hl-${atom.start}`} style={{ background: HIGHLIGHT_COLORS[atom.hl.color].bg, borderRadius: 2, paddingInline: 1 }}>
            {atom.content}
          </mark>
        ) : (
          <span key={`t-${atom.start}`}>{atom.content}</span>
        )
      );
      i++;
    }
  }
  return <>{nodes}</>;
}

// ── VerseBlock ────────────────────────────────────────────────────────────────

export function VerseBlock({
  number,
  text,
  highlights = [],
  reactions = [],
  hasNote,
  onRegisterTextRef,
  onReactionBadgeClick,
}: VerseBlockProps) {
  return (
    <div className="relative self-stretch flex items-baseline gap-1.5">
      <span className="text-xs font-medium leading-4 text-text-muted shrink-0 select-none cursor-default">
        {number}
      </span>

      <span
        ref={onRegisterTextRef}
        className="text-[17px] font-normal leading-6.25 text-text-primary grow cursor-text"
      >
        {renderHighlightedText(text, highlights, reactions, onReactionBadgeClick ?? (() => {}))}
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
