import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ButtonTrigger, ResourceCard } from "@components/primitives";
import { MenuItem } from "@components/primitives/MenuItem";
import { useBibleStore } from "@/stores/bible.store";
import { useResourcesStore } from "@/stores/resources.store";

const MENU_MAX = 5;

export function TranslationMenu() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [morePos, setMorePos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const translations = useBibleStore((s) => s.translations);
  const activeTranslation = useBibleStore((s) => s.activeTranslation);
  const setActiveTranslation = useBibleStore((s) => s.setActiveTranslation);
  const { localTranslationIds, downloadTranslation, removeTranslation } = useResourcesStore();

  const sorted = [
    ...translations.filter((t) => t.id === activeTranslation?.id),
    ...translations.filter((t) => t.id !== activeTranslation?.id),
  ];
  const visible = sorted.slice(0, MENU_MAX);
  const hidden = sorted.slice(MENU_MAX);

  function handleToggle() {
    if (!open && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen((v) => !v);
    setMoreOpen(false);
  }

  function handleMore() {
    if (panelRef.current) {
      const r = panelRef.current.getBoundingClientRect();
      setMorePos({ top: r.top, left: r.right + 4 });
    }
    setMoreOpen((v) => !v);
  }

  function select(t: typeof translations[number]) {
    setActiveTranslation(t);
    setOpen(false);
    setMoreOpen(false);
  }

  function closeAll() {
    setOpen(false);
    setMoreOpen(false);
  }

  return (
    <div ref={anchorRef}>
      <ButtonTrigger open={open} onClick={handleToggle} width={76} >
        {activeTranslation?.abbreviation ?? "KJV"}
      </ButtonTrigger>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={closeAll} />
          <div
            ref={panelRef}
            className="fixed z-999 flex flex-col p-1 gap-1 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl w-85"
            style={{ top: pos.top, left: pos.left }}
          >
            {visible.map((t) => (
              <ResourceCard
                key={t.id}
                abbr={t.abbreviation}
                title={t.title}
                subtitle={t.license ?? undefined}
                isSelected={activeTranslation?.id === t.id}
                isLocal={localTranslationIds.includes(t.id)}
                onSelect={() => select(t)}
                onDownload={() => downloadTranslation(t.id)}
                onRemove={() => removeTranslation(t.id)}
              />
            ))}
            {hidden.length > 0 && (
              <MenuItem label="More..." onClick={handleMore} />
            )}
          </div>
          {moreOpen && (
            <div
              className="fixed z-999 flex flex-col p-1 gap-1 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl w-85"
              style={{ top: morePos.top, left: morePos.left }}
            >
              {hidden.map((t) => (
                <ResourceCard
                  key={t.id}
                  abbr={t.abbreviation}
                  title={t.title}
                  subtitle={t.license ?? undefined}
                  isSelected={activeTranslation?.id === t.id}
                  isLocal={localTranslationIds.includes(t.id)}
                  onSelect={() => select(t)}
                  onDownload={() => downloadTranslation(t.id)}
                  onRemove={() => removeTranslation(t.id)}
                />
              ))}
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}
