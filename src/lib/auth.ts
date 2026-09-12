// auth.ts — Google sign-in via Supabase Auth. This is the portable,
// cross-device identity; Persona (meta/PersonaGate.tsx) is a separate,
// independent capability check layered on top of it, not a replacement
// for it. Guests never touch this file at all.
import { supabase } from "./supabase";

export type AuthedUser = {
  id: string;
  name: string;
  email: string;
};

function toAuthedUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthedUser {
  const metadata = user.user_metadata ?? {};
  const name =
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined) ??
    user.email ??
    "Signed-in user";
  return { id: user.id, name, email: user.email ?? "" };
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    console.warn("[auth] Supabase not configured — cannot sign in with Google.");
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Resolves the current Google-authenticated user, or null for a guest. */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ? toAuthedUser(session.user) : null;
}

/** Fires immediately with the current state, then on every sign-in/out. */
export function onAuthChange(callback: (user: AuthedUser | null) => void): () => void {
  if (!supabase) return () => {};
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toAuthedUser(session.user) : null);
  });
  return () => subscription.unsubscribe();
}
