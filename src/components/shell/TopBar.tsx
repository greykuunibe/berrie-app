import type { ReactNode } from "react";

interface TopBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export function TopBar({ left, center, right }: TopBarProps) {
  return (
    <div className="relative flex items-center justify-between gap-4 px-2 py-2 bg-surface-1">
      <div className="flex items-center gap-2 shrink-0">
        {left}
      </div>
      {center && (
        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            {center}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {right}
      </div>
    </div>
  );
}
