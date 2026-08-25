import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ButtonTrigger, FeatureCover, FooterBlur } from "@components/primitives";
import { CVSelector } from "@components/bible";
import { useBibleStore } from "@/stores/bible.store";
import { fetchChapters, fetchVerses } from "@/lib/bible.service";
import { Search } from "@Icons";
import { Icon } from "@components/primitives/Icons";
import type { Book, Chapter, Verse } from "@/types";

type Step = "books" | "chapters" | "verses";

// ── Search pill ───────────────────────────────────────────────────────────────

function SearchPill({ placeholder }: { placeholder?: string }) {
  return (
    <div className="flex items-center gap-2 h-10 bg-surface-1 border border-border-gray-1 rounded-full px-3 flex-1 focus-within:border-border-brand transition-[border-color]">
      <Icon icon={Search} size={16} color="muted" />
      <input
        type="text"
        className="flex-1 text-sm text-text-primary bg-transparent outline-none placeholder:text-text-muted min-w-0"
        placeholder={placeholder || "Search or jump to…"}
      />
    </div>
  );
}

// ── Step label (shows only the current view name) ────────────────────────────

const STEP_LABELS: Record<Step, string> = {
  books: "Books",
  chapters: "Chapters",
  verses: "Verses",
};

function StepLabel({ step }: { step: Step }) {
  return (
    <span className="text-sm font-medium text-text-primary shrink-0 whitespace-nowrap">
      {STEP_LABELS[step]}
    </span>
  );
}

// ── ReaderBookSelectionMenu ───────────────────────────────────────────────────

export interface ReaderBookSelectionMenuProps {
  book: Book | undefined;
  chParam: string;
  vParam: string | null;
}

export function ReaderBookSelectionMenu({
  book,
  chParam,
  vParam,
}: ReaderBookSelectionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("books");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number | null>(null);
  const [localChapters, setLocalChapters] = useState<Chapter[]>([]);
  const [localVerses, setLocalVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const books = useBibleStore((s) => s.books);
  const activeTranslation = useBibleStore((s) => s.activeTranslation);

  const PANEL_W = 650;

  function handleToggle() {
    if (!open && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      const left = Math.max(8, Math.min(r.left + r.width / 2 - PANEL_W / 2, window.innerWidth - PANEL_W - 8));
      setPos({ top: r.bottom + 4, left });
    }
    setOpen((v) => !v);
  }

  function handleClose() {
    setOpen(false);
  }

  // Step 1 → 2: user picked a book, load its chapters
  async function pickBook(b: Book) {
    setSelectedBook(b);
    setIsLoading(true);
    try {
      const chs = await fetchChapters(b.id);
      setLocalChapters(chs.sort((a, z) => a.number - z.number));
      setStep("chapters");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2 → 3: user picked a chapter, load its verses
  async function pickChapter(chNum: number) {
    const ch = localChapters.find((c) => c.number === chNum);
    if (!ch || !activeTranslation) return;
    setSelectedChapterNum(chNum);
    setIsLoading(true);
    try {
      const vs = await fetchVerses(ch.id, activeTranslation.id);
      setLocalVerses(vs.sort((a, z) => a.number - z.number));
      setStep("verses");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 3: user picked a verse → navigate and close
  function pickVerse(verseNum: number) {
    if (!selectedBook) return;
    navigate(`/app/reader/${selectedBook.id}?ch=${selectedChapterNum}&v=${verseNum}`);
    handleClose();
    // Reset for next open
    setStep("books");
    setSelectedBook(null);
    setSelectedChapterNum(null);
  }

  const reference = book
    ? `${book.name}${chParam ? ` ${chParam}` : ""}${vParam ? `:${vParam}` : ""}`
    : "";

  return (
    <div ref={anchorRef}>
      <ButtonTrigger open={open} onClick={handleToggle} width={121}>
        {reference || "Go to…"}
      </ButtonTrigger>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={handleClose} />

          <div
            className="fixed z-999 flex flex-col gap-4 p-4 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl overflow-hidden"
            style={{ top: pos.top, left: pos.left, width: PANEL_W, height: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topbar: step label left | search centered | view-all right */}
            <div className="relative flex items-center h-10 w-full">
              <StepLabel step={step} />
              <div className="absolute left-1/2 -translate-x-1/2 w-83">
                <SearchPill placeholder={reference || "Search or jump to…"} />
              </div>
              <button
                type="button"
                className="ml-auto text-xs font-medium text-text-muted shrink-0 cursor-pointer hover:opacity-70 whitespace-nowrap z-10"
              >
                View all
              </button>
            </div>

            {/* Scrollable content — same height for all steps */}
            <div className="flex-1 overflow-y-auto relative">
              {/* ── Step 1: Book covers ──────────────────────────────────── */}
              {step === "books" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {books.map((b) => (
                    <FeatureCover
                      key={b.id}
                      type="bible"
                      size="sm"
                      title={b.name}
                      abbreviation={b.abbreviation}
                      onClick={() => pickBook(b)}
                    />
                  ))}
                </div>
              )}

              {/* ── Step 2: Chapters ─────────────────────────────────────── */}
              {step === "chapters" && !isLoading && (
                <div className="flex justify-center">
                  <CVSelector
                    title="Chapters"
                    variant="md"
                    plain
                    items={localChapters.map((c) => c.number)}
                    selected={selectedChapterNum}
                    onSelect={pickChapter}
                  />
                </div>
              )}

              {/* ── Step 3: Verses ───────────────────────────────────────── */}
              {step === "verses" && !isLoading && (
                <div className="flex justify-center">
                  <CVSelector
                    title="Verses"
                    variant="md"
                    plain
                    items={localVerses.map((v) => v.number)}
                    selected={vParam ? Number(vParam) : null}
                    onSelect={pickVerse}
                  />
                </div>
              )}
              <FooterBlur />
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
