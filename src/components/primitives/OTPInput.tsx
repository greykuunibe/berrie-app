import { useRef, useEffect } from "react";
import type { OTPInputProps } from "./OTPInput.type";

const EMPTY: string[] = ["", "", "", "", "", ""];

export function OTPInput({
  value,
  onChange,
  onComplete,
  error,
  autoFocus,
}: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value ?? EMPTY;

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange?.(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) onComplete?.(next.join(""));
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => {
      if (i < 6) next[i] = ch;
    });
    onChange?.(next);
    const firstEmpty = next.findIndex((d) => d === "");
    refs.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus();
    if (next.every((d) => d !== "")) onComplete?.(next.join(""));
  }

  const boxClass = [
    "w-16 h-16 text-center text-xl font-medium",
    "text-text-primary bg-surface-1",
    "border rounded-xl element-box-shadow outline-none transition-colors",
    error
      ? "border-red-400 focus:border-red-500"
      : "border-border-gray-1 focus:border-border-brand",
  ].join(" ");

  return (
    <div className="flex items-center gap-1" onPaste={handlePaste}>
      {[0, 1, 2].map((i) => (
        <div className="w-fit h-fit flex items-center justify-center p-0.5 border border-border-gray-1 rounded-[14px] ">
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={boxClass}
            aria-label={`OTP digit ${i + 1}`}
          />
        </div>
      ))}
      <div className="w-4" aria-hidden="true" />
      {[3, 4, 5].map((i) => (
        <div className="w-fit h-fit flex items-center justify-center p-0.5 border border-border-gray-1 rounded-[14px] ">
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={boxClass}
            aria-label={`OTP digit ${i + 1}`}
          />
        </div>
      ))}
    </div>
  );
}
