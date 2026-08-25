import type { ReactNode } from "react";
import { Icon, Sync } from "@Icons";

interface ComponentShowcaseProps {
  /** Component name shown in the footer. */
  title: string;
  /** Anchor id for deep-linking. */
  id?: string;
  /** Interactive demo content. */
  children: ReactNode;
  /** When provided, a reset button is shown in the footer. */
  onReset?: () => void;
  /** Remove content padding so children fill the card edge-to-edge. */
  flush?: boolean;
}

export function ComponentShowcase({
  title,
  id,
  children,
  onReset,
  flush,
}: ComponentShowcaseProps) {
  return (
    <section
      id={id}
      className="flex items-center justify-center mx-auto w-full max-w-2xl p-1 rounded-2xl border border-border-gray-1 bg-surface-1"
    >
      {/* Content area */}
      <div className="scroll-mt-16 card-shadow mx-auto w-full overflow-hidden rounded-xl element-box-shadow border border-border-gray-1 bg-white">
        <div className={flush ? "" : "flex flex-col items-center space-y-6 p-6"}>{children}</div>
        {/* Footer bar */}
        <div className="flex items-center justify-between gap-2 border-t border-border-gray-1 bg-surface-1 px-4 py-4">
          <span className="text-md font-medium text-text-muted">{title}</span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              aria-label={`Reset ${title} demo`}
              title="Reset demo"
              className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 text-text-muted transition-colors hover:bg-surface-1 hover:text-text-primary"
            >
              <Icon icon={Sync} size={14} color="muted" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
