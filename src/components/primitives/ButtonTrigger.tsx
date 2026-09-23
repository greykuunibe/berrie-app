import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Button, variantStyles } from "@components/primitives/Button";
import { Icon } from "@components/primitives/Icons";
import { ChevronDown } from "@Icons";

export interface ButtonTriggerProps {
  open: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Fixed width in px — omit to let the button size to its content. */
  width?: number;
  variant?: "primary" | "brand" | "secondary" | "ghost";
  className?: string;
  /**
   * Split mode: left half (label) triggers `onSelect`, right half (chevron) triggers `onClick`.
   * A divider separates them so toggling does not open the menu.
   */
  onSelect?: () => void;
}

const ICON_COLOR = {
  primary: "muted" as const,
  brand: "white" as const,
  secondary: "primary" as const,
  ghost: "primary" as const,
};

export function ButtonTrigger({ open, onClick, children, width, variant = "primary", className, onSelect }: ButtonTriggerProps) {
  // ── Unified mode (original behaviour) ───────────────────────────────────────
  if (!onSelect) {
    return (
      <Button
        variant={variant}
        size="sm"
        className={["min-w-0! pr-3! [&>span:first-child]:flex [&>span:first-child]:w-full [&>span:first-child]:items-center [&>span:first-child]:justify-between", className].filter(Boolean).join(" ")}
        style={width ? { width } : undefined}
        onClick={onClick}
      >
        <span
          className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left"
          style={width ? { maxWidth: width - 48 } : undefined}
        >
          {children}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0"
        >
          <Icon icon={ChevronDown} size={14} color={ICON_COLOR[variant]} />
        </motion.span>
      </Button>
    );
  }

  // ── Split mode — label toggles, chevron opens menu ───────────────────────────
  const dividerColor = variant === "brand" ? "border-white/30" : "border-border-gray-2";

  return (
    <div
      className={`inline-flex items-center rounded-full h-9 overflow-hidden ${variantStyles[variant]}`}
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
      <div className={`self-stretch border-l shrink-0 ${dividerColor}`} />

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
