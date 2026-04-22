-- Fix: the previous members_select_same_room policy did a subquery on
-- room_members itself, triggering its own SELECT policy in a loop.
-- room_members rows are not sensitive (nicknames, seat indices, user ids of
-- room members). Mirror the permissive SELECT already used on `rooms`.
drop policy if exists "members_select_same_room" on public.room_members;

create policy "members_select_authenticated"
  on public.room_members for select to authenticated
  using (true);
