// A permanent, always-visible nav affordance for guests — Home.tsx's own
// "Sign in with Google" link only shows up if you scroll to the right card,
// which is easy to miss. This renders nothing once a session exists.
import { useEffect, useState } from "react";
import { onAuthChange, signInWithGoogle } from "../lib/auth";

export function GoogleSignInButton({ compact = false }: { compact?: boolean }) {
  const [signedIn, setSignedIn] = useState(true); // assume signed-in until onAuthChange reports otherwise, so it never flashes for a real session
  useEffect(() => onAuthChange((user) => setSignedIn(Boolean(user))), []);

  if (signedIn) return null;

  return (
    <button
      type="button"
      onClick={() => signInWithGoogle()}
      aria-label="Sign in with Google"
      className={
        compact
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface shadow-sm hover:bg-soft"
          : "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-line bg-surface py-2.5 text-sm font-extrabold text-ink hover:bg-soft"
      }
    >
      <GoogleMark />
      {!compact && <span>Sign in</span>}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a13.9 13.9 0 0 1 0-9.18l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.92 7.54 2.56 10.78z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
