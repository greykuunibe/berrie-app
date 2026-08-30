import { useState } from "react";
import { Button } from "@components/primitives";
import { Icon } from "@components/primitives/Icons";
import { Profile, ChevronDown, ChevronUp, Download, Mail, Bible, SignOut } from "@Icons";
import { useUserInitial } from "@/hooks/useCurrentUser";
import { Menu } from "@components/primitives/Menu";
import { MenuItem } from "@components/primitives/MenuItem";

function AccountMenu({ onClose }: { onClose: () => void }) {
  const handleSignOut = async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    onClose();
    window.location.hash = "/auth";
  };

  return (
    <Menu>
      <MenuItem icon={Profile}  label="Profile"   onClick={onClose} />
      <MenuItem icon={Download} label="Downloads" onClick={onClose} />
      <MenuItem icon={Mail}     label="Support"   onClick={onClose} />
      <MenuItem icon={Bible}    label="Bible"     onClick={onClose} />
      <MenuItem icon={SignOut}  label="Sign out"  onClick={handleSignOut} danger />
    </Menu>
  );
}

export function ProfilePill() {
  const [open, setOpen] = useState(false);
  const initial = useUserInitial();

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
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
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50">
          <AccountMenu onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
