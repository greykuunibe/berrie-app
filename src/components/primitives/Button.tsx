import type { ButtonProps, ButtonStates } from "./Button.type";
import { useState } from "react";
import { Icon, Loader, Check, XMark } from "@Icons";
import { AnimatePresence, motion } from "motion/react";

const baseStyle =
  "inline-flex items-center cursor-pointer justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-sm transition-[color,transform]";

const variantStyles = {
  primary:
    "bg-surface-1 border border-border-gray-1 text-text-primary element-box-shadow",
  secondary: "bg-surface-2 border border-border-gray-2 text-text-primary",
  brand:
    "brand-gradient border border-border-brand text-white element-box-shadow",
  ghost: "bg-transparent border border-transparent text-text-primary",
};

const stateIcons = {
  success: Check,
  failed: XMark,
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: IconComponent,
  iconButton = false,
  iconPosition = "left",

  onAction,

  isDisabled = false,
  isFullWidth = false,
  className,

  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: iconButton ? "h-9 w-9 p-0" : "h-9 w-fit min-w-22 px-3",
    md: iconButton ? "h-10 w-10 p-0" : "h-10 w-fit min-w-22.5 px-3",
  };

  const [internalState, setInternalState] = useState<ButtonStates>("idle");

  const handleAction = async () => {
    if (internalState === "processing" || !onAction) return;

    setInternalState("processing");

    try {
      await onAction?.();
      setInternalState("success");
    } catch (error) {
      setInternalState("failed");
    }

    setTimeout(() => {
      setInternalState("idle");
    }, 400);
  };

  const iconColor = variant === "brand" ? "white" : "muted";

  const buttonClassName = [
    baseStyle,
    "relative",
    variantStyles[variant],
    sizeStyles[size],
    isFullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      type="button"
      className={buttonClassName}
      disabled={isDisabled || internalState === "processing"}
      onClick={handleAction}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      <motion.span
        key="idle"
        initial={{ opacity: 1, y: 0 }}
        animate={{
          opacity: internalState === "idle" ? 1 : 0,
          y:
            internalState === "idle"
              ? 0
              : internalState === "processing"
                ? 0
                : -10,
        }}
        transition={{
          duration: 0.12,
          ease: "easeIn",
          delay: internalState === "idle" ? 0.18 : 0,
        }}
        className={`inline-flex items-center gap-1.5`}
      >
        {iconButton ? (
          IconComponent && <Icon icon={IconComponent} color={iconColor} />
        ) : (
          <>
            {IconComponent && iconPosition === "left" && (
              <Icon icon={IconComponent} color={iconColor} />
            )}
            {children}
            {IconComponent && iconPosition === "right" && (
              <Icon icon={IconComponent} color={iconColor} />
            )}
          </>
        )}
      </motion.span>

      <AnimatePresence mode="wait" initial={false}>
        {internalState === "processing" && (
          <motion.span
            key="processing"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              y: { duration: 0.16, ease: "easeOut" },
              opacity: { duration: 0.12 },
              scale: { duration: 0.1 },
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon icon={Loader} color={iconColor} className="animate-spin" />
          </motion.span>
        )}

        {internalState === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon icon={stateIcons.success} color={iconColor} />
          </motion.span>
        )}

        {internalState === "failed" && (
          <motion.span
            key="failed"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon icon={stateIcons.failed} color={iconColor} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}