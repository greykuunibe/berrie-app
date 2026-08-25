import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { WindowTitleBar } from "./WindowTitleBar";
import { ReaderBookSelectionMenu, ResourcePanel } from "@components/bible";
import { Button, ButtonTrigger, ResourceCard } from "@components/primitives";
import { MenuItem } from "@components/primitives/Menu";
import { Bible, Search, Notes, ChevronLeft, Resources } from "@Icons";
import { useBibleStore } from "@/stores/bible.store";
import { useResourcesStore } from "@/stores/resources.store";

// ── Translation picker ────────────────────────────────────────────────────────

const MENU_MAX = 5;

function TranslationMenu() {
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

  // Active translation always first
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
      <ButtonTrigger open={open} onClick={handleToggle} width={76}>
        {activeTranslation?.abbreviation ?? "KJV"}
      </ButtonTrigger>

      {open && createPortal(
        <>
          {/* Backdrop — closes everything */}
          <div className="fixed inset-0 z-998" onClick={closeAll} />

          {/* Primary panel */}
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

          {/* More panel — separate floating menu with remaining translations */}
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

function useTitleBarConfig(onToggleResources: () => void) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentBook = useBibleStore((s) => s.currentBook);

  const mainToggle = {
    options: [
      { icon: Bible, label: "Bible", value: "bible" },
      { icon: Notes, label: "Notes", value: "notes" },
    ],
    value: pathname.startsWith("/app/notes") ? "notes" : "bible",
    onChange: (v: string) => navigate(v === "notes" ? "/app/notes" : "/app"),
  };

  const resourcesBtn = (
    <Button variant="primary" size="sm" icon={Resources} iconButton onClick={onToggleResources} />
  );

  if (pathname.startsWith("/app/reader/")) {
    const chParam = searchParams.get("ch");
    const vParam = searchParams.get("v");

    return {
      title: "Bible",
      toggle: mainToggle,
      onBack: undefined,
      centerActions: (
        <>
          <TranslationMenu />
          <ReaderBookSelectionMenu
            book={currentBook ?? undefined}
            chParam={chParam ?? "1"}
            vParam={vParam}
          />
        </>
      ),
      rightActions: (
        <>
          <Button variant="primary" size="sm" icon={Search} iconButton />
          {resourcesBtn}
        </>
      ),
    };
  }

  if (pathname.startsWith("/app/settings")) {
    return { title: "Settings", toggle: mainToggle, rightActions: undefined, onBack: undefined, centerActions: undefined };
  }

  return {
    title: pathname.startsWith("/app/notes") ? "Notes" : "Bible",
    toggle: mainToggle,
    onBack: undefined,
    rightActions: (
      <>
        <Button variant="primary" size="sm" icon={Search} iconButton />
        {!pathname.startsWith("/app/notes") && resourcesBtn}
      </>
    ),
  };
}

export function AppLayout() {
  const { isPanelOpen, togglePanel, setPanelOpen } = useResourcesStore();
  const config = useTitleBarConfig(togglePanel);

  return (
    <>
      <WindowTitleBar
        title={config.title}
        toggle={config.toggle}
        rightActions={config.rightActions}
        centerActions={config.centerActions}
      />
      <div className="flex h-[calc(100vh-50px)] w-full px-2 pb-2 bg-surface-0">
        {/* White card — flex row; content shifts left as panel opens inside */}
        <div className="flex flex-row flex-1 min-w-0 bg-surface-1 border border-border-gray-1 rounded-2xl overflow-x-hidden">
          {/* Reading area — shrinks when panel opens; floating buttons move with it */}
          <main className="relative flex-1 min-w-0 h-full overflow-y-auto px-4 scrollbar-stable">
            {config.onBack && (
              <div className="absolute top-6 left-24 z-10">
                <Button
                  variant="primary"
                  size="sm"
                  icon={ChevronLeft}
                  iconPosition="left"
                  onClick={config.onBack}
                >
                  Back
                </Button>
              </div>
            )}
            <Outlet />
          </main>

          {/* Resource panel — inside the white card, animates width to push content left */}
          <AnimatePresence initial={false}>
            {isPanelOpen && (
              <motion.div
                key="resource-panel"
                className="flex-shrink-0 h-full py-1 pr-1"
                initial={{ width: 0 }}
                animate={{ width: "40%" }}
                exit={{ width: 0 }}
                transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              >
                <ResourcePanel onClose={() => setPanelOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
