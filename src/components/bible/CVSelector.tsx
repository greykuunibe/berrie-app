import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ButtonTrigger } from "@components/primitives";

// ── Variant config ────────────────────────────────────────────────────────────

const V = {
  lg: {
    card: "w-[400px] p-3 gap-3 rounded-[22px]",
    title: "text-lg font-medium leading-none text-text-primary mb-2",
    row: "flex flex-row items-center gap-2",
    btnOuter: "flex items-center p-[3px] w-14 h-14 bg-surface-0 border border-border-gray-1 element-box-shadow rounded-[11px] shrink-0 cursor-pointer",
    btnInnerBase: "flex flex-1 self-stretch flex-col items-center justify-center rounded-lg",
    btnInnerIdle: "bg-surface-1 border border-border-gray-1 element-box-shadow",
    text: "text-2xl font-medium",
  },
  md: {
    card: "w-[305px] p-2 gap-[10px] rounded-xl",
    title: "text-base font-medium leading-none text-text-primary mb-2",
    row: "flex flex-row items-center gap-2",
    btnOuter: "flex items-center p-0.5 w-10 h-10 bg-surface-0 border border-border-gray-1 element-box-shadow rounded-lg shrink-0 cursor-pointer",
    btnInnerBase: "flex flex-1 self-stretch flex-col items-center justify-center rounded-[6px]",
    btnInnerIdle: "bg-surface-1 border border-border-gray-1 element-box-shadow",
    text: "text-[18.6px] font-medium",
  },
} as const;

const PER_ROW = 6;

// ── CVSelector ────────────────────────────────────────────────────────────────

export interface CVSelectorProps {
  title: string;
  variant?: "lg" | "md";
  plain?: boolean;
  items: number[];
  selected?: number | null;
  onSelect?: (n: number) => void;
  className?: string;
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
  collapsible = false,
  defaultCollapsed = false,
  direction = "up",
  triggerLabel,
}: CVSelectorProps) {
  const v = V[variant];
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

  const rows: number[][] = [];
  for (let i = 0; i < items.length; i += PER_ROW) {
    rows.push(items.slice(i, i + PER_ROW));
  }

  const grid = (
    <div className="flex flex-col gap-2">
      {rows.map((row, ri) => (
        <div key={ri} className={v.row}>
          {row.map((n) => {
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
                  <span
                    className={[
                      v.text,
                      active ? "text-text-inverted" : "text-text-muted",
                    ].join(" ")}
                  >
                    {n}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

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
              className="fixed z-999 -translate-x-1/2"
              style={{
                top: direction === "down" ? panelPos.top : undefined,
                bottom: direction === "down" ? undefined : window.innerHeight - panelPos.top,
                left: panelPos.left,
              }}
            >
              <div className={cardClass}>
                {!plain && <span className={v.title}>{title}</span>}
                {grid}
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
      {!plain && <span className={v.title}>{title}</span>}
      {grid}
    </div>
  );
}
