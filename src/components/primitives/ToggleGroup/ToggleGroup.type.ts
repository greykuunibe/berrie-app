import type { IconComponent } from "@components/primitives/Icons";

export type ToggleGroupVariant = "flat" | "elevated" | "icon";

export interface ToggleOption {
  icon: IconComponent;
  label?: string;
  value: string;
}

export interface ToggleGroupProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: ToggleGroupVariant;
}
