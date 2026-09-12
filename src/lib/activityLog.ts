// Per-day activity record that powers the streak calendar on Home. Kept
// separate from profile/streak logic on purpose: this only answers "which
// calendar days did this browser open the app?", so it never has to agree
// with the server-side streak count in supabase.ts. Local-time day keys so a
// late-night session counts toward the day the user actually experienced.

const STORAGE_KEY = "signly:activity-days";
const MAX_DAYS = 400;

/** "YYYY-MM-DD" in the user's local timezone. */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getActivityDays(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

/** Marks today as active. Idempotent; safe to call on every app load. */
export function recordActivity(now: Date = new Date()): Set<string> {
  const days = getActivityDays();
  days.add(toDayKey(now));
  try {
    const trimmed = [...days].sort().slice(-MAX_DAYS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable (private mode etc.) — calendar just won't persist
  }
  return days;
}
