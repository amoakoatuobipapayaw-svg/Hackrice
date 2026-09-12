// supabase.ts — Postgres client + typed query helpers for profiles, scores,
// and streaks. Owned by Workstream D.
//
// Schema lives in supabase/schema.sql (source of truth — run it in the
// Supabase SQL editor, or `psql "$POSTGRES_URL_NON_POOLING" -f supabase/schema.sql`).
//
// Until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set (in .env.local),
// isSupabaseConfigured is false and every helper below returns local mock
// data instead of throwing, so `npm run dev` keeps working without secrets.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ScoreEntry, UserProfile } from "./contracts";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — using mock data.",
  );
}

const MOCK_LEADERBOARD: ScoreEntry[] = [
  { userId: "mock-1", name: "Ava", xp: 480, verified: true, updatedAt: new Date().toISOString() },
  { userId: "mock-2", name: "Nerez", xp: 320, verified: true, updatedAt: new Date().toISOString() },
  { userId: "mock-3", name: "Guest", xp: 90, verified: false, updatedAt: new Date().toISOString() },
];

export async function getLeaderboard(limit = 20): Promise<ScoreEntry[]> {
  if (!supabase) return MOCK_LEADERBOARD.slice(0, limit);

  const { data, error } = await supabase
    .from("scores")
    .select("user_id, name, xp, verified, updated_at")
    .order("xp", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    userId: row.user_id,
    name: row.name,
    xp: row.xp,
    verified: row.verified,
    updatedAt: row.updated_at,
  }));
}

export async function postScore(entry: ScoreEntry): Promise<void> {
  if (!supabase) {
    console.log("[supabase mock] postScore", entry);
    return;
  }

  const { error } = await supabase.from("scores").upsert({
    user_id: entry.userId,
    name: entry.name,
    xp: entry.xp,
    verified: entry.verified,
    updated_at: entry.updatedAt,
  });
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, streak, xp, level, verified")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Call once per day when a user completes any activity. Increments the
 * streak if they were also active yesterday, resets to 1 if they missed a
 * day, and is a no-op if already bumped today. Returns the new streak count.
 */
export async function bumpStreak(userId: string): Promise<number> {
  if (!supabase) {
    console.log("[supabase mock] bumpStreak", userId);
    return 1;
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: row, error: readError } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak, last_active")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const current = row?.current_streak ?? 0;

  let next: number;
  if (row?.last_active === today) next = current; // already bumped today
  else if (row?.last_active === yesterday) next = current + 1;
  else next = 1;

  const longest = Math.max(next, row?.longest_streak ?? 0);

  const { error: writeError } = await supabase.from("streaks").upsert({
    user_id: userId,
    current_streak: next,
    longest_streak: longest,
    last_active: today,
  });
  if (writeError) throw writeError;

  await supabase.from("profiles").update({ streak: next }).eq("id", userId);
  return next;
}
