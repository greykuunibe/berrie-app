import { useState } from "react";
import { useAnnotationStore } from "@/stores/annotation.store";
import { Search } from "@Icons";
import { Button, ToggleGroup } from "@components/primitives";
import { HIGHLIGHT_COLORS } from "./TextSelectionToolbar";
import type { HighlightColor } from "./TextSelectionToolbar";

// ── ReaderLeftPanel ────────────────────────────────────────────────────────────

export interface ReaderLeftPanelProps {
  bookId: number;
  bookName: string;
  verseTextMap: Record<string, string>;
  onScrollToVerse: (chapter: number, verse: number) => void;
}

type ActiveTab = "highlights" | "notes";

const TABS = [
  { label: "Highlights", value: "highlights" },
  { label: "Notes",      value: "notes"      },
];

export function ReaderLeftPanel({ bookId, bookName, verseTextMap, onScrollToVerse }: ReaderLeftPanelProps) {
  const { highlights, notes } = useAnnotationStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("highlights");

  const prefix = `${bookId}:`;

  // highlights are now keyed by "bookId:chapter" (not "bookId:chapter:verse")
  const bookHighlights = Object.entries(highlights)
    .filter(([key]) => key.startsWith(prefix) && key.split(":").length === 2)
    .flatMap(([key, hls]) => {
      const [, chStr] = key.split(":");
      return hls.map(h => ({ ...h, chapter: Number(chStr) }));
    })
    .sort((a, b) => a.chapter - b.chapter || a.fromVerse - b.fromVerse);

  const bookNotes = Object.entries(notes)
    .filter(([key]) => key.startsWith(prefix))
    .flatMap(([key, ns]) => {
      const [, chStr, vStr] = key.split(":");
      return ns.map(n => ({ ...n, chapter: Number(chStr), verse: Number(vStr) }));
    })
    .sort((a, b) => a.chapter - b.chapter || a.verse - b.verse);

  return (
    <div className="flex flex-col h-full w-64 shrink-0 overflow-hidden px-2 py-4 gap-3">
      {/* Search + tab switcher */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 [&>div]:w-full">
          <ToggleGroup
            variant="toggle"
            value={activeTab}
            onChange={v => setActiveTab(v as ActiveTab)}
            options={TABS}
            stretch
          />
        </div>
        <Button variant="primary" size="sm" icon={Search} iconButton />
      </div>

      {/* Tab content */}
      <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none gap-0.5">
        {activeTab === "highlights" && (
          bookHighlights.length === 0 ? (
            <p className="text-sm px-2 text-text-muted">Highlights in {bookName} will appear here</p>
          ) : (
            bookHighlights.map((h, i) => {
              const verseText = verseTextMap[`${h.chapter}:${h.fromVerse}`] ?? "";
              const excerpt = verseText.slice(h.fromOffset, h.fromVerse === h.toVerse ? h.toOffset : undefined);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors"
                  onClick={() => onScrollToVerse(h.chapter, h.fromVerse)}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{
                      background: HIGHLIGHT_COLORS[h.color as HighlightColor]?.bg ?? "#E7E5E4",
                    }}
                  />
                  {excerpt && (
                    <span className="text-sm text-text-primary truncate">{excerpt}</span>
                  )}
                </div>
              );
            })
          )
        )}

        {activeTab === "notes" && (
          bookNotes.length === 0 ? (
            <p className="text-sm px-2 text-text-muted">Notes inside {bookName} will appear here</p>
          ) : (
            bookNotes.map((n, i) => (
              <button
                key={i}
                type="button"
                className="flex flex-col gap-0.5 py-2 px-2 rounded-lg hover:bg-surface-2 transition-colors text-left w-full"
              >
                <span className="text-xs text-text-muted">Ch {n.chapter} · v{n.verse}</span>
                <span className="text-sm text-text-primary line-clamp-2 leading-relaxed">{n.text}</span>
              </button>
            ))
          )
        )}
      </div>
    </div>
  );
}
