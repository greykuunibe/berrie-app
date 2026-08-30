import { Icon } from "@components/primitives/Icons";
import { Check } from "@Icons";
import type { MenuItemProps } from "./Menu.type";

export function MenuItem({ icon, label, onClick, rightIcon, selected, danger, disabled }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-center justify-between w-full min-h-6.5 px-2 py-2 gap-1.5 rounded-md text-left transition-colors",
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-text-primary hover:bg-surface-2",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {icon && <Icon icon={icon} size={16} color={danger ? "danger" : "muted"} />}
        <span
          className="text-sm leading-none truncate"
          style={{ color: danger ? "#F03737" : undefined }}
        >
          {label}
        </span>
      </span>

      {selected && <Icon icon={Check} size={16} color="brand" />}
      {!selected && rightIcon && <Icon icon={rightIcon} size={16} color="muted" />}
    </button>
  );
}
