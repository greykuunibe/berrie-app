import { useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { WindowTitleBar } from "./WindowTitleBar";
import { NavBreadcrumb } from "./NavBreadcrumb";
import { TopBar } from "./TopBar";
import { ProfilePill } from "./ProfilePill";
import { TranslationMenu } from "@components/bible";
import { useSidePanelStore } from "@/stores/sidePanel.store";
import { useReaderUIStore } from "@/stores/readerUI.store";
import { Button, FooterBlur, Input, Toaster } from "@components/primitives";
import { Search, Resources } from "@Icons";
import { PanelLeft, PanelRight } from "lucide-react";
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


// ── AppLayout ─────────────────────────────────────────────────────────────────

export function AppLayout() {
  const { tabs, activeTabId } = useTabsStore();
  const { content: panelContent, toggle: togglePanel, close: closePanel } = useSidePanelStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const isReader = activeTab?.type === "reader";
  const { leftPanelOpen, toggleLeftPanel } = useReaderUIStore();

  useEffect(() => {
    if (!isReader && panelContent !== null) closePanel();
  }, [isReader]);

  return (
    <>
      <Toaster />
      <WindowTitleBar />
      <div className={`flex gap-2 w-full px-2 bg-surface-0 ${isTauri() ? "h-[calc(100vh-35px)] pb-2 pt-0 " : "h-screen py-2 "}`}>
        <div className="flex flex-col flex-1 min-w-0 bg-surface-1 border border-border-gray-1 rounded-2xl overflow-hidden">
          <TopBar
            left={
              <div className="flex items-center gap-1">
                {isReader && (
                  <Button variant="ghost" size="sm" iconButton iconSize={18} icon={PanelLeft} iconColor={leftPanelOpen ? "primary" : "muted"} onClick={toggleLeftPanel} />
                )}
                <NavBreadcrumb />
              </div>
            }
            center={<Input icon={Search} placeholder="Search…" className="min-w-96 " />}
            right={
              <>
                {isReader && <TranslationMenu />}
                {isReader && <Button variant="ghost" size="sm" icon={PanelRight} iconButton iconColor={panelContent === "resources" ? "brand" : "primary"} onClick={() => togglePanel("resources")} />}
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

      </div>
    </>
  );
}
