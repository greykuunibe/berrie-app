import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Module-level cache — shared across all consumers, survives re-renders
let _user: User | null = null;
let _displayName: string | null = null;
const _listeners = new Set<() => void>();

// Stable snapshot object — only replaced when data actually changes.
// useSyncExternalStore uses referential equality, so returning a new {}
// on every call would cause an infinite re-render loop.
let _snapshot: { user: User | null; displayName: string | null } = { user: _user, displayName: _displayName };

function notify() {
  _snapshot = { user: _user, displayName: _displayName };
  _listeners.forEach((fn) => fn());
}

// Bootstrap session on module load (runs once)
supabase.auth.getSession().then(({ data }) => {
  _user = data.session?.user ?? null;
  if (_user) loadDisplayName(_user.id);
  else notify();
});

// Stay in sync with auth state changes
supabase.auth.onAuthStateChange((_, session) => {
  _user = session?.user ?? null;
  if (_user) loadDisplayName(_user.id);
  else {
    _displayName = null;
    notify();
  }
});

async function loadDisplayName(userId: string) {
  const { data } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  _displayName = data?.full_name ?? null;
  notify();
}

function subscribe(callback: () => void) {
  _listeners.add(callback);
  return () => { _listeners.delete(callback); };
}

function getSnapshot() {
  return _snapshot;
}

const serverSnapshot = { user: null, displayName: null };

export function useCurrentUser() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

/** First letter of first name, falls back to email initial, then "?" */
export function useUserInitial(): string {
  const { displayName, user } = useCurrentUser();
  if (displayName) return displayName.charAt(0).toUpperCase();
  if (user?.email) return user.email.charAt(0).toUpperCase();
  return "?";
}
