import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from "react";
import { toast } from "@/lib/toast";
import { createPortal } from "react-dom";
import { TextSelectionToolbar } from "@components/bible/TextSelectionToolbar";
import { HIGHLIGHT_COLORS } from "@components/bible/TextSelectionToolbar";
import type { HighlightColor } from "@components/bible/TextSelectionToolbar";

// ── CSS Custom Highlight API setup ────────────────────────────────────────────

const STYLE_ID = "berrie-highlight-styles";

function ensureHighlightStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = Object.entries(HIGHLIGHT_COLORS)
    .map(([name, { bg }]) => `::highlight(berrie-hl-${name}) { background-color: ${bg}; }`)
    .join("\n");
  document.head.appendChild(style);
}

// Per-color range lists (module-level — persist across container instances)
const colorRanges: Partial<Record<HighlightColor, Range[]>> = {};

function addHighlightRange(range: Range, color: HighlightColor) {
  if (!(CSS as any).highlights) return; // API not supported
  ensureHighlightStyles();
  const list = colorRanges[color] ?? [];
  list.push(range.cloneRange());
  colorRanges[color] = list;
  (CSS as any).highlights.set(`berrie-hl-${color}`, new (window as any).Highlight(...list));
}

// ── SelectionContainer ────────────────────────────────────────────────────────

interface SelectionContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function SelectionContainer({ children, className, style }: SelectionContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextMouseUp = useRef(false);
  const pendingRange = useRef<Range | null>(null);
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => { ensureHighlightStyles(); }, []);

  function handleMouseUp() {
    if (skipNextMouseUp.current) {
      skipNextMouseUp.current = false;
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    const range = sel.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    pendingRange.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    setToolbar({ top: rect.top, left: rect.left + rect.width / 2 });
  }

  function dismiss() {
    setToolbar(null);
    pendingRange.current = null;
    window.getSelection()?.removeAllRanges();
  }

  function handleHighlight(color: HighlightColor | null) {
    if (color && pendingRange.current) {
      addHighlightRange(pendingRange.current, color);
    }
    dismiss();
  }

  function handleCopy() {
    const text = window.getSelection()?.toString();
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success("Copied to clipboard"))
        .catch(() => toast.error("Failed to copy"));
    }
    dismiss();
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      onMouseUp={handleMouseUp}
    >
      {children}

      {toolbar && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={dismiss} />
          <div
            className="fixed z-999"
            data-selection-toolbar
            onMouseDown={() => { skipNextMouseUp.current = true; }}
            style={{
              top: toolbar.top - 48,
              left: toolbar.left - 157,
            }}
          >
            <TextSelectionToolbar
              activeColor={null}
              onHighlight={handleHighlight}
              onSaveNote={(_text: string) => dismiss()}
              onClose={handleCopy}
            />
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
