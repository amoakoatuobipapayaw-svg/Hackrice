// Minimal pub-sub so completeRound() (in games/gameLogic.ts, called from
// three separate game screens) can announce a level-up without any of them
// needing to import or render UI — LevelUpToast is the one subscriber,
// mounted once in the app shell.
type Listener = (level: number) => void;
const listeners = new Set<Listener>();

export function celebrateLevelUp(level: number): void {
  listeners.forEach((fn) => fn(level));
}

export function onLevelUp(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
