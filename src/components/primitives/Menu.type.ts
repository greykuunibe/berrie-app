import type { IconComponent } from "@components/primitives/Icons";

export interface MenuItemProps {
  icon?: IconComponent;
  label: string;
  onClick?: () => void;
  rightIcon?: IconComponent;
  selected?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  children: React.ReactNode;
  className?: string;
}
