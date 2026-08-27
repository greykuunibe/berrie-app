import { useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { WindowTitleBar } from "./WindowTitleBar";
import { ReaderBookSelectionMenu, ResourcePanel } from "@components/bible";
import { Button, ButtonTrigger, ResourceCard } from "@components/primitives";
import { MenuItem } from "@components/primitives/Menu";
import { Menu } from "@components/primitives/Menu";
import { Bible, Search, Resources, XMark, Notes as NotesIcon } from "@Icons";
import { useBibleStore } from "@/stores/bible.store";
import { useResourcesStore } from "@/stores/resources.store";
import { useTabsStore } from "@/stores/tabs.store";
import { BibleLibrary } from "@/pages/BibleLibrary";
import { Notes } from "@/pages/Notes";
import { Reader } from "@/pages/Reader";
import type { Tab, TabDescriptor } from "@/types/tabs";

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

// ── New tab menu ──────────────────────────────────────────────────────────────

function NewTabMenu({ onSelect }: { onSelect: (descriptor: TabDescriptor) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLButtonElement>(null);

  function handleToggle() {
    if (!open && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen((v) => !v);
  }

  function pick(descriptor: TabDescriptor) {
    onSelect(descriptor);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={anchorRef}
        className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors text-sm leading-none"
        onClick={handleToggle}
        aria-label="New tab"
      >
        +
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={() => setOpen(false)} />
          <div
            className="fixed z-999 flex flex-col p-1 gap-0.5 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl w-44"
            style={{ top: pos.top, left: pos.left }}
          >
            <MenuItem
              icon={Bible}
              label="Bible Library"
              onClick={() => pick({ type: "bible-library", label: "Library", params: {} })}
            />
            <MenuItem
              icon={NotesIcon}
              label="Notes"
              onClick={() => pick({ type: "notes-list", label: "Notes", params: {} })}
            />
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar() {
  const { tabs, activeTabId, activateTab, closeTab, openInNewTab } = useTabsStore();

  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`group flex items-center gap-1.5 px-2.5 h-7 rounded-lg cursor-pointer select-none transition-colors ${
              isActive
                ? "bg-surface-2 text-text-primary"
                : "text-text-muted hover:bg-surface-2/60 hover:text-text-primary"
            }`}
            onClick={() => activateTab(tab.id)}
          >
            <span className="text-sm font-medium max-w-[110px] truncate leading-none">
              {tab.label}
            </span>
            {tabs.length > 1 && (
              <button
                className="leading-none opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-opacity"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                aria-label={`Close ${tab.label}`}
              >
                <span className="text-xs">×</span>
              </button>
            )}
          </div>
        );
      })}
      <NewTabMenu onSelect={(d) => openInNewTab(d)} />
    </div>
  );
}

// ── Tab content renderer ──────────────────────────────────────────────────────

function TabContentRenderer({ tab }: { tab: Tab }) {
  switch (tab.type) {
    case "bible-library":
      return <BibleLibrary />;
    case "reader":
      return <Reader tabId={tab.id} bookId={tab.params.bookId} />;
    case "notes-list":
    case "note":
      return <Notes />;
    default:
      return null;
  }
}

// ── Title bar config ──────────────────────────────────────────────────────────

function useTitleBarConfig(activeTab: Tab | undefined, onToggleResources: () => void): {
  centerActions?: ReactNode;
  rightActions?: ReactNode;
} {
  const currentBook = useBibleStore((s) => s.currentBook);
  const activeTabChapter = activeTab?.params.chapter ?? "1";
  const activeTabVerse = activeTab?.params.verse ?? null;

  const resourcesBtn = (
    <Button variant="primary" size="sm" icon={Resources} iconButton onClick={onToggleResources} />
  );

  if (activeTab?.type === "reader") {
    return {
      centerActions: (
        <>
          <TranslationMenu />
          <ReaderBookSelectionMenu
            book={currentBook ?? undefined}
            chParam={activeTabChapter}
            vParam={activeTabVerse}
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

  if (activeTab?.type === "notes-list" || activeTab?.type === "note") {
    return {
      rightActions: (
        <Button variant="primary" size="sm" icon={Search} iconButton />
      ),
    };
  }

  // bible-library or fallback
  return {
    rightActions: (
      <>
        <Button variant="primary" size="sm" icon={Search} iconButton />
        {resourcesBtn}
      </>
    ),
  };
}

// ── Side pane ─────────────────────────────────────────────────────────────────

function SidePane({ tab, onClose }: { tab: Tab; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full border-l border-border-gray-1">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-gray-1 shrink-0">
        <span className="text-sm font-medium text-text-primary truncate max-w-[160px]">
          {tab.label}
        </span>
        <Button variant="primary" size="sm" icon={XMark} iconButton onClick={onClose} />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <TabContentRenderer tab={tab} />
      </div>
    </div>
  );
}

// ── AppLayout ─────────────────────────────────────────────────────────────────

export function AppLayout() {
  const { isPanelOpen, togglePanel, setPanelOpen } = useResourcesStore();
  const { tabs, activeTabId, sideTabId, closeSide } = useTabsStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const sideTab = sideTabId ? tabs.find((t) => t.id === sideTabId) : null;

  const config = useTitleBarConfig(activeTab, togglePanel);

  return (
    <>
      <WindowTitleBar
        tabBar={<TabBar />}
        rightActions={config.rightActions}
        centerActions={config.centerActions}
      />
      <div className="flex h-[calc(100vh-50px)] w-full px-2 pb-2 bg-surface-0">
        <div className="flex flex-row flex-1 min-w-0 bg-surface-1 border border-border-gray-1 rounded-2xl overflow-x-hidden">
          {/* Main content pane */}
          <main className="relative flex-1 min-w-0 h-full overflow-y-auto px-4 scrollbar-stable">
            <TabContentRenderer tab={activeTab} />
          </main>

          {/* Side tab pane */}
          <AnimatePresence initial={false}>
            {sideTab && (
              <motion.div
                key="side-pane"
                className="flex-shrink-0 h-full"
                initial={{ width: 0 }}
                animate={{ width: "38%" }}
                exit={{ width: 0 }}
                transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              >
                <SidePane tab={sideTab} onClose={closeSide} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resource panel */}
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
