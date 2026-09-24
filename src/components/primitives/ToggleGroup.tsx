import { useId, useRef, useState, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import type { ToggleGroupProps, ToggleOption } from "./ToggleGroup.type";
import { Icon } from "@components/primitives/Icons";
import { More } from "@Icons";

const openMenuClass = "flex items-center gap-0.5 rounded-full bg-surface-2";
const PILL_PADDING = 8; // p-1 = 4px each side
const GAP = 2;          // gap-0.5 = 2px
const MORE_W = 36;      // more button width (w-8 = 32px + 2px gap + a bit of buffer)

export function ToggleGroup(props: ToggleGroupProps) {
  const uid = useId();

  if (props.variant === "openMenu") {
    return <div className={openMenuClass}>{props.children}</div>;
  }

  const { options, value, onChange, iconOnly = false, stretch = false } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const widthCache = useRef<number[]>([]);
  const [visibleCount, setVisibleCount] = useState(options.length);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePos, setMorePos] = useState({ top: 0, left: 0 });

  // Recalculate how many tabs fit given the available pixel width
  function recalculate(available: number) {
    const cache = widthCache.current;
    if (!cache.length) return;

    let used = 0;
    let count = 0;
    for (let i = 0; i < options.length; i++) {
      const gap = i > 0 ? GAP : 0;
      const isLast = i === options.length - 1;
      // Reserve room for the More button unless this is the last item
      const reserve = isLast ? 0 : MORE_W + GAP;
      if (used + cache[i] + gap + reserve <= available) {
        used += cache[i] + gap;
        count++;
      } else {
        break;
      }
    }
    setVisibleCount(Math.max(1, count));
  }

  // Measure button widths synchronously (before paint) so the initial render is correct
  useLayoutEffect(() => {
    widthCache.current = options.map(o => btnRefs.current.get(o.value)?.offsetWidth ?? 60);

    const parent = containerRef.current?.parentElement ?? containerRef.current;
    if (parent) recalculate(parent.clientWidth - PILL_PADDING);
  }, [options]);

  // Watch parent for resize changes
  useEffect(() => {
    const parent = containerRef.current?.parentElement ?? containerRef.current;
    if (!parent) return;
    const ro = new ResizeObserver(() => {
      recalculate(parent.clientWidth - PILL_PADDING);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [options]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-more-menu]") && !t.closest("[data-more-btn]")) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  const overflowOptions = options.slice(visibleCount);
  const hasOverflow = overflowOptions.length > 0;
  const activeInOverflow = overflowOptions.some(o => o.value === value);

  function handleMoreClick() {
    const btn = moreBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setMorePos({ top: r.bottom + 6, left: r.left });
    setMoreOpen(v => !v);
  }

  return (
    <>
      <div ref={containerRef} className="h-9 flex items-stretch p-1 gap-0.5 rounded-full bg-surface-2">
        {options.map((opt: ToggleOption, i) => {
          const active = opt.value === value;
          const hidden = i >= visibleCount;
          return (
            <button
              key={opt.value}
              ref={el => { if (el) btnRefs.current.set(opt.value, el); }}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-hidden={hidden || undefined}
              tabIndex={hidden ? -1 : undefined}
              className={`relative flex items-center justify-center gap-1.5 h-full px-3 rounded-full cursor-pointer select-none ${hidden ? " hidden" : ""}${stretch ? " flex-1" : ""}`}
              style={{ minWidth: iconOnly ? "2.25rem" : undefined }}
            >
              {active && !hidden && (
                <motion.span
                  layoutId={`${uid}-active-bg`}
                  className="absolute inset-0 element-box-shadow rounded-full bg-surface-1"
                  transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 text-sm font-medium leading-none whitespace-nowrap ${active ? "text-text-primary" : "text-text-muted"}`}>
                {opt.icon && !iconOnly && <Icon icon={opt.icon} size={14} color={active ? "primary" : "muted"} />}
                {iconOnly && opt.icon && <Icon icon={opt.icon} size={16} color={active ? "primary" : "muted"} />}
                {!iconOnly && opt.label}
              </span>
            </button>
          );
        })}

        {hasOverflow && (
          <button
            ref={moreBtnRef}
            data-more-btn=""
            type="button"
            onClick={handleMoreClick}
            className="relative flex items-center justify-center h-full w-8 rounded-full cursor-pointer select-none"
          >
            {activeInOverflow && (
              <motion.span
                layoutId={`${uid}-active-bg`}
                className="absolute inset-0 rounded-full bg-surface-3"
                transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10">
              <Icon icon={More} size={16} color={activeInOverflow ? "brand" : "primary"} />
            </span>
          </button>
        )}
      </div>

      {moreOpen && hasOverflow && createPortal(
        <div
          data-more-menu=""
          className="fixed z-1001 flex flex-col gap-0.5 p-1 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl min-w-max"
          style={{ top: morePos.top, left: morePos.left }}
        >
          {overflowOptions.map(opt => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setMoreOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  active
                    ? "text-text-brand bg-surface-2"
                    : "text-text-primary hover:bg-surface-2"
                }`}
              >
                {opt.icon && <Icon icon={opt.icon} size={14} color={active ? "brand" : "primary"} />}
                {opt.label}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
