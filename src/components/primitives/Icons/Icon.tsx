import type { ComponentType, SVGProps } from "react";

export type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;

export type IconColor = "muted" | "primary" | "white" | "brand";

export interface IconProps extends SVGProps<SVGSVGElement> {
  icon: IconComponent;
  color?: IconColor;
  size?: number | string;
}

const iconColorStyles: Record<IconColor, string> = {
  muted: "text-text-muted",
  primary: "text-text-primary",
  white: "text-text-inverted",
  brand: "text-text-brand",
};

export function Icon({
  icon: IconComponent,
  color = "muted",
  size = 16,
  className,
  ...props
}: IconProps) {
  return (
    <IconComponent
      width={size}
      height={size}
      className={`${iconColorStyles[color]} ${className ?? ""}`}
      aria-hidden="true"
      {...props}
    />
  );
}
