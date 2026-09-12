import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

const STORAGE_KEY = "signly:high-contrast";

/** Saved choice wins; otherwise respect the OS "increase contrast" setting. */
function readInitial(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "1") return true;
    if (saved === "0") return false;
  } catch {
    // localStorage unavailable (private mode etc.) — fall through to OS hint
  }
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-contrast: more)").matches
  );
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
      title="Toggle high-contrast colors"
      onClick={() => setEnabled((v) => !v)}
      className="flex items-center justify-start gap-2 px-2.5 py-2 text-xs tracking-normal whitespace-nowrap"
    >
      <Icon name="contrast" size={16} />
      <span className="sr-only sm:not-sr-only">{enabled ? "High contrast: on" : "High contrast: off"}</span>
    </Button>
  );
}
