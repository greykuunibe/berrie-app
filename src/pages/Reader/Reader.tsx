import { useEffect, useRef, useState } from "react";
import { useBible } from "@/hooks/useBible";
import { fetchVerses } from "@/lib/bible.service";
import { CVSelector, ChapterBlock } from "@components/bible";
import { FeatureCover, FooterBlur, BookShader } from "@components/primitives";
import { useResourcesStore } from "@/stores/resources.store";
import { useAnnotationStore } from "@/stores/annotation.store";
import { useTabsStore } from "@/stores/tabs.store";
import type { Chapter, Verse } from "@/types";

type ChapterVerses = { chapter: Chapter; verses: Verse[] };

function posKey(bookId: string) {
  return `berrie-pos-${bookId}`;
}

interface ReaderProps {
  tabId?: string;
  bookId?: string;
}

export function Reader({ tabId, bookId }: ReaderProps) {
  const savedChapter = bookId ? localStorage.getItem(`berrie-pos-${bookId}`) : null;
  const chParam = savedChapter ?? "1";

  const updateTabParams = useTabsStore((s) => s.updateTabParams);
  const openTab = useTabsStore((s) => s.openTab);

  const { books, chapters, currentBook, activeTranslation, selectBook } =
    useBible();

  const [allChapterVerses, setAllChapterVerses] = useState<ChapterVerses[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(true);

  // Never clears during transitions — bridges the window where the store resets chapters to []
  const [stableChapters, setStableChapters] = useState<Chapter[]>([]);
  useEffect(() => {
    if (chapters.length > 0 && chapters[0]?.book_id === Number(bookId)) {
      setStableChapters(chapters);
    }
  }, [chapters]);

  const chapterRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const visibleChapters = useRef<Set<number>>(new Set());
  const [activeChapter, setActiveChapter] = useState<number>(Number(chParam));
  // Ref to the inner scroll container (not main — Reader owns its own scroll)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const book = books.find((b) => b.id === Number(bookId));

  // ── Resource loading ─────────────────────────────────────────────────────────
  const loadCommentaries = useResourcesStore((s) => s.loadCommentaries);
  const loadCommentaryForChapter = useResourcesStore((s) => s.loadCommentaryForChapter);
  const prefetchCommentaryForChapter = useResourcesStore((s) => s.prefetchCommentaryForChapter);
  const hasCommentaries = useResourcesStore((s) => s.commentaries.length > 0);
  const loadCrossRefsForChapter = useResourcesStore((s) => s.loadCrossRefsForChapter);
  const prefetchCrossRefsForChapter = useResourcesStore((s) => s.prefetchCrossRefsForChapter);
  const loadAnnotationChapter = useAnnotationStore((s) => s.loadChapter);

  const stableChaptersRef = useRef(stableChapters);
  stableChaptersRef.current = stableChapters;
  // Track the last chapter ID we triggered a load for to avoid duplicate concurrent fetches (B2)
  const lastCommentaryChapterRef = useRef<number | null>(null);

  async function loadCommentaryForActive() {
    if (!activeChapter) return;
    const chapter = stableChaptersRef.current.find((c) => c.number === activeChapter);
    if (!chapter) return;
    // Deduplicate: skip if already loading this exact chapter
    if (lastCommentaryChapterRef.current === chapter.id) return;
    lastCommentaryChapterRef.current = chapter.id;
    // B1 fix: ensure activeCommentaryId is set before fetching entries
    if (!hasCommentaries) await loadCommentaries();
    await loadCommentaryForChapter(chapter.id);
    // Load cross-refs for the same chapter in parallel — data is ready before panel opens
    if (book) void loadCrossRefsForChapter(book.id, activeChapter);
    // Reset so the same chapter can reload if commentary selection changes
    lastCommentaryChapterRef.current = null;
  }

  // Fire when stableChapters first become available (initial load)
  useEffect(() => {
    if (stableChapters.length) loadCommentaryForActive();
  }, [stableChapters.length]);

  // Fire when the user scrolls to a different chapter
  useEffect(() => {
    if (stableChapters.length) loadCommentaryForActive();
  }, [activeChapter]);

  // Prefetch adjacent chapters so commentary is ready before the user scrolls there
  useEffect(() => {
    if (!activeChapter || !stableChapters.length) return;
    [activeChapter - 1, activeChapter + 1].forEach(n => {
      const ch = stableChaptersRef.current.find(c => c.number === n);
      if (ch) prefetchCommentaryForChapter(ch.id);
      if (book) prefetchCrossRefsForChapter(book.id, n);
    });
  }, [activeChapter]);

  // Select the book when landing on this route
  useEffect(() => {
    if (book && currentBook?.id !== book.id) selectBook(book);
  }, [book?.id]);

  // Reset stale verse data when the book changes — stableChapters is intentionally NOT cleared
  useEffect(() => {
    setAllChapterVerses([]);
    setIsLoadingAll(true);
    visibleChapters.current.clear();
    chapterRefs.current.clear();
  }, [bookId]);

  // Load ALL chapters' verses (re-runs when chapters or translation change)
  useEffect(() => {
    if (!chapters.length || !activeTranslation) return;
    // Only fetch when chapters belong to the current book
    if (chapters[0]?.book_id !== Number(bookId)) return;

    let cancelled = false;
    setIsLoadingAll(true);

    Promise.all(
      chapters.map((ch) =>
        fetchVerses(ch.id, activeTranslation.id).then((v) => ({
          chapter: ch,
          verses: v,
        })),
      ),
    )
      .then((results) => {
        if (cancelled) return; // navigation happened before this resolved
        const sorted = results.sort(
          (a, b) => a.chapter.number - b.chapter.number,
        );
        setAllChapterVerses(sorted);
        setIsLoadingAll(false);
        // Eagerly load annotations for all chapters — deduped in the store
        if (book) sorted.forEach(r => { if (r.verses.length > 0) loadAnnotationChapter(book.id, r.chapter.number); });

        const target = Number(chParam);
        setActiveChapter(target);
        setTimeout(() => {
          if (cancelled) return;
          const el = chapterRefs.current.get(target);
          if (!el) return;
          if (target === 1) {
            el.closest("main")?.scrollTo({ top: 0, behavior: "instant" });
          } else {
            el.scrollIntoView({ behavior: "instant" });
          }
        }, 50);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[Reader] failed to load verses:", err);
        setIsLoadingAll(false);
      });

    return () => {
      cancelled = true; // discard if chapters or translation changed before this resolved
    };
  }, [chapters.length, activeTranslation?.id]);

  // Persist active chapter and sync to tab params as user scrolls
  useEffect(() => {
    if (!bookId || !activeChapter) return;
    localStorage.setItem(posKey(bookId), String(activeChapter));
    if (tabId) updateTabParams(tabId, { chapter: String(activeChapter) });
  }, [activeChapter]);

  // IntersectionObserver — track topmost visible chapter
  useEffect(() => {
    if (allChapterVerses.length === 0) return;

    const observers: IntersectionObserver[] = [];
    chapterRefs.current.forEach((el, chNum) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            visibleChapters.current.add(chNum);
          } else {
            visibleChapters.current.delete(chNum);
          }
          const visible = [...visibleChapters.current];
          if (visible.length > 0) setActiveChapter(Math.min(...visible));
        },
        { threshold: 0.01 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [allChapterVerses.length]);


  function scrollToChapter(n: number) {
    const el = chapterRefs.current.get(n);
    if (!el) return;
    if (n === 1) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
    } else {
      el.scrollIntoView({ behavior: "instant" });
    }
    setActiveChapter(n);
  }
  // Keyboard navigation — ← → switch books, Shift+↑↓ change chapter
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!book) return;

      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = books.find((b) => b.book_order === book.book_order - 1);
        if (prev) openTab({ type: "reader", label: prev.name, params: { bookId: String(prev.id) } }, { replace: true });
      } else if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        const next = books.find((b) => b.book_order === book.book_order + 1);
        if (next) openTab({ type: "reader", label: next.name, params: { bookId: String(next.id) } }, { replace: true });
      } else if (e.shiftKey && e.key === "ArrowDown") {
        e.preventDefault();
        const idx = chapters.findIndex((c) => c.number === activeChapter);
        if (idx < chapters.length - 1) scrollToChapter(chapters[idx + 1].number);
      } else if (e.shiftKey && e.key === "ArrowUp") {
        e.preventDefault();
        const idx = chapters.findIndex((c) => c.number === activeChapter);
        if (idx > 0) scrollToChapter(chapters[idx - 1].number);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [books, book, chapters, activeChapter, openTab]);

  if (!book) return null;


  return (
    // Reader owns its own scroll — -mx-4 cancels AppLayout main's px-4 so
    // absolute children anchor to the true card edge, not the padded content box.
    <div className="relative h-full overflow-hidden -mx-4">
      {/* Chapter TOC — absolute within the white card, bottom-right */}
      <div className="absolute bottom-4 right-4 z-10">
        <CVSelector
          title="Chapters"
          variant="md"
          items={stableChapters.map((c) => c.number)}
          selected={activeChapter}
          onSelect={scrollToChapter}
          className="max-h-[60vh] overflow-y-auto overflow-x-hidden"
          collapsible
          defaultCollapsed
        />
      </div>

      {/* Inner scroll container — the actual scrolling surface */}
      <div ref={scrollContainerRef} className="h-full overflow-y-auto px-4 scrollbar-stable">
      {/* Reading column — truly centered */}
      <div className="flex flex-col gap-8 max-w-200 mx-auto w-full pb-16 pt-20">
        {/* Book cover + title */}
        <div className="flex flex-col">
          <FeatureCover
            type="bible"
            title={book.name}
            size="lg"
            backgroundNode={<BookShader bookOrder={book.book_order} />}
          />
        </div>
        {stableChapters.map((chapter) => {
          const found = allChapterVerses.find((acv) => acv.chapter.id === chapter.id);
          const cv = found?.verses ?? [];
          return (
            <div
              key={chapter.id}
              className="scroll-mt-8"
              ref={(el) => {
                if (el) chapterRefs.current.set(chapter.number, el);
              }}
            >
              <ChapterBlock
                bookId={book.id}
                chapterNumber={chapter.number}
                verses={cv}
                isActive={chapter.number === activeChapter}
                isLoading={isLoadingAll}
                isEmpty={!isLoadingAll && !!found && cv.length === 0}
              />
            </div>
          );
        })}
      </div>
      <FooterBlur />
      </div> {/* end inner scroll container */}
    </div>
  );
}
