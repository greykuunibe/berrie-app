import type { ReactNode } from "react";

export function ButtonGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 bg-surface-2 border border-border-gray-1 rounded-full px-1.5 py-1.5">
      {children}
    </div>
  );
}
