import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, EmptyState, ButtonTrigger, FooterBlur } from "@components/primitives";
import { Menu } from "@components/primitives/Menu";
import { MenuItem } from "@components/primitives/MenuItem";
import { FeatureCover } from "@components/primitives";
import { Bible } from "@Icons";
import { useBible } from "@/hooks/useBible";
import { useUIStore } from "@/stores/ui.store";
import { useTabsStore } from "@/stores/tabs.store";
import { useRecentStore } from "@/stores/recent.store";
import type { Testament, BookCategory } from "@/types";

const OT_CATEGORIES: Array<{ label: string; value: BookCategory }> = [
  { label: "Law",             value: "Law" },
  { label: "History",         value: "History" },
  { label: "Poetry & Wisdom", value: "Poetry & Wisdom" },
  { label: "Major Prophets",  value: "Major Prophets" },
  { label: "Minor Prophets",  value: "Minor Prophets" },
];

const NT_CATEGORIES: Array<{ label: string; value: BookCategory }> = [
  { label: "Gospels",          value: "Gospels" },
  { label: "Acts",             value: "Acts" },
  { label: "Pauline Epistles", value: "Pauline Epistles" },
  { label: "General Epistles", value: "General Epistles" },
  { label: "Prophecy",         value: "Prophecy" },
];

const TESTAMENTS: Array<{ label: string; value: Testament }> = [
  { label: "Old Testament", value: "OT" },
  { label: "New Testament", value: "NT" },
];

// ── CategoryPills ─────────────────────────────────────────────────────────────

interface PillItem {
  label: string;
  value: BookCategory | null;
}

interface CategoryPillsProps {
  pills: PillItem[];
  activeValue: BookCategory | null;
  onChange: (value: BookCategory | null) => void;
}

function CategoryPills({ pills, activeValue, onChange }: CategoryPillsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(pills.length);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePos, setMorePos] = useState({ top: 0, left: 0 });

  const pillsKey = pills.map((p) => p.label).join(",");

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    function compute() {
      const available = container!.offsetWidth;
      const measurePills = Array.from(measure!.children) as HTMLElement[];
      const GAP = 8;
      const MORE_WIDTH = 84;

      // Pass 1: check if all pills fit without a More button
      let total = 0;
      for (let i = 0; i < measurePills.length; i++) {
        total += (i === 0 ? 0 : GAP) + measurePills[i].offsetWidth;
      }
      if (total <= available) {
        setVisibleCount(measurePills.length);
        return;
      }

      // Pass 2: find how many fit alongside the More button
      let used = 0;
      let count = 0;
      for (let i = 0; i < measurePills.length; i++) {
        const needed = (i === 0 ? 0 : GAP) + measurePills[i].offsetWidth;
        if (used + needed + GAP + MORE_WIDTH > available) break;
        used += needed;
        count++;
      }

      setVisibleCount(Math.max(1, count));
    }

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    return () => ro.disconnect();
  }, [pillsKey]);

  // Close the more menu if the active value changes (user picked from it)
  useEffect(() => {
    setMoreOpen(false);
  }, [activeValue]);

  const visible = pills.slice(0, visibleCount);
  const hidden = pills.slice(visibleCount);
  const activeInHidden = hidden.some((p) => p.value === activeValue);

  function handleMoreToggle() {
    if (!moreOpen && moreTriggerRef.current) {
      const r = moreTriggerRef.current.getBoundingClientRect();
      setMorePos({ top: r.bottom + 4, left: r.left });
    }
    setMoreOpen((v) => !v);
  }

  return (
    <div ref={containerRef} className="relative flex flex-1 items-center gap-2 min-w-0 overflow-hidden">
      {/* Invisible measurement layer — same Button component ensures identical widths */}
      <div
        ref={measureRef}
        className="absolute top-0 left-0 flex items-center gap-2 invisible pointer-events-none"
        aria-hidden="true"
      >
        {pills.map((p) => (
          <Button key={String(p.value)} variant="ghost" size="sm">
            {p.label}
          </Button>
        ))}
      </div>

      {/* Visible pills */}
      {visible.map((p) => (
        <Button
          key={String(p.value)}
          variant={activeValue === p.value ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </Button>
      ))}

      {/* More trigger + menu */}
      {hidden.length > 0 && (
        <>
          <div ref={moreTriggerRef}>
            <ButtonTrigger
              open={moreOpen}
              onClick={handleMoreToggle}
              variant={activeInHidden ? "brand" : "primary"}
            >
              More
            </ButtonTrigger>
          </div>

          {moreOpen && createPortal(
            <>
              <div className="fixed inset-0 z-998" onClick={() => setMoreOpen(false)} />
              <div
                className="fixed z-999"
                style={{ top: morePos.top, left: morePos.left }}
              >
                <Menu>
                  {hidden.map((p) => (
                    <MenuItem
                      key={String(p.value)}
                      label={p.label}
                      selected={activeValue === p.value}
                      onClick={() => onChange(p.value)}
                    />
                  ))}
                </Menu>
              </div>
            </>,
            document.body
          )}
        </>
      )}
    </div>
  );
}

