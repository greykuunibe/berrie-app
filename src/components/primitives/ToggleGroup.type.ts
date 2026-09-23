import type { ReactNode } from "react";
import type { IconComponent } from "@components/primitives/Icons";

export interface ToggleOption {
  icon?: IconComponent;
  label?: string;
  value: string;
}

export type ToggleGroupProps =
  | {
      variant: "toggle";
      options: ToggleOption[];
      value: string;
      onChange: (value: string) => void;
      iconOnly?: boolean;
      stretch?: boolean;
    }
  | {
      variant: "openMenu";
      children: ReactNode;
    };
