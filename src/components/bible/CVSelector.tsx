import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Button, ButtonTrigger } from "@components/primitives";
import { ChevronLeft, ChevronRight } from "@Icons";
import { CircleDot } from "lucide-react";

// ── Variant config ────────────────────────────────────────────────────────────

const V = {
  lg: {
    card: "w-full p-3 gap-3 rounded-[22px]",
    popupW: "w-[400px]",
    btnMin: 56,
    title: "text-lg font-medium leading-none text-text-primary mb-2",
    btnOuter: "flex items-center p-[3px] aspect-square bg-surface-0 border border-border-gray-1 element-box-shadow rounded-[11px] cursor-pointer",
    btnInnerBase: "flex flex-1 self-stretch flex-col items-center justify-center rounded-lg",
    btnInnerIdle: "bg-surface-1 border border-border-gray-1 element-box-shadow",
    text: "text-2xl font-medium",
  },
  md: {
    card: "w-full p-2 gap-[10px] rounded-xl",
    popupW: "w-[305px]",
    btnMin: 40,
    title: "text-base font-medium leading-none text-text-primary mb-2",
    btnOuter: "flex items-center p-0.5 aspect-square bg-surface-0 border border-border-gray-1 element-box-shadow rounded-lg cursor-pointer",
    btnInnerBase: "flex flex-1 self-stretch flex-col items-center justify-center rounded-[6px]",
    btnInnerIdle: "bg-surface-1 border border-border-gray-1 element-box-shadow",
    text: "text-[18.6px] font-medium",
  },
} as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? "-100%" : "100%", opacity: 0 }),
};

// ── CVSelector ────────────────────────────────────────────────────────────────

export interface CVSelectorProps {
  title: string;
  variant?: "lg" | "md";
  plain?: boolean;
  items: number[];
  selected?: number | null;
  onSelect?: (n: number) => void;
  className?: string;
  /** Max items shown per page. Adds a chevron navigator when items exceed this. */
  pageSize?: number;
  /** When true, renders a toggle button; panel is hidden until button is pressed. */
  collapsible?: boolean;
  /** Initial collapsed state when `collapsible` is true. Defaults to false. */
  defaultCollapsed?: boolean;
  /** Which direction the collapsible panel opens. Defaults to "up". */
  direction?: "up" | "down";
  /** Label shown on the trigger button. Defaults to `title`. */
  triggerLabel?: string;
}

export function CVSelector({
  title,
  variant = "lg",
  plain = false,
  items,
  selected = null,
  onSelect,
  className,
  pageSize,
  collapsible = false,
  defaultCollapsed = false,
  direction = "up",
  triggerLabel,
}: CVSelectorProps) {
  const v = V[variant];

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const pageDir = useRef(0);
  const paginated = pageSize != null && items.length > pageSize;
  const totalPages = paginated ? Math.ceil(items.length / pageSize!) : 1;
  const pageItems = paginated ? items.slice(page * pageSize!, (page + 1) * pageSize!) : items;

  // Auto-navigate to the page containing the selected item
  useEffect(() => {
    if (!paginated || selected == null) return;
    const idx = items.indexOf(selected);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / pageSize!);
    if (targetPage !== page) {
      pageDir.current = targetPage > page ? 1 : -1;
      setPage(targetPage);
    }
  }, [selected]);

  function goNext() {
    if (page < totalPages - 1) { pageDir.current = 1; setPage(p => p + 1); }
  }
  function goPrev() {
    if (page > 0) { pageDir.current = -1; setPage(p => p - 1); }
  }

  const rangeStart = paginated ? page * pageSize! + 1 : 1;
  const rangeEnd   = paginated ? Math.min((page + 1) * pageSize!, items.length) : items.length;

  // ── Collapsible open/pos ─────────────────────────────────────────────────────
  const [open, setOpen] = useState(!defaultCollapsed);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const cardClass = [
    "flex flex-col items-start",
    v.card,
    !plain && "bg-surface-1 border border-border-gray-1 element-box-shadow",
    plain && "bg-surface-1",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // ── Grid ─────────────────────────────────────────────────────────────────────
  function renderGrid(visibleItems: number[]) {
    return (
      <div
        className="grid gap-2 w-full"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${v.btnMin}px, 1fr))` }}
      >
        {visibleItems.map((n) => {
          const active = selected === n;
          return (
            <button
              key={n}
              type="button"
              className={v.btnOuter}
              onClick={() => {
                onSelect?.(n);
                if (collapsible) setOpen(false);
              }}
            >
              <div
                className={[
                  v.btnInnerBase,
                  active
                    ? "brand-gradient border border-border-brand element-box-shadow"
                    : v.btnInnerIdle,
                ].join(" ")}
              >
                <span className={[v.text, active ? "text-text-inverted" : "text-text-muted"].join(" ")}>
                  {n}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Navigator + animated grid ─────────────────────────────────────────────────
  function renderNav() {
    if (!paginated || totalPages <= 1) return null;
    const atStart = page === 0;
    const atEnd = page === totalPages - 1;
    return (
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" icon={ChevronLeft} iconButton iconSize={20} isDisabled={atStart} iconColor={atStart ? "muted" : "primary"} onClick={goPrev} />
        <Button variant="ghost" size="sm" icon={CircleDot} iconButton iconSize={14} isDisabled={atStart} iconColor={atStart ? "muted" : "brand"} onClick={() => { pageDir.current = -1; setPage(0); }} />
        <Button variant="ghost" size="sm" icon={ChevronRight} iconButton iconSize={20} isDisabled={atEnd} iconColor={atEnd ? "muted" : "primary"} onClick={goNext} />
      </div>
    );
  }

  function renderContent() {
    return (
      <>
        <div className="overflow-hidden w-full">
          <AnimatePresence custom={pageDir.current} mode="wait" initial={false}>
            <motion.div
              key={page}
              custom={pageDir.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
            >
              {renderGrid(pageItems)}
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    );
  }

  // ── Collapsible mode ──────────────────────────────────────────────────────────
  if (collapsible) {
    function handleToggle() {
      if (!open && triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        setPanelPos({
          top: direction === "down" ? r.bottom + 8 : r.top - 8,
          left: r.left + r.width / 2,
        });
      }
      setOpen((s) => !s);
    }

    return (
      <div ref={triggerRef}>
        <ButtonTrigger variant="secondary" open={open} onClick={handleToggle}>
          {triggerLabel ?? title}
        </ButtonTrigger>
        {open && createPortal(
          <>
            <div className="fixed inset-0 z-998" onClick={() => setOpen(false)} />
            <div
              className={`fixed z-999 -translate-x-1/2 ${v.popupW}`}
              style={{
                top: direction === "down" ? panelPos.top : undefined,
                bottom: direction === "down" ? undefined : window.innerHeight - panelPos.top,
                left: panelPos.left,
              }}
            >
              <div className={cardClass}>
                <div className="flex items-center justify-between w-full">
                  <span className={v.title}>{title}</span>
                  {renderNav()}
                </div>
                {renderContent()}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  }

  // ── Standard mode ─────────────────────────────────────────────────────────────
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between w-full">
        <span className={v.title}>{title}</span>
        {renderNav()}
      </div>
      {renderContent()}
    </div>
  );
}
