-- Запусти это в Supabase SQL Editor

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'lobby',
  host_id text not null,
  current_player_id text not null,
  round int not null default 1,
  time_limit int not null default 90,
  deck text not null default 'classic',
  started_at timestamptz,
  game_state jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists game_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  round int not null default 1,
  player_id text not null,
  player_name text not null,
  type text not null,
  description text not null,
  amount numeric,
  asset text,
  raw_data jsonb,
  created_at timestamptz default now()
);

-- Включаем Realtime для rooms
alter publication supabase_realtime add table rooms;

-- RLS (для MVP отключаем, потом включим)
alter table rooms disable row level security;
alter table game_events disable row level security;
