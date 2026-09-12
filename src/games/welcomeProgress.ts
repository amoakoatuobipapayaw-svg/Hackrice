// Tracks whether the learner has been through the Welcome to ASL content
// unit. Local-only and separate from UserProfile/contracts.ts on purpose —
// this is a "seen it" flag for one static lesson, not XP/streak state.
const KEY = "signly:welcome-seen";

export function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // Private browsing or a full/blocked store — the lesson still works, it just won't remember.
  }
}
