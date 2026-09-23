import type { InputProps } from "./Input.type";
import { Icon } from "./Icons";

export function Input({
  label,
  error,
  icon,
  id,
  className,
  ...props
}: InputProps) {
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
          <span className="pointer-events-none absolute left-3">
            <Icon icon={icon} size={14} color="muted" />
          </span>
        )}
        <input
          id={id}
          className={[
            "h-10 w-full rounded-lg",
            "bg-surface-1",
            "border border-border-gray-1",
            icon ? "pl-8 pr-3" : "px-3",
            "py-1.5",
            "text-sm text-text-primary",
            "outline-none",
            "transition-[color,border-color,box-shadow]",
            "focus:border-border-brand focus:shadow-element-box-shadow",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:border-red-500",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>

      {error && (
        <span className="select-none text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}