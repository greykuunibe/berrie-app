import type { InputHTMLAttributes } from "react";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClear?: () => void;
}