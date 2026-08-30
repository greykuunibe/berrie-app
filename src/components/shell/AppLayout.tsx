import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WindowTitleBar } from "./WindowTitleBar";
import { TopBar } from "./TopBar";
import { ProfilePill } from "./ProfilePill";
import { ResourcePanel, TranslationMenu, ReaderBookSelectionMenu } from "@components/bible";
import { Button } from "@components/primitives";
import { Search, Resources, XMark } from "@Icons";
import { useResourcesStore } from "@/stores/resources.store";
import { useBibleStore } from "@/stores/bible.store";
import { useTabsStore } from "@/stores/tabs.store";
import { Home } from "@/pages/Home";
import { BibleLibrary } from "@/pages/BibleLibrary";
import { Notes } from "@/pages/Notes";
import { Reader } from "@/pages/Reader";
import type { Tab } from "@/types/tabs";

// ── Tab content renderer ──────────────────────────────────────────────────────

function TabContentRenderer({ tab }: { tab: Tab }) {
  switch (tab.type) {
    case "home":
      return <Home />;
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
  rightActions?: ReactNode;
} {
  const resourcesBtn = (
    <Button variant="primary" size="sm" icon={Resources} iconButton onClick={onToggleResources} />
  );

  if (activeTab?.type === "reader") {
    return {
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

  return {
    rightActions: (
      <Button variant="primary" size="sm" icon={Search} iconButton />
    ),
  };
}

// ── Reader controls overlay ───────────────────────────────────────────────────

function ReaderControls({ tab }: { tab: Tab }) {
  const currentBook = useBibleStore((s) => s.currentBook);
  const activeChapter = tab.params.chapter ?? "1";

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        <TranslationMenu />
        <ReaderBookSelectionMenu
          book={currentBook ?? undefined}
          chParam={activeChapter}
          vParam={null}
        />
      </div>
    </div>
  );
}

// ── Side pane ─────────────────────────────────────────────────────────────────

function SidePane({ tab, onClose }: { tab: Tab; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full border-l border-border-gray-1">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-gray-1 shrink-0">
        <span className="text-sm font-medium text-text-primary truncate max-w-40">
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

  // Close the resource panel when the active tab is not a reader
  useEffect(() => {
    if (activeTab?.type !== "reader" && isPanelOpen) {
      setPanelOpen(false);
    }
  }, [activeTab?.type]);

  const config = useTitleBarConfig(activeTab, togglePanel);

  return (
    <>
      <WindowTitleBar />
      <div className="flex h-[calc(100vh-50px)] w-full px-2 pb-2 bg-surface-0">
        <div className="flex flex-col flex-1 min-w-0 bg-surface-1 border border-border-gray-1 rounded-2xl overflow-hidden">
          {/* TopBar — outside the scroll container so scrollbar gutter doesn't affect it */}
          <TopBar
            right={
              <>
                {config.rightActions}
                <ProfilePill />
              </>
            }
          />

          {/* Content row */}
          <div className="flex flex-row flex-1 min-w-0 min-h-0 overflow-x-hidden">
            {/* Main content pane */}
            <main className="relative flex-1 min-w-0 h-full overflow-y-auto scrollbar-stable">
              {activeTab?.type === "reader" && (
                <ReaderControls tab={activeTab} />
              )}
              <div className="pl-8 pr-6 ">
                <TabContentRenderer tab={activeTab} />
              </div>
            </main>

          {/* Side tab pane */}
          <AnimatePresence initial={false}>
            {sideTab && (
              <motion.div
                key="side-pane"
                className="shrink-0 h-full"
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
                className="shrink-0 h-full py-1 pr-1"
                initial={{ width: 0 }}
                animate={{ width: "40%" }}
                exit={{ width: 0 }}
                transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              >
                <ResourcePanel onClose={() => setPanelOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
          </div>{/* end content row */}
        </div>
      </div>
    </>
  );
}
