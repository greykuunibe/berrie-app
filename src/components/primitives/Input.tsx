import type { InputProps } from "./Input.type";

export function Input({
  label,
  error,
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

      <input
        id={id}
        className={[
          "h-10 w-full rounded-lg",
          "bg-surface-1",
          "border border-border-gray-1",
          "px-3 py-1.5",
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

      {error && (
        <span className="select-none text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}