import type { ReactNode } from "react";

interface TopBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export function TopBar({ left, center, right }: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 pl-6 pr-8 py-2 bg-surface-1">
      <div className="flex items-center gap-2 shrink-0">
        {left}
      </div>
      {center && (
        <div className="flex items-center gap-2 flex-1 justify-center">
          {center}
        </div>
      )}
      <div className="flex items-center gap-2 shrink-0">
        {right}
      </div>
    </div>
  );
}
