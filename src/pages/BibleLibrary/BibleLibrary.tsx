import { useState } from "react";
import { EmptyState, ButtonTrigger, ToggleGroup, ConnectionError } from "@components/primitives";
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
  { label: "Law", value: "Law" },
  { label: "History", value: "History" },
  { label: "Poetry & Wisdom", value: "Poetry & Wisdom" },
  { label: "Major Prophets", value: "Major Prophets" },
  { label: "Minor Prophets", value: "Minor Prophets" },
];

const NT_CATEGORIES: Array<{ label: string; value: BookCategory }> = [
  { label: "Gospels", value: "Gospels" },
  { label: "Acts", value: "Acts" },
  { label: "Pauline Epistles", value: "Pauline Epistles" },
  { label: "General Epistles", value: "General Epistles" },
  { label: "Prophecy", value: "Prophecy" },
];

const TESTAMENTS: Array<{ label: string; value: Testament }> = [
  { label: "Old Testament", value: "OT" },
  { label: "New Testament", value: "NT" },
];

// ── BibleLibrary ──────────────────────────────────────────────────────────────

export function BibleLibrary() {
  const { books, isLoadingBooks, error, loadBooks, selectBook, loadChapters } = useBible();
  const openTab = useTabsStore((s) => s.openTab);
  const addRecent = useRecentStore((s) => s.addRecent);
  const testament = useUIStore((s) => s.bibleLibraryTestament);
  const activeCategory = useUIStore((s) => s.bibleLibraryCategory);
  const setTestament = useUIStore((s) => s.setBibleLibraryTestament);
  const setActiveCategory = useUIStore((s) => s.setBibleLibraryCategory);
  const [testamentMenuOpen, setTestamentMenuOpen] = useState(false);

  const categories = testament === "OT" ? OT_CATEGORIES : NT_CATEGORIES;

  const pillOptions = [
    { label: "All", value: "all" },
    ...categories.map((c) => ({ label: c.label, value: c.value })),
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
    setActiveCategory(
      value === "OT" ? OT_CATEGORIES[0].value : NT_CATEGORIES[0].value,
    );
    setTestamentMenuOpen(false);
  }

  return (
    <div className="relative py-16 px-24 h-full overflow-y-auto">
      {/* Title row */}
      <h2 className="text-2xl font-medium text-text-primary leading-none">
        Books
      </h2>

      {/* Category pills + testament selector */}
      <div className="z-10 flex items-center justify-between gap-4 py-8">
        <ToggleGroup
          variant="toggle"
          value={activeCategory ?? "all"}
          onChange={(v) =>
            setActiveCategory(v === "all" ? null : (v as BookCategory))
          }
          options={pillOptions}
        />

        {/* Testament selector */}
        <div className="relative shrink-0">
          {testamentMenuOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setTestamentMenuOpen(false)}
            />
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
        {error ? (
          <div className="flex items-center justify-center py-32">
            <ConnectionError onRetry={loadBooks} />
          </div>
        ) : isLoadingBooks ? null : filtered.length === 0 ? (
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
                  addRecent({
                    id: String(book.id),
                    type: "book",
                    label: book.name,
                    params: { bookId: String(book.id) },
                  });
                  openTab({
                    type: "reader",
                    label: book.name,
                    params: { bookId: String(book.id) },
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
