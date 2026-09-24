import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@components/primitives/Icons";
import { Menu } from "@components/primitives/Menu";
import { MenuItem } from "@components/primitives/MenuItem";
import { Check, Download, Remove, More, Cloud, Info, Delete } from "@Icons";

export interface ResourceCardProps {
  abbr: string;
  title: string;
  subtitle?: string;
  variant?: "default" | "elevated";
  isSelected?: boolean;
  isLocal?: boolean;
  onSelect?: () => void;
  onDownload?: () => void;
  onRemove?: () => void;
  onMoreInfo?: () => void;
  onDelete?: () => void;
}

export function ResourceCard({
  abbr,
  title,
  subtitle,
  variant = "default",
  isSelected = false,
  isLocal = false,
  onSelect,
  onDownload,
  onRemove,
  onMoreInfo,
  onDelete,
}: ResourceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const moreRef = useRef<HTMLButtonElement>(null);

  function handleMore(e: React.MouseEvent) {
    e.stopPropagation();
    if (!moreRef.current) return;
    const r = moreRef.current.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: r.right - 200 });
    setMenuOpen(v => !v);
  }

  const cardClass = [
    "flex flex-row items-center gap-2 rounded-lg w-full py-1 pl-1 pr-2",
    variant === "elevated"
      ? "bg-surface-1 border border-border-gray-1 element-box-shadow"
      : "bg-surface-1 hover:bg-surface-0 transition-colors",
  ].join(" ");

  return (
    <>
      <div className={`${cardClass} cursor-pointer`} onClick={onSelect}>
        {/* Abbreviation badge */}
        <div className={`flex flex-col justify-center items-center w-10.5 h-10.5 shrink-0 overflow-hidden border element-box-shadow rounded-md ${isSelected ? "brand-gradient border-border-brand" : "bg-surface-0 border-border-gray-1"}`}>
          <span className={`text-xs leading-4 font-medium w-full text-center truncate px-0.5 ${isSelected ? "text-text-inverted" : "text-text-muted"}`}>
            {abbr}
          </span>
        </div>

        {/* Description */}
        <div className="flex flex-col justify-center items-start flex-1 min-w-0">
          <span className="text-sm leading-4.5 text-text-primary truncate w-full">{title}</span>
          {subtitle && (
            <span className="text-xs leading-4 text-text-muted truncate w-full">{subtitle}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isSelected && (
            <span aria-label="Selected">
              <Icon icon={Check} size={16} color="brand" />
            </span>
          )}

          {isLocal ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
              className="cursor-pointer"
              aria-label="Remove"
            >
              <Icon icon={Remove} size={16} color="muted" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
              className="cursor-pointer"
              aria-label="Download"
            >
              <Icon icon={Download} size={16} color="muted" />
            </button>
          )}

          <button
            ref={moreRef}
            type="button"
            onClick={handleMore}
            className="cursor-pointer"
            aria-label="More options"
          >
            <Icon icon={More} size={16} color="muted" />
          </button>
        </div>
      </div>

      {/* More menu — portal, positioned below the More button */}
      {menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setMenuOpen(false)} />
          <div className="fixed z-[1001]" style={{ top: menuPos.top, left: menuPos.left }}>
            <Menu>
              <MenuItem
                icon={Cloud}
                label="Revert to cloud"
                onClick={() => { onRemove?.(); setMenuOpen(false); }}
              />
              <MenuItem
                icon={Info}
                label="More info"
                onClick={() => { onMoreInfo?.(); setMenuOpen(false); }}
              />
              <MenuItem
                icon={Delete}
                label="Delete version"
                danger
                onClick={() => { onDelete?.(); setMenuOpen(false); }}
              />
            </Menu>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