// ── BibleLibrary ──────────────────────────────────────────────────────────────

export function BibleLibrary() {
  const { books, isLoadingBooks, selectBook, loadChapters } = useBible();
  const openTab = useTabsStore((s) => s.openTab);
  const addRecent = useRecentStore((s) => s.addRecent);
  const testament = useUIStore((s) => s.bibleLibraryTestament);
  const activeCategory = useUIStore((s) => s.bibleLibraryCategory);
  const setTestament = useUIStore((s) => s.setBibleLibraryTestament);
  const setActiveCategory = useUIStore((s) => s.setBibleLibraryCategory);
  const [testamentMenuOpen, setTestamentMenuOpen] = useState(false);

  const categories = testament === "OT" ? OT_CATEGORIES : NT_CATEGORIES;

  const pills: PillItem[] = [
    { label: "All", value: null },
    ...categories,
  ];

  const filtered = books.filter((b) => {
    const matchesTestament = b.testament === testament;
    const matchesCategory = !activeCategory || b.category === activeCategory;
    return matchesTestament && matchesCategory;
  });

  const currentTestamentLabel =
    TESTAMENTS.find((t) => t.value === testament)?.label ?? "Old Testament";

  function handleTestamentChange(value: Testament) {
    setTestament(value);
    setActiveCategory(value === "OT" ? OT_CATEGORIES[0].value : NT_CATEGORIES[0].value);
    setTestamentMenuOpen(false);
  }

  return (
    <div className="relative px-16 min-h-full">

      {/* Title row */}
      <div className="py-16">
        <h2 className="text-2xl font-medium text-text-primary leading-none">Books</h2>
      </div>

      {/* Category pills + testament selector */}
      <div className="z-10 flex items-center justify-between gap-4 pb-8">
        <CategoryPills
          pills={pills}
          activeValue={activeCategory}
          onChange={setActiveCategory}
        />

        {/* Testament selector */}
        <div className="relative shrink-0">
          {testamentMenuOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setTestamentMenuOpen(false)} />
          )}
          <ButtonTrigger
            open={testamentMenuOpen}
            onClick={() => setTestamentMenuOpen((v) => !v)}
          >
            {currentTestamentLabel}
          </ButtonTrigger>
          {testamentMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+4px)] z-50">
              <Menu>
                {TESTAMENTS.map((t) => (
                  <MenuItem
                    key={t.value}
                    label={t.label}
                    selected={testament === t.value}
                    onClick={() => handleTestamentChange(t.value)}
                  />
                ))}
              </Menu>
            </div>
          )}
        </div>
      </div>

      {/* Book grid */}
      <div className="pb-16">
        {isLoadingBooks ? null : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <EmptyState
              icon={Bible}
              title="No books here"
              description="No books found for this category"
            />
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(max(140px,calc((100%-48px)/5)),1fr))]">
            {filtered.map((book) => (
              <FeatureCover
                key={book.id}
                type="bible"
                size="lg"
                title={book.name}
                abbreviation={book.abbreviation}
                onClick={() => {
                  selectBook(book);
                  loadChapters(book.id);
                  addRecent({ id: String(book.id), type: "book", label: book.name, params: { bookId: String(book.id) } });
                  openTab({ type: "reader", label: book.name, params: { bookId: String(book.id) } });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <FooterBlur />
    </div>
  );
}
