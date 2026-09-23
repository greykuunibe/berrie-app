import { useEffect } from "react";
import { useReaderUIStore } from "@/stores/readerUI.store";
import { isTauri } from "@tauri-apps/api/core";
import { WindowTitleBar } from "./WindowTitleBar";
import { NavBreadcrumb } from "./NavBreadcrumb";
import { TopBar } from "./TopBar";
import { ProfilePill } from "./ProfilePill";
import { ResourcesPanelContent, ResourcesPanelActions, TranslationMenu, CVSelector } from "@components/bible";
import { GlobalSidePanel } from "./GlobalSidePanel";
import { useSidePanelStore } from "@/stores/sidePanel.store";
import { Button, FooterBlur, ToggleGroup, Toaster } from "@components/primitives";
import { Search, Resources } from "@Icons";
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

// ── Reading controls (TopBar center, reader only) ─────────────────────────────

function ReadingControls() {
  const { chapters, activeChapter, onSelectChapter } = useReaderUIStore();
  return (
    <div className="flex items-center gap-2">
      <TranslationMenu />
      <CVSelector title="Chapters" triggerLabel={`Chapter ${activeChapter}`} variant="md" items={chapters} selected={activeChapter} onSelect={onSelectChapter} collapsible defaultCollapsed direction="down" />
    </div>
  );
}

// ── AppLayout ─────────────────────────────────────────────────────────────────

export function AppLayout() {
  const { tabs, activeTabId } = useTabsStore();
  const { content: panelContent, toggle: togglePanel, close: closePanel } = useSidePanelStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const isReader = activeTab?.type === "reader";

  useEffect(() => {
    if (!isReader && panelContent !== null) closePanel();
  }, [isReader]);

  return (
    <>
      <Toaster />
      <WindowTitleBar />
      <div className={`flex gap-2 px-2 w-full bg-surface-0 ${isTauri() ? "h-[calc(100vh-35px)] pb-2 pt-0 " : "h-screen py-2 "}`}>
        <div className="flex flex-col flex-1 min-w-0 bg-surface-1 border border-border-gray-1 rounded-2xl overflow-hidden">
          <TopBar
            left={<NavBreadcrumb />}
            center={isReader ? <ReadingControls /> : undefined}
            right={
              <>
                <ToggleGroup variant="openMenu">
                  <Button variant="ghost" size="sm" icon={Search} iconButton />
                  {isReader && <Button variant="ghost" size="sm" icon={Resources} iconButton iconColor={panelContent === "resources" ? "brand" : "primary"} onClick={() => togglePanel("resources")} />}
                </ToggleGroup>
                <ProfilePill />
              </>
            }
          />

          {/* Content*/}
          <div className="flex flex-row flex-1 min-w-0 min-h-0">
            <div className="relative flex-1 min-h-0">
              <FooterBlur />
              <div className="h-full overflow-hidden">
                <TabContentRenderer tab={activeTab} />
              </div>
            </div>
          </div>
        </div>

        {/* Global side panel — sibling of main card, full height */}
        <GlobalSidePanel actions={panelContent === "resources" ? <ResourcesPanelActions /> : undefined}>
          {panelContent === "resources" && <ResourcesPanelContent />}
        </GlobalSidePanel>
      </div>
    </>
  );
}
