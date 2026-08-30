import type { ComponentType, SVGProps } from "react";
import type { HTMLMotionProps } from "motion/react";

export type ButtonVariant = "primary" | "secondary" | "brand" | "ghost";

export type ButtonSize = "sm" | "md";

export type ButtonIconPosition = "left" | "right";

export type ButtonIcon = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;

export type ButtonStates = "idle" | "processing" | "success" | "failed";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ButtonIcon;
  iconButton?: boolean;
  iconPosition?: ButtonIconPosition;

  state?: ButtonStates;
  onAction?: () => Promise<void>;

  isFullWidth?: boolean;
  isDisabled?: boolean;
}
