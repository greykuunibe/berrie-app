import { useState } from "react";
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
}: CVSelectorProps) {
  const v = V[variant];
  const [open, setOpen] = useState(!defaultCollapsed);

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
    return (
      <div className="relative flex flex-col items-end">
        <ButtonTrigger variant="brand" open={open} onClick={() => setOpen((s) => !s)}>
          {title}
        </ButtonTrigger>
        {open && (
          <div className="absolute top-full right-0 mt-2 z-10">
            <div className={cardClass}>
              {!plain && <span className={v.title}>{title}</span>}
              {grid}
            </div>
          </div>
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
