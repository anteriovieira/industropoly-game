create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_user_id uuid not null references auth.users(id),
  status text not null default 'lobby'
    check (status in ('lobby','in_game','finished','abandoned')),
  rng_seed bigint,
  current_player_user_id uuid,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  finished_at timestamptz
);

create index rooms_code_idx on public.rooms (code);
create index rooms_last_activity_idx on public.rooms (last_activity_at);

alter table public.rooms enable row level security;
