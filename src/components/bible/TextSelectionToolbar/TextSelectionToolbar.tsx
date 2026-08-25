import { useRef, useState } from "react";
import { Icon } from "@components/primitives/Icons";
import { Button } from "@components/primitives";
import { Copy, Share, Upload, Highlight, FaceSmile } from "@Icons";

// ── 9-color palette + white (default/clear) ───────────────────────────────────

export type HighlightColor =
  | "blue" | "green" | "yellow"
  | "purple" | "orange" | "pink"
  | "red" | "teal" | "lavender";

export const HIGHLIGHT_COLORS: Record<HighlightColor, { bg: string; border: string }> = {
  blue:     { bg: "#C8DDF8", border: "#A8C8F0" },
  green:    { bg: "#DEFFC6", border: "#D1F6B5" },
  yellow:   { bg: "#FEF999", border: "#F4EE93" },
  purple:   { bg: "#C2C4FF", border: "#B6B8FC" },
  orange:   { bg: "#FFD9A8", border: "#F5C680" },
  pink:     { bg: "#FFD6E7", border: "#F5B3CC" },
  red:      { bg: "#FFCDD2", border: "#F5A8B4" },
  teal:     { bg: "#B2F5EA", border: "#8BE8DA" },
  lavender: { bg: "#E8D5FF", border: "#D4ADFF" },
};

const WHITE_SWATCH = { bg: "#FFFFFF", border: "#E7E5E4" };

const COLOR_ORDER: HighlightColor[] = [
  "blue", "green", "yellow", "purple", "orange",
  "pink", "red", "teal", "lavender",
];

export const SELECTED_BG = "#C8DDF8";

// ── Emoji reaction set ────────────────────────────────────────────────────────

const REACTION_EMOJIS = [
  "❤️", "🙏", "😭", "😮", "😂",
  "🙌", "👏", "🔥", "💯", "⭐",
  "😊", "🥹", "😢", "😤", "🤔",
  "💪", "👍", "👎", "❓", "‼️",
];

// Module-level so recents survive toolbar re-mounts within a session
const recentEmojis: string[] = [];

function trackRecent(emoji: string) {
  const idx = recentEmojis.indexOf(emoji);
  if (idx !== -1) recentEmojis.splice(idx, 1);
  recentEmojis.unshift(emoji);
  if (recentEmojis.length > 5) recentEmojis.length = 5;
}

function EmojiButton({
  emoji,
  active,
  onPick,
}: {
  emoji: string;
  active?: boolean;
  onPick: (e: string) => void;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="min-w-0! w-7! h-7! p-0! rounded-lg! text-base shrink-0"
      style={active ? { outline: "2px solid #3d89f1", outlineOffset: 1 } : undefined}
      title={emoji}
      onClick={() => onPick(emoji)}
    >
      {emoji}
    </Button>
  );
}

export function EmojiPicker({
  onPick,
  activeEmoji,
}: {
  onPick: (emoji: string) => void;
  activeEmoji?: string;
}) {
  const [recents, setRecents] = useState<string[]>([...recentEmojis]);

  function handlePick(emoji: string) {
    trackRecent(emoji);
    setRecents([...recentEmojis]);
    onPick(emoji);
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-2xl w-fit">
      {recents.length > 0 && (
        <>
          <span className="text-xs font-medium text-text-muted leading-none">Recent</span>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1.75rem)" }}>
            {recents.map((emoji) => (
              <EmojiButton key={emoji} emoji={emoji} active={emoji === activeEmoji} onPick={handlePick} />
            ))}
          </div>
        </>
      )}
      <span className="text-xs font-medium text-text-muted leading-none">React</span>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1.75rem)" }}>
        {REACTION_EMOJIS.map((emoji) => (
          <EmojiButton key={emoji} emoji={emoji} active={emoji === activeEmoji} onPick={handlePick} />
        ))}
      </div>
    </div>
  );
}

// ── Color picker submenu ──────────────────────────────────────────────────────

