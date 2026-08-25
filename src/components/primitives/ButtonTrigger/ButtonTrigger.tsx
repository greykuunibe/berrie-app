import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Button } from "@components/primitives/Button";
import { Icon } from "@components/primitives/Icons";
import { ChevronDown } from "@Icons";

export interface ButtonTriggerProps {
  open: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Fixed width in px — omit to let the button size to its content. */
  width?: number;
  variant?: "primary" | "brand";
  /**
   * Split mode: left half (label) triggers `onSelect`, right half (chevron) triggers `onClick`.
   * A divider separates them so toggling does not open the menu.
   */
  onSelect?: () => void;
}

const ICON_COLOR = {
  primary: "muted" as const,
  brand: "white" as const,
};

export function ButtonTrigger({ open, onClick, children, width, variant = "primary", onSelect }: ButtonTriggerProps) {
  // ── Unified mode (original behaviour) ───────────────────────────────────────
  if (!onSelect) {
    return (
      <Button
        variant={variant}
        size="sm"
        className="min-w-0! justify-between! pr-3!"
        style={width ? { width } : undefined}
        onClick={onClick}
      >
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap text-left block"
          style={width ? { maxWidth: width - 48 } : undefined}
        >
          {children}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 ml-1"
        >
          <Icon icon={ChevronDown} size={16} color={ICON_COLOR[variant]} />
        </motion.span>
      </Button>
    );
  }

  // ── Split mode — label toggles, chevron opens menu ───────────────────────────
  const borderColor = variant === "brand" ? "border-white/30" : "border-border-gray-2";
  const baseCls =
    variant === "brand"
      ? "brand-gradient border border-border-brand text-white element-box-shadow"
      : "bg-surface-1 border border-border-gray-1 text-text-primary element-box-shadow";

  return (
    <div
      className={`inline-flex items-center rounded-full h-9 overflow-hidden ${baseCls}`}
      style={width ? { width } : undefined}
    >
      {/* Label section — primary action */}
      <button
        type="button"
        onClick={onSelect}
        className="flex items-center px-3 h-full text-sm font-medium whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer"
      >
        {children}
      </button>

      {/* Divider */}
      <div className={`self-stretch border-l shrink-0 ${borderColor}`} />

      {/* Chevron section — opens menu */}
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-center px-2.5 h-full hover:opacity-80 transition-opacity cursor-pointer"
        aria-label="Open menu"
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <Icon icon={ChevronDown} size={16} color={ICON_COLOR[variant]} />
        </motion.span>
      </button>
    </div>
  );
}
