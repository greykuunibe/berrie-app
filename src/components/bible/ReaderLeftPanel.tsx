import { useState } from "react";
import { useAnnotationStore } from "@/stores/annotation.store";
import { Binoculars, Highlight, Notes, Bars } from "@Icons";
import { ToggleGroup, FeatureCover, BookShader, Input } from "@components/primitives";
import { HIGHLIGHT_COLORS } from "./TextSelectionToolbar";
import { CVSelector } from "./CVSelector";
import type { HighlightColor } from "./TextSelectionToolbar";

// ── ReaderLeftPanel ────────────────────────────────────────────────────────────

export interface ReaderLeftPanelProps {
  bookId: number;
  bookName: string;
  bookOrder: number;
  chapterNumbers: number[];
  verseTextMap: Record<string, string>;
  currentChapter?: number;
  onScrollToVerse: (chapter: number, verse: number, match?: { query: string; start: number; end: number }) => void;
  onSearchClear: () => void;
}

type ActiveTab = "chapters" | "highlights" | "notes" | "search";

const TABS = [
  { label: "Chapters",   value: "chapters",   icon: Bars        },
  { label: "Highlights", value: "highlights", icon: Highlight   },
  { label: "Notes",      value: "notes",      icon: Notes       },
  { label: "Search",     value: "search",     icon: Binoculars  },
];

export function ReaderLeftPanel({ bookId, bookName, bookOrder, chapterNumbers, verseTextMap, currentChapter, onScrollToVerse, onSearchClear }: ReaderLeftPanelProps) {
  const { highlights, notes } = useAnnotationStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("chapters");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeResult, setActiveResult] = useState<number | null>(null);

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
    <div className="flex flex-col h-full w-72 shrink-0 overflow-hidden px-2 py-4 gap-3">
      {/* Book cover + name */}
      <div className="flex items-center gap-3">
        <FeatureCover
          type="bible"
          size="xs"
          title=""
          backgroundNode={<BookShader bookOrder={bookOrder} />}
        />
        <span className="font-alter-bridge select-none text-4xl text-text-muted tracking-wider ">{bookName}</span>
      </div>

      {/* Icon-only tab switcher */}
      <ToggleGroup
        variant="toggle"
        value={activeTab}
        onChange={v => {
          if (activeTab === "search" && v !== "search") onSearchClear();
          setActiveTab(v as ActiveTab);
        }}
        options={TABS}
        iconOnly
        stretch
      />

      {/* Tab content */}
      <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none gap-0.5">
        {activeTab === "chapters" && (
          chapterNumbers.length === 0 ? (
            <p className="text-sm px-2 text-text-muted">No chapters available</p>
          ) : (
            <>
              {/* <span className="text-sm font-medium text-text-muted px-1 pb-1">Chapters</span> */}
              <CVSelector
                title="Chapters"
                plain
                variant="md"
                pageSize={30}
                items={chapterNumbers}
                selected={currentChapter ?? null}
                onSelect={ch => onScrollToVerse(ch, 1)}
              />
            </>
          )
        )}

        {activeTab === "highlights" && (
          <>
            <span className="text-sm font-medium text-text-muted px-2 pb-2">Highlights</span>
            {bookHighlights.length === 0 ? (
              <p className="text-sm px-2 text-text-muted">Highlights in {bookName} will appear here</p>
            ) : bookHighlights.map((h, i) => {
              const verseText = verseTextMap[`${h.chapter}:${h.fromVerse}`] ?? "";
              const excerpt = verseText.slice(h.fromOffset, h.fromVerse === h.toVerse ? h.toOffset : undefined);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors"
                  onClick={() => onScrollToVerse(h.chapter, h.fromVerse)}
                >
                  <span
                    className="w-4 h-4 rounded-sm shrink-0"
                    style={{
                      background: HIGHLIGHT_COLORS[h.color as HighlightColor]?.bg ?? "#E7E5E4",
                    }}
                  />
                  {excerpt && (
                    <span className="text-sm text-text-primary truncate">{excerpt}</span>
                  )}
                </div>
              );
            })}
          </>
        )}

        {activeTab === "notes" && (
          <>
            <span className="text-sm font-medium text-text-muted px-2 pb-2">Notes</span>
            {bookNotes.length === 0 ? (
              <p className="text-sm px-2 text-text-muted">Notes inside {bookName} will appear here</p>
            ) : bookNotes.map((n, i) => (
              <button
                key={i}
                type="button"
                className="flex flex-col gap-0.5 py-2 px-2 rounded-lg hover:bg-surface-2 transition-colors text-left w-full"
              >
                <span className="text-xs text-text-muted">Ch {n.chapter} · v{n.verse}</span>
                <span className="text-sm text-text-primary line-clamp-2 leading-relaxed">{n.text}</span>
              </button>
            ))}
          </>
        )}

        {activeTab === "search" && (
          <>
            <span className="text-sm font-medium select-none text-text-muted px-2 pb-1">Find</span>
            <Input
              icon={Binoculars}
              placeholder={`Find text in ${bookName}`}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setActiveResult(null); }}
              onClear={() => { setSearchQuery(""); setActiveResult(null); }}
              autoFocus
            />
            {searchQuery.trim() && (() => {
              const q = searchQuery.trim().toLowerCase();
              const results = Object.entries(verseTextMap)
                .filter(([, text]) => text.toLowerCase().includes(q))
                .map(([key, text]) => {
                  const [chStr, vStr] = key.split(":");
                  return { chapter: Number(chStr), verse: Number(vStr), text };
                })
                .sort((a, b) => a.chapter - b.chapter || a.verse - b.verse);
              return results.length === 0 ? (
                <p className="text-xs select-none px-2 my-2 text-text-muted">No results found</p>
              ) : (
                <>
                  <span className="text-sm font-medium text-text-muted my-2 px-2">{results.length} match{results.length !== 1 ? "es" : ""}</span>
                  {results.map((r, i) => {
                    const idx = r.text.toLowerCase().indexOf(q);
                    const padStart = Math.max(0, idx - 20);
                    const snippet = (padStart > 0 ? "…" : "") + r.text.slice(padStart, idx + q.length + 40) + (idx + q.length + 40 < r.text.length ? "…" : "");
                    return (
                      <button
                        key={i}
                        type="button"
                        className="flex flex-col gap-0.5 cursor-pointer py-2 px-2 rounded-lg bg-surface-0 transition-colors text-left w-full"
                        onClick={() => {
                          setActiveResult(i);
                          onScrollToVerse(r.chapter, r.verse, { query: q, start: idx, end: idx + q.length });
                        }}
                      >
                        <span className="text-sm text-text-primary line-clamp-2 leading-relaxed">{snippet}</span>
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
