import { Button } from "@components/primitives";
import { Icon } from "@components/primitives/Icons";
import { XMark, Bible, Notes as NotesIcon, Home } from "@Icons";

import { useTabsStore } from "@/stores/tabs.store";
import type { TabType } from "@/types/tabs";

const TAB_ICON: Record<TabType, typeof Bible> = {
  "home":          Home,
  "bible-library": Bible,
  "reader":        Bible,
  "notes-list":    NotesIcon,
  "note":          NotesIcon,
};

// ── TabBar — user-opened tabs only ───────────────────────────────────────────

export function TabBar() {
  const { tabs, activeTabId, activateTab, closeTab } = useTabsStore();

  const userTabs = tabs.filter((t) => t.type !== "home" && t.type !== "bible-library" && t.type !== "notes-list");

  if (userTabs.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {userTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <Button
            key={tab.id}
            variant={isActive ? "primary" : "secondary"}
            size="sm"
            // icon={TAB_ICON[tab.type]}
            // iconPosition="left"
            className="group rounded-lg!"
            onClick={() => activateTab(tab.id)}
          >
            {tab.label}
            <span
              className={`inline-flex items-center justify-center ml-1 rounded-sm transition-all hover:bg-black/10 p-0.5 ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              aria-label={`Close ${tab.label}`}
            >
              <Icon icon={XMark} size={16} color="muted" />
            </span>
          </Button>
        );
      })}
    </div>
  );
}
