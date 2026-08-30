import type { MenuProps } from "./Menu.type";

export function Menu({ children, className }: MenuProps) {
  return (
    <div
      className={[
        "flex flex-col text-base items-start p-1 gap-1",
        "w-50 min-w-50 max-h-75 overflow-y-auto",
        "bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
