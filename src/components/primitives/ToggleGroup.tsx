import { Button } from "@components/primitives/Button";
import type { ToggleGroupProps } from "./ToggleGroup.type";

/**
 * ToggleGroup — segmented control using Button components.
 *
 * Variants:
 *  flat          — no container background/border; 40px height overall
 *  elevated      — container has bg, border, shadow; 40px height overall
 *  icon          — elevated + icon-only buttons (no label text)
 */
export function ToggleGroup({ options, value, onChange, variant = "flat" }: ToggleGroupProps) {
  const isElevated = variant === "elevated" || variant === "icon";
  const isIconOnly = variant === "icon";

  const containerClass = [
    "flex items-center p-0.5 gap-0.5 rounded-full",
    isElevated ? "bg-surface-1 border border-border-gray-1 card-shadow" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      {options.map((opt) => {
        const active = opt.value === value;

        if (isIconOnly) {
          return (
            <Button
              key={opt.value}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              iconButton
              icon={opt.icon}
              onClick={() => onChange(opt.value)}
            />
          );
        }

        return (
          <Button
            key={opt.value}
            variant={active ? "secondary" : "ghost"}
            size="sm"
            icon={opt.icon}
            iconPosition="left"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
