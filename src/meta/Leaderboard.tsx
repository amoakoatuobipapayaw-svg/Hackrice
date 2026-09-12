import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import type { ScoreEntry } from "../lib/contracts";
import { getLeaderboard, supabase } from "../lib/supabase";

export function Leaderboard() {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Leaderboard</h1>
      <Card className="divide-y divide-slate-800 p-0">
        {loading && <p className="p-6 text-center text-slate-400">Loading…</p>}
        {!loading && entries.length === 0 && (
          <p className="p-6 text-center text-slate-400">No scores yet — be the first!</p>
        )}
        {entries.map((entry, i) => (
          <div key={entry.userId} className="flex items-center gap-4 p-4">
            <span className="w-6 text-center font-mono text-slate-500">{i + 1}</span>
            <span className="flex-1 truncate font-medium">
              {entry.name}
              {entry.verified && (
                <span title="Verified human" className="ml-1 text-violet-400">
                  ✓
                </span>
              )}
            </span>
            <span className="font-mono text-sm text-slate-300">{entry.xp} XP</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
