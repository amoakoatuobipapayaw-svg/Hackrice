-- Signly schema. Source of truth for profiles/scores/streaks.
-- Re-run safely: every statement is idempotent (create-if-not-exists / drop-then-create for policies).
--
-- Hackathon-scale tradeoff: there's no Supabase Auth wired up, so RLS can't
-- scope rows to "the caller's own record" via auth.uid(). Policies below are
-- deliberately permissive (any anon-key holder can read/write any row) —
-- good enough for a demo leaderboard, not for production. Persona verification
-- is enforced client-side only (see src/meta/PersonaGate.tsx).

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  streak int not null default 0,
  xp int not null default 0,
  level int not null default 1,
  verified boolean not null default false,
  last_active date,
  created_at timestamptz not null default now()
);

create table if not exists scores (
  user_id uuid primary key references profiles(id) on delete cascade,
  name text not null,
  xp int not null default 0,
  verified boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists streaks (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active date
);

alter table profiles enable row level security;
alter table scores enable row level security;
alter table streaks enable row level security;

drop policy if exists "public read profiles" on profiles;
create policy "public read profiles" on profiles for select to anon using (true);
drop policy if exists "public write profiles" on profiles;
create policy "public write profiles" on profiles for all to anon using (true) with check (true);

drop policy if exists "public read scores" on scores;
create policy "public read scores" on scores for select to anon using (true);
drop policy if exists "public write scores" on scores;
create policy "public write scores" on scores for all to anon using (true) with check (true);

drop policy if exists "public read streaks" on streaks;
create policy "public read streaks" on streaks for select to anon using (true);
drop policy if exists "public write streaks" on streaks;
create policy "public write streaks" on streaks for all to anon using (true) with check (true);

-- Realtime: src/meta/Leaderboard.tsx subscribes to postgres_changes on `scores`.
alter publication supabase_realtime add table scores;
