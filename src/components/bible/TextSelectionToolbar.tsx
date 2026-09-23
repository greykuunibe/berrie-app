import { useRef, useState } from "react";
import { Button } from "@components/primitives";
import { Icon } from "@components/primitives/Icons";
import { CopyOutline, ShareOutline, AddNoteOutline, Upload } from "@Icons";
import { toast } from "@/lib/toast";

// ── 9-color palette + white (default/clear) ───────────────────────────────────

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export const HIGHLIGHT_COLORS: Record<HighlightColor, { bg: string; border: string }> = {
  yellow: { bg: "#FEF999", border: "#F4EE93" },
  green:  { bg: "#DEFFC6", border: "#D1F6B5" },
  blue:   { bg: "#C8DDF8", border: "#A8C8F0" },
  pink:   { bg: "#FFD6E7", border: "#F5B3CC" },
  purple: { bg: "#C2C4FF", border: "#B6B8FC" },
};

const WHITE_SWATCH = { bg: "#FFFFFF", border: "#E7E5E4" };

const COLOR_ORDER: HighlightColor[] = ["yellow", "green", "blue", "pink", "purple"];

export const SELECTED_BG = "#C8DDF8";


// ── TextSelectionToolbar ──────────────────────────────────────────────────────

export interface TextSelectionToolbarProps {
  activeColor?: HighlightColor | null;
  onHighlight: (color: HighlightColor | null) => void;
  onSaveNote: (text: string) => void;
  onClose: () => void;
}

export function TextSelectionToolbar({
  activeColor,
  onHighlight,
  onSaveNote,
  onClose,
}: TextSelectionToolbarProps) {
  const [noteText, setNoteText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="relative w-fit">
      <div
        className="flex flex-col gap-2 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-2xl overflow-hidden"
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* ── Actions row ── */}
        <div className="flex items-center justify-between gap-2 px-2 pt-2">
          {[
            { icon: AddNoteOutline, label: "Save", action: () => {
              const text = window.getSelection()?.toString() ?? "";
              if (text) { onSaveNote(text); toast.success("Saved to notes"); }
              onClose();
            }},
            { icon: CopyOutline, label: "Copy", action: () => {
              const text = window.getSelection()?.toString() ?? "";
              if (text) navigator.clipboard.writeText(text).then(() => toast.success("Copied")).catch(() => toast.error("Failed to copy"));
              onClose();
            }},
            { icon: ShareOutline, label: "Share", action: onClose },
          ].map(({ icon, label, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="flex flex-col items-center gap-1 px-3 py-3 w-full rounded-lg bg-surface-0 transition-colors cursor-pointer"
            >
              <Icon icon={icon} size={24} color="muted" />
              <span className="text-xs text-text-muted">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Color row ── */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            title="Remove highlight"
            onClick={() => onHighlight(null)}
            className="w-7 h-7 rounded-full cursor-pointer shrink-0 transition-transform hover:scale-110"
            style={{
              background: WHITE_SWATCH.bg,
              border: `1.5px solid ${WHITE_SWATCH.border}`,
              outline: activeColor === null ? "2px solid #3d89f1" : undefined,
              outlineOffset: activeColor === null ? 1 : undefined,
            }}
          />
          {COLOR_ORDER.map((c) => {
            const { bg, border } = HIGHLIGHT_COLORS[c];
            return (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => onHighlight(c)}
                className="w-7 h-7 rounded-full cursor-pointer shrink-0 transition-transform hover:scale-110"
                style={{
                  background: bg,
                  border: `1.5px solid ${border}`,
                  outline: activeColor === c ? "2px solid #3d89f1" : undefined,
                  outlineOffset: activeColor === c ? 1 : undefined,
                }}
              />
            );
          })}
        </div>

        {/* ── Note input ── */}
        <div className="relative px-2 pb-1.5">
          <textarea
            ref={textareaRef}
            value={noteText}
            rows={1}
            placeholder="Add a note…"
            className="block w-full rounded-xl bg-surface-1 border border-border-gray-1 px-3 py-1.5 pr-8 text-sm text-text-primary outline-none transition-[border-color] focus:border-border-brand resize-none overflow-hidden leading-5"
            onMouseDown={(e) => {
              e.preventDefault();
              textareaRef.current?.focus();
            }}
            onChange={(e) => {
              setNoteText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (noteText.trim()) {
                  onSaveNote(noteText.trim());
                  setNoteText("");
                  e.currentTarget.style.height = "auto";
                }
              }
              if (e.key === "Escape") onClose();
            }}
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <Button
              variant="ghost"
              size="md"
              icon={Upload}
              iconButton
              iconColor={noteText.trim() ? "brand" : "muted"}
              onClick={() => {
                if (noteText.trim()) {
                  onSaveNote(noteText.trim());
                  setNoteText("");
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

