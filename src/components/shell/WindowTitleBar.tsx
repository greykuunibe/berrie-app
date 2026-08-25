import { useState, type ReactNode } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MinusIcon, Square2StackIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, ToggleGroup, type ToggleGroupProps } from "@components/primitives";
import { Icon } from "@components/primitives/Icons";
import { Profile, ChevronDown, ChevronUp, ChevronLeft, Download, Mail, Bible, SignOut } from "@Icons";
import { useUserInitial } from "@/hooks/useCurrentUser";
import { Menu, MenuItem } from "@components/primitives/Menu";

// ── Account menu (shown when profile pill chevron is clicked) ─────────────────

function AccountMenu({ onClose }: { onClose: () => void }) {
  const handleSignOut = async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    onClose();
    window.location.hash = "/auth";
  };

  return (
    <Menu>
      <MenuItem icon={Profile} label="Profile"  onClick={onClose} />
      <MenuItem icon={Download} label="Downloads"  onClick={onClose} />
      <MenuItem icon={Mail}    label="support"  onClick={onClose} />
      <MenuItem icon={Bible}    label="Bible"     onClick={onClose} />
      <MenuItem icon={SignOut} label="Sign out" onClick={handleSignOut} danger />
    </Menu>
  );
}

// ── Profile pill — iconButton for avatar, wrapped in a trigger with chevron ───

function ProfilePill() {
  const [open, setOpen] = useState(false);
  const initial = useUserInitial();

  return (
    <div className="relative">
      {/* Transparent backdrop — catches outside clicks without useEffect */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Pill — entire pill is the trigger */}
      <Button
        variant="primary"
        size="sm"
        className="min-w-0! px-1! gap-1 pr-2"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center shrink-0 text-sm font-medium text-text-muted">
          {initial}
        </span>
        <Icon icon={open ? ChevronUp : ChevronDown} size={14} color="muted" />
      </Button>

      {/* Dropdown — z-50 sits above the backdrop */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+2px)] z-50">
          <AccountMenu onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

// ── WindowTitleBar ────────────────────────────────────────────────────────────

export interface WindowTitleBarProps {
  title?: string;
  toggle?: ToggleGroupProps;
  rightActions?: ReactNode;
  /** Content rendered absolutely centered in the titlebar. */
  centerActions?: ReactNode;
}

export function WindowTitleBar({ title = "Berrie", toggle, rightActions, centerActions }: WindowTitleBarProps) {
  const minimize = () => getCurrentWindow().minimize();
  const toggleMaximize = () => getCurrentWindow().toggleMaximize();
  const close = () => getCurrentWindow().close();
  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) getCurrentWindow().startDragging();
  };

  const leftSection = (
    <div className="flex items-center gap-4">
      <h1 className="text-xl font-medium text-text-primary leading-none">{title}</h1>
      {toggle && (
        <div onMouseDown={(e) => e.stopPropagation()}>
          <ToggleGroup {...toggle} />
        </div>
      )}
    </div>
  );

  const rightSection = (
    <div className="flex items-center gap-2">
      {rightActions}
      <ProfilePill />
    </div>
  );

  if (isTauri()) {
    return (
      <header className="window-titlebar relative">
        {/* Left */}
        <div className="flex items-center gap-4">
          <h1
            className="text-xl font-medium text-text-primary leading-none cursor-default"
            onMouseDown={startDragging}
          >
            {title}
          </h1>
          {toggle && (
            <div onMouseDown={(e) => e.stopPropagation()}>
              <ToggleGroup {...toggle} />
            </div>
          )}
        </div>

        {/* Center flex-1 — draggable dead zone */}
        <div className="flex-1 h-full" onMouseDown={startDragging} />

        {/* Center actions — absolutely centered in the titlebar */}
        {centerActions && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
            {centerActions}
          </div>
        )}

        <div className="flex items-center gap-2 h-full">
          {rightActions}
          <ProfilePill />

          {/* Native Tauri window controls — self-stretch fills the full 60px titlebar */}
          <div className="window-titlebar__controls ml-2 self-stretch">
            <button className="control-button" type="button" onClick={minimize} aria-label="Minimize">
              <MinusIcon className="w-4 h-4" />
            </button>
            <button className="control-button" type="button" onClick={toggleMaximize} aria-label="Maximize">
              <Square2StackIcon className="w-4 h-4" />
            </button>
            <button className="control-button-close" type="button" onClick={close} aria-label="Close">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Browser / dev mode
  return (
    <header className="window-titlebar relative">
      {leftSection}
      <div className="flex-1" />
      {centerActions && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          {centerActions}
        </div>
      )}
      {rightSection}
    </header>
  );
}
