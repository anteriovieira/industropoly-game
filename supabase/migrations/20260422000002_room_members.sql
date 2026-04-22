create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('player','spectator')),
  seat_index int check (seat_index between 0 and 3),
  nickname text not null,
  color text,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create unique index room_members_seat_uniq
  on public.room_members(room_id, seat_index)
  where role = 'player';

create index room_members_user_idx on public.room_members (user_id);

alter table public.room_members enable row level security;
