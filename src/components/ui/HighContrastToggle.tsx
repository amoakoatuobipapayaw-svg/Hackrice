import { useEffect, useState } from "react";
import { Button } from "./Button";

const STORAGE_KEY = "signquest:high-contrast";

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Shared dumb-ish toggle: flips a data attribute on <html> that globals.css
 * keys high-contrast overrides off of, persisted per-browser. */
export function HighContrastToggle() {
  const [enabled, setEnabled] = useState(readInitial);

  useEffect(() => {
    if (enabled) {
      document.documentElement.setAttribute("data-contrast", "high");
    } else {
      document.documentElement.removeAttribute("data-contrast");
    }
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // localStorage unavailable (private mode etc.) — contrast just won't persist
    }
  }, [enabled]);

  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={enabled}
      onClick={() => setEnabled((v) => !v)}
      className="px-3 py-2 text-xs"
    >
      {enabled ? "High contrast: on" : "High contrast: off"}
    </Button>
  );
}
