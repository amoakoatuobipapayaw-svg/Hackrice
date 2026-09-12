import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import type { ScoreEntry } from "../lib/contracts";
import { getLocalProfile } from "../lib/localProfile";
import { getLeaderboard, supabase } from "../lib/supabase";

const RANK_STYLES = [
  "bg-[#f6c343] text-[#5b3f00]",
  "bg-[#c9d1dc] text-[#2f3742]",
  "bg-[#d9a066] text-[#4a2a0c]",
];

export function Leaderboard() {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const me = getLocalProfile();

  useEffect(() => {
    let cancelled = false;

    getLeaderboard().then((rows) => {
      if (!cancelled) {
        setEntries(rows);
        setLoading(false);
      }
    });

    // Live updates: re-fetch whenever any row in `scores` changes. Simpler
    // and safer for a hackathon timeline than reconciling row-level payloads.
    const channel = supabase
      ?.channel("scores-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, () => {
        getLeaderboard().then((rows) => !cancelled && setEntries(rows));
      })
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase?.removeChannel(channel);
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="mb-6 flex items-center gap-4">
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon name="trophy" size={26} /></span>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted">Total XP across every practice mode. Verified accounts only.</p>
        </div>
      </div>
      <Card className="divide-y-2 divide-line p-0">
        {loading && <p className="p-6 text-center text-sm font-bold text-muted">Loading…</p>}
        {!loading && entries.length === 0 && (
          <p className="p-6 text-center text-sm font-bold text-muted">No scores yet — be the first!</p>
        )}
        {entries.map((entry, i) => {
          const isMe = me?.id === entry.userId;
          return (
            <div key={entry.userId} className={`flex items-center gap-4 p-4 ${isMe ? "bg-selected" : ""}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${RANK_STYLES[i] ?? "bg-soft text-muted"}`} aria-label={`Rank ${i + 1}`}>{i + 1}</span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5 font-extrabold">
                <span className="truncate">{entry.name}</span>
                {entry.verified && <Icon name="badgeCheck" size={18} className="text-brand" label="Verified human" />}
                {isMe && <span className="ml-1 rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-brand uppercase">You</span>}
              </span>
              <span className="text-sm font-extrabold tabular-nums text-muted">{entry.xp} XP</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
