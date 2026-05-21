-- ═══════════════════════════════════════════════════════════
--  GDER — Supabase Database Schema
--  Run this entire file in: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════
-- After running:
--  1. Go to Storage → New bucket → Name: "covers" → Public: ON
--  2. Go to Authentication → Settings → Enable email confirmations: OFF (for dev)
--  3. Go to Authentication → URL Configuration → add your domain
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  username     text not null unique,
  email        text not null unique,
  role         text not null default 'player' check (role in ('player','creator','moderator','admin')),
  plan         text not null default 'free'   check (plan in ('free','pro','studio')),
  plan_expiry  timestamptz,
  bio          text default '',
  created_at   timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, email, role, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'player'),
    'free'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── GAMES ────────────────────────────────────────────────────
create table if not exists games (
  id              uuid default uuid_generate_v4() primary key,
  creator_id      uuid references profiles(id) on delete cascade not null,
  title           text not null,
  description     text default '',
  genre           text not null,
  mode            text default '',
  platform        text not null,
  price           text default 'Free',
  status          text default 'Released',
  style           text default '',
  release_date    date,
  url             text default '',
  cover_image     text default '',   -- Supabase Storage URL
  cover_caption   text default '',
  approval_status text default 'pending' check (approval_status in ('pending','approved','rejected')),
  rejection_reason text default '',
  featured        boolean default false,
  featured_slot   smallint,
  boost_score     numeric default 1.0,
  creator_plan    text default 'free',
  rating          numeric default 0,
  rating_count    integer default 0,
  plays           integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Increment plays safely
create or replace function increment_plays(game_id uuid)
returns void language sql as $$
  update games set plays = plays + 1 where id = game_id;
$$;

-- Rate a game (rolling average)
create or replace function rate_game(game_id uuid, stars numeric)
returns void language plpgsql as $$
declare
  g games%rowtype;
  new_rating numeric;
begin
  select * into g from games where id = game_id;
  if g.rating_count = 0 then
    new_rating := stars;
  else
    new_rating := ((g.rating * g.rating_count) + stars) / (g.rating_count + 1);
  end if;
  update games
    set rating = round(new_rating::numeric, 1),
        rating_count = rating_count + 1
  where id = game_id;
end;
$$;

-- ── FAVORITES ────────────────────────────────────────────────
create table if not exists favorites (
  id      uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  game_id uuid references games(id)    on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, game_id)
);

-- ── PLAYED ───────────────────────────────────────────────────
create table if not exists played (
  id        uuid default uuid_generate_v4() primary key,
  user_id   uuid references profiles(id) on delete cascade not null,
  game_id   uuid references games(id)    on delete cascade not null,
  played_at timestamptz default now(),
  unique(user_id, game_id)
);

-- ── GROUPS ───────────────────────────────────────────────────
create table if not exists groups (
  id             uuid default uuid_generate_v4() primary key,
  creator_id     uuid references profiles(id) on delete cascade not null,
  name           text not null,
  game           text default '',
  platform       text default '',
  players_needed integer default 4,
  description    text default '',
  visibility     text default 'public' check (visibility in ('public','private')),
  accent         text default '#FF4D6D',
  bg             text[] default array['#0d0d1a','#1a1a2e'],
  shape          text default 'rings',
  created_at     timestamptz default now()
);

-- ── GROUP MEMBERS ────────────────────────────────────────────
create table if not exists group_members (
  id         uuid default uuid_generate_v4() primary key,
  group_id   uuid references groups(id)   on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  joined_at  timestamptz default now(),
  unique(user_id, group_id)
);

-- ── MESSAGES ─────────────────────────────────────────────────
create table if not exists messages (
  id         uuid default uuid_generate_v4() primary key,
  group_id   uuid references groups(id)   on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  text       text not null,
  created_at timestamptz default now()
);

-- ── COMMENTS ─────────────────────────────────────────────────
create table if not exists comments (
  id         uuid default uuid_generate_v4() primary key,
  game_id    uuid references games(id)    on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  text       text not null,
  created_at timestamptz default now()
);

-- ── REPORTS ──────────────────────────────────────────────────
create table if not exists reports (
  id             uuid default uuid_generate_v4() primary key,
  type           text default 'game' check (type in ('game','comment')),
  game_id        uuid references games(id) on delete cascade,
  game_title     text default '',
  comment_id     uuid references comments(id) on delete set null,
  comment_text   text default '',
  comment_author text default '',
  reason         text not null,
  note           text default '',
  reported_by    text not null,
  user_id        uuid references profiles(id) on delete cascade,
  status         text default 'pending' check (status in ('pending','dismissed','actioned')),
  created_at     timestamptz default now()
);

-- ── LOOKUPS (Find Players / LFG) ──────────────────────────────
create table if not exists lookups (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade not null unique,
  game       text default '',
  platform   text default '',
  players    integer default 2,
  description text default '',
  created_at timestamptz default now()
);

