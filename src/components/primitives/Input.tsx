import type { InputProps } from "./Input.type";
import { Icon } from "./Icons";
import { CircleX } from "lucide-react";

export function Input({
  label,
  icon,
  onClear,
  id,
  className,
  ...props
}: InputProps) {
  const hasValue = Boolean(props.value);
  const showClear = Boolean(onClear && hasValue);

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {icon && (
          <span className="pointer-events-none absolute left-3 inset-y-0 flex items-center">
            <Icon icon={icon} size={14} color="muted" />
          </span>
        )}
        <input
          id={id}
          className={[
            "h-9 w-full rounded-xl",
            "bg-surface-1",
            "border border-border-gray-1",
            icon ? "pl-8" : "pl-3",
            showClear ? "pr-8" : "pr-3",
            "py-1.5",
            "text-sm text-text-primary",
            "outline-none",
            "transition-[color,border-color,box-shadow]",
            "focus:border-border-brand focus:shadow-element-box-shadow",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 inset-y-0 flex items-center text-text-muted hover:text-text-primary transition-colors"
          >
            <CircleX size={16} />
          </button>
        )}
      </div>
    </div>
  );
}