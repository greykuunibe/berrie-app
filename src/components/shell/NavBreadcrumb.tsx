import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Icon } from "@components/primitives/Icons";
import { MenuItem } from "@components/primitives/MenuItem";
import { ChevronDown, ChevronRight } from "@Icons";
import { useTabsStore } from "@/stores/tabs.store";
import type { TabDescriptor } from "@/types/tabs";

const NAV_ITEMS: { label: string; descriptor: TabDescriptor }[] = [
  { label: "Bible",  descriptor: { type: "bible-library", label: "Bible Library", params: {} } },
  { label: "Notes",  descriptor: { type: "notes-list",    label: "Notes",         params: {} } },
];

export function NavBreadcrumb() {
  const [open, setOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const readerRowRef = useRef<HTMLButtonElement>(null);

  const { tabs, activeTabId, openTab, activateTab } = useTabsStore();
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const readerTabs = tabs.filter((t) => t.type === "reader");

  function handleToggle() {
    if (!open && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((v) => !v);
    setSubmenuOpen(false);
  }

  function handleReaderHover() {
    if (readerRowRef.current) {
      const r = readerRowRef.current.getBoundingClientRect();
      setSubmenuPos({ top: r.top, left: r.right + 4 });
    }
    setSubmenuOpen(true);
  }

  function navigate(id: string) {
    activateTab(id);
    setOpen(false);
    setSubmenuOpen(false);
  }

  function navigateTo(descriptor: TabDescriptor) {
    openTab(descriptor);
    setOpen(false);
    setSubmenuOpen(false);
  }

  function closeAll() {
    setOpen(false);
    setSubmenuOpen(false);
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center rounded-full gap-1 text-sm font-semibold text-text-primary hover:opacity-70 transition-opacity cursor-pointer select-none"
      >
        <span>
          {activeTab?.type === "reader" ? "Reader"
            : activeTab?.type === "bible-library" ? "Bible"
            : activeTab?.type === "notes-list" || activeTab?.type === "note" ? "Notes"
            : (activeTab?.label ?? "—")}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="text-text-muted p-0.5 rounded-full bg-surface-2"
        >
          <Icon icon={ChevronDown} size={14} color="primary" />
        </motion.span>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={closeAll} />

          {/* Main panel */}
          <div
            ref={panelRef}
            className="fixed z-999 flex flex-col p-1 gap-0.5 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl w-52"
            style={{ top: pos.top, left: pos.left }}
          >
            {NAV_ITEMS.map((item) => (
              <MenuItem
                key={item.label}
                label={item.label}
                selected={activeTab?.type === item.descriptor.type}
                onClick={() => navigateTo(item.descriptor)}
              />
            ))}

            {readerTabs.length > 0 && (
              <button
                ref={readerRowRef}
                type="button"
                onMouseEnter={handleReaderHover}
                className="flex items-center justify-between w-full min-h-6.5 px-2 py-2 gap-1.5 rounded-md text-left transition-colors hover:bg-surface-2 cursor-pointer"
              >
                <span className="text-sm text-text-primary leading-none">Reader</span>
                <motion.span
                  animate={{ rotate: 0 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                >
                  <Icon icon={ChevronRight} size={14} color="muted" />
                </motion.span>
              </button>
            )}
          </div>

          {/* Reader submenu */}
          {submenuOpen && (
            <div
              onMouseEnter={() => setSubmenuOpen(true)}
              onMouseLeave={() => setSubmenuOpen(false)}
              className="fixed z-999 flex flex-col p-1 gap-0.5 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl w-52"
              style={{ top: submenuPos.top, left: submenuPos.left }}
            >
              {readerTabs.map((tab) => (
                <MenuItem
                  key={tab.id}
                  label={tab.label}
                  selected={tab.id === activeTabId}
                  onClick={() => navigate(tab.id)}
                />
              ))}
            </div>
          )}
        </>,
        document.body,
      )}
    </>
  );
}
