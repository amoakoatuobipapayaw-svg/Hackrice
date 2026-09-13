// Mounted once in the app shell (see App.tsx). Listens for celebrateLevelUp()
// calls from completeRound() and shows a brief celebratory toast + fanfare —
// leveling up is otherwise invisible (the XP bar just quietly refills).
import { useEffect, useRef, useState } from "react";
import { playLevelUpFanfare } from "../lib/sfx";
import { Icon } from "../components/ui/Icon";
import { onLevelUp } from "./levelUpBus";

const VISIBLE_MS = 3200;

export function LevelUpToast() {
  const [level, setLevel] = useState<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return onLevelUp((newLevel) => {
      playLevelUpFanfare();
      setLevel(newLevel);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setLevel(null), VISIBLE_MS);
    });
  }, []);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  if (level === null) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={level}
        className="animate-celebrate flex items-center gap-3 rounded-2xl border-2 border-b-4 border-accent-ink/30 bg-accent px-6 py-4 text-accent-ink shadow-lg"
      >
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/40">
          <Icon name="trophy" size={22} />
        </span>
        <div>
          <p className="text-xs font-extrabold tracking-widest uppercase">Level up</p>
          <p className="text-lg font-black">You reached level {level}!</p>
        </div>
      </div>
    </div>
  );
}
