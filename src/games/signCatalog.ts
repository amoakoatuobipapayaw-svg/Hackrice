// MVP sign catalog Lesson/Speed Challenge draw prompts from. Kept aligned
// with recognition/mock.ts's fixed cycle for now so the mocked demo always
// produces a match — expand once A's real classifier covers the full
// A-Z/0-9 set from CLAUDE.md's recognition scope.
export const SIGN_CATALOG = ["A", "B", "THANK YOU", "1", "5"] as const;

export function pickSigns(count: number): string[] {
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(SIGN_CATALOG[i % SIGN_CATALOG.length]);
  }
  return picks;
}