-- ── PREFERENCES ───────────────────────────────────────────────
create table if not exists preferences (
  user_id    uuid references profiles(id) on delete cascade primary key,
  notifs     boolean default true,
  sound      boolean default true,
  privacy    boolean default false,
  sidebar_mini boolean default false,
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

alter table profiles      enable row level security;
alter table games         enable row level security;
alter table favorites     enable row level security;
alter table played        enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table messages      enable row level security;
alter table comments      enable row level security;
alter table reports       enable row level security;
alter table lookups       enable row level security;
alter table preferences   enable row level security;

-- Profiles: public read, self write
create policy "Public profiles readable" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- Games: approved games public, creator edits own
create policy "Approved games readable"   on games for select using (approval_status = 'approved' or creator_id = auth.uid());
-- Admin OR moderator can read all games
create policy "Admin reads all games"     on games for select using (exists(select 1 from profiles where id = auth.uid() and role in ('admin','moderator')));
create policy "Creators insert games"     on games for insert with check (creator_id = auth.uid());
create policy "Creators update own games" on games for update using (creator_id = auth.uid());
create policy "Creators delete own games" on games for delete using (creator_id = auth.uid());
create policy "Admin full game access"    on games for all using (exists(select 1 from profiles where id = auth.uid() and role in ('admin','moderator')));

-- Favorites: user manages own
create policy "User reads own favorites"   on favorites for select using (user_id = auth.uid());
create policy "User inserts favorites"     on favorites for insert with check (user_id = auth.uid());
create policy "User deletes favorites"     on favorites for delete using (user_id = auth.uid());

-- Played: user manages own
create policy "User reads own played"  on played for select using (user_id = auth.uid());
create policy "User inserts played"    on played for insert with check (user_id = auth.uid());
create policy "User upserts played"    on played for update using (user_id = auth.uid());

-- Groups: public read, creator manages
create policy "Groups public readable"   on groups for select using (visibility = 'public' or creator_id = auth.uid());
create policy "Users create groups"      on groups for insert with check (creator_id = auth.uid());
create policy "Creator deletes group"    on groups for delete using (creator_id = auth.uid());

-- Group members: authenticated read, self write
create policy "Members readable"         on group_members for select using (auth.uid() is not null);
create policy "Users join groups"        on group_members for insert with check (user_id = auth.uid());
create policy "Users leave groups"       on group_members for delete using (user_id = auth.uid());

-- Messages: group members read/write
create policy "Messages readable"        on messages for select using (auth.uid() is not null);
create policy "Users send messages"      on messages for insert with check (user_id = auth.uid());

-- Comments: public read, self delete, admin+moderator delete any
create policy "Comments public readable" on comments for select using (true);
create policy "Users post comments"      on comments for insert with check (user_id = auth.uid());
create policy "Users delete own comment" on comments for delete using (user_id = auth.uid());
create policy "Admin deletes comments"   on comments for delete using (exists(select 1 from profiles where id = auth.uid() and role in ('admin','moderator')));

-- Reports: user submits, admin+moderator reads & manages
create policy "Users create reports"     on reports for insert with check (user_id = auth.uid());
create policy "Admin reads reports"      on reports for select using (exists(select 1 from profiles where id = auth.uid() and role in ('admin','moderator')));
create policy "Admin updates reports"    on reports for update using (exists(select 1 from profiles where id = auth.uid() and role in ('admin','moderator')));

-- Profiles: only admin can update roles
create policy "Admin updates roles"      on profiles for update using (exists(select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Lookups: public read, self write
create policy "Lookups public readable"  on lookups for select using (true);
create policy "Users upsert lookup"      on lookups for insert with check (user_id = auth.uid());
create policy "Users update lookup"      on lookups for update using (user_id = auth.uid());

-- Preferences: user manages own
create policy "User reads own prefs"     on preferences for select using (user_id = auth.uid());
create policy "User upserts prefs"       on preferences for insert with check (user_id = auth.uid());
create policy "User updates prefs"       on preferences for update using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
--  REALTIME
-- ═══════════════════════════════════════════════════════════
-- Enable realtime for messages (live chat)
alter publication supabase_realtime add table messages;

-- ═══════════════════════════════════════════════════════════
--  INDEXES (performance)
-- ═══════════════════════════════════════════════════════════
create index if not exists idx_games_status    on games(approval_status);
create index if not exists idx_games_creator   on games(creator_id);
create index if not exists idx_games_featured  on games(featured, featured_slot);
create index if not exists idx_favorites_user  on favorites(user_id);
create index if not exists idx_played_user     on played(user_id);
create index if not exists idx_messages_group  on messages(group_id, created_at);
create index if not exists idx_comments_game   on comments(game_id, created_at);
create index if not exists idx_reports_status  on reports(status);
create index if not exists idx_members_group   on group_members(group_id);

-- ═══════════════════════════════════════════════════════════
--  SEED: Admin Account Setup
-- ═══════════════════════════════════════════════════════════
-- Step 1: Go to Supabase → Authentication → Users → Add User
--   Email:    nvidia26@outlook.fr
--   Password: Drgonn55g55Ranaroge
--   Auto-confirm email: ON
--
-- Step 2: Run this SQL AFTER creating the user above:
-- (replace the email if needed)

-- UPDATE profiles
--   SET role = 'admin'
-- WHERE email = 'nvidia26@outlook.fr';

-- ─── OR use this one-liner that works immediately after insert ───
-- This function creates the admin and sets the role atomically:

create or replace function seed_admin()
returns void language plpgsql security definer as $$
begin
  -- Set admin role for nvidia26@outlook.fr if the profile exists
  update profiles
    set role = 'admin'
  where email = 'nvidia26@outlook.fr';
end;
$$;

-- Call after creating the user in Supabase Auth dashboard:
-- select seed_admin();
