import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@components/primitives";
import { Icon } from "@components/primitives/Icons";
import { OpenPanel, Search } from "@Icons";
import { useSidePanelStore } from "@/stores/sidePanel.store";

interface GlobalSidePanelProps {
  children: ReactNode;
  /** Buttons rendered in the center of the panel header */
  actions?: ReactNode;
}

export function GlobalSidePanel({ children, actions }: GlobalSidePanelProps) {
  const { content, close } = useSidePanelStore();

  return (
    <AnimatePresence initial={false}>
      {content !== null && (
        <motion.div
          key="global-side-panel"
          className="shrink-0 h-full flex flex-col overflow-hidden rounded-2xl border border-border-gray-1 bg-surface-1"
          initial={{ width: 0 }}
          animate={{ width: "40%" }}
          exit={{ width: 0 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
        >
          {/* Panel header */}
          <div className="flex items-center gap-2 px-3 py-2 shrink-0">
            <Button variant="ghost" size="sm" icon={OpenPanel} iconButton onClick={close} />
            {actions && (
              <div className="flex-1 flex items-center justify-center gap-1">
                {actions}
              </div>
            )}
            {!actions && <div className="flex-1" />}
            <Button variant="secondary" size="sm" icon={Search} iconButton />
          </div>

          {/* Panel content */}
          <div className="flex-1 pt-16 min-h-0 overflow-hidden">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
