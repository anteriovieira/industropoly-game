create table public.game_actions (
  room_id uuid not null references public.rooms(id) on delete cascade,
  seq bigint not null,
  actor_user_id uuid not null references auth.users(id),
  action jsonb not null,
  created_at timestamptz not null default now(),
  primary key (room_id, seq)
);

create index game_actions_room_seq_idx on public.game_actions (room_id, seq);

alter table public.game_actions enable row level security;

alter publication supabase_realtime add table public.game_actions;