function ColorPicker({
  activeColor,
  onPick,
}: {
  activeColor?: HighlightColor | null;
  onPick: (c: HighlightColor | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-2xl w-fit">
      <span className="text-xs font-medium text-text-muted leading-none">Highlight color</span>
      {/* Explicit column widths prevent swatch overlap */}
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1.75rem)" }}>
        {/* White — clear */}
        <button
          type="button"
          onClick={() => onPick(null)}
          title="None"
          className="w-7 h-7 rounded-full cursor-pointer transition-opacity hover:opacity-80 shrink-0"
          style={{
            background: WHITE_SWATCH.bg,
            border: `1.5px solid ${WHITE_SWATCH.border}`,
            outline: !activeColor ? "2px solid #3d89f1" : undefined,
            outlineOffset: !activeColor ? 1 : undefined,
          }}
        />
        {COLOR_ORDER.map((c) => {
          const { bg, border } = HIGHLIGHT_COLORS[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              title={c}
              className="w-7 h-7 rounded-full cursor-pointer transition-opacity hover:opacity-80 shrink-0"
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
    </div>
  );
}

// ── TextSelectionToolbar ──────────────────────────────────────────────────────

export interface TextSelectionToolbarProps {
  activeColor?: HighlightColor | null;
  onHighlight: (color: HighlightColor | null) => void;
  onSaveNote: (text: string) => void;
  onAddReaction?: (emoji: string) => void;
  onClose: () => void;
}

export function TextSelectionToolbar({
  activeColor,
  onHighlight,
  onSaveNote,
  onAddReaction,
  onClose,
}: TextSelectionToolbarProps) {
  const [showColors, setShowColors] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [noteText, setNoteText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="relative w-fit">
      {/* Emoji picker — absolute above */}
      {showEmojis && (
        <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-fit">
          <EmojiPicker
            onPick={(emoji) => {
              onAddReaction?.(emoji);
              setShowEmojis(false);
            }}
          />
        </div>
      )}

      {/* Color picker — absolute above, doesn't shift toolbar */}
      {showColors && (
        <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-fit">
          <ColorPicker
            activeColor={activeColor}
            onPick={(c) => {
              onHighlight(c);
              setShowColors(false);
            }}
          />
        </div>
      )}

      {/* Toolbar card — prevent mousedown default so the browser keeps the verse text selection alive */}
      <div
        className="flex flex-col bg-surface-1 border border-border-gray-1 element-box-shadow rounded-2xl overflow-hidden w-65"
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Icon row */}
        <div className="flex items-center gap-1 px-2 pt-2">
          {/* Highlight */}
          <ToolbarBtn
            onClick={() => setShowColors((v) => !v)}
            active={showColors || !!activeColor}
            title="Highlight"
          >
            <Icon icon={Highlight} size={16} color={showColors || activeColor ? "brand" : "muted"} />
          </ToolbarBtn>

          {/* Emoji reaction */}
          <Button
            variant="ghost"
            size="sm"
            icon={FaceSmile}
            iconButton
            title="React"
            onClick={() => { setShowEmojis((v) => !v); setShowColors(false); }}
          />

          {/* Copy */}
          <ToolbarBtn onClick={onClose} title="Copy">
            <Icon icon={Copy} size={16} color="muted" />
          </ToolbarBtn>

          {/* Share */}
          <ToolbarBtn onClick={onClose} title="Share">
            <Icon icon={Share} size={16} color="muted" />
          </ToolbarBtn>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-gray-1 mx-3" />

        {/* Note input — send button sits inside the textarea */}
        <div className="relative px-2 pb-1 pt-1">
          <textarea
            ref={textareaRef}
            value={noteText}
            rows={1}
            placeholder="Add a note…"
            className="w-full rounded-xl bg-surface-1 border border-border-gray-1 px-3 py-1.5 pr-10 text-sm text-text-primary outline-none transition-[border-color] focus:border-border-brand resize-none overflow-hidden leading-5"
            onMouseDown={(e) => {
              // Parent prevents all mousedowns to keep verse selection; re-focus manually
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
          {/* Ghost send button — absolute inside the textarea */}
          <div className="absolute bottom-2.5 right-3">
            <Button
              variant="ghost"
              size="sm"
              icon={Upload}
              iconButton
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

// ── ToolbarBtn ────────────────────────────────────────────────────────────────

function ToolbarBtn({
  children,
  onClick,
  active,
  title,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full cursor-pointer border border-transparent transition-colors hover:bg-surface-0"
      style={{
        background: active ? "var(--color-surface-0)" : "transparent",
        outline: active ? "1px solid var(--color-border-brand)" : undefined,
        outlineOffset: active ? 1 : undefined,
      }}
    >
      {children}
    </button>
  );
}
