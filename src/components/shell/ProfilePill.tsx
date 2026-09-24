import { useState } from "react";
import { Button } from "@components/primitives";
import { Profile, Download, Mail, Bible, SignOut } from "@Icons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Menu } from "@components/primitives/Menu";
import { MenuItem } from "@components/primitives/MenuItem";

function ProfileMenu({ onClose }: { onClose: () => void }) {
  const { user } = useCurrentUser();

  const handleSignOut = async () => {
    const { supabase } = await import("@/lib/supabase");
    const { toast } = await import("@/lib/toast");
    await supabase.auth.signOut();
    toast.info("Signed out");
    onClose();
    window.location.hash = "/auth";
  };

  const handleSignIn = () => {
    onClose();
    window.location.hash = "/auth";
  };

  return (
    <Menu>
      {user && <MenuItem icon={Profile}  label="Profile"   onClick={onClose} />}
      <MenuItem icon={Download} label="Downloads" onClick={onClose} />
      <MenuItem icon={Mail}     label="Support"   onClick={onClose} />
      <MenuItem icon={Bible}    label="Bible"     onClick={onClose} />
      {user
        ? <MenuItem icon={SignOut} label="Sign out" onClick={handleSignOut} danger />
        : <MenuItem icon={Profile} label="Sign in"  onClick={handleSignIn} />
      }
    </Menu>
  );
}

export function ProfilePill() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <Button
        variant="ghost"
        size="sm"
        icon={Profile}
        iconButton
        onClick={() => setOpen((v) => !v)}
      />

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50">
          <ProfileMenu onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
