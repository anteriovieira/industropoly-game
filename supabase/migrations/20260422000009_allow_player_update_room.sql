-- The previous `rooms_update_active_player` policy only allowed the row to be
-- updated by whoever was ALREADY the current_player_user_id. That creates a
-- catch-22 for turn handover: the next player needs to become current, but
-- cannot until they are already current. Replace with a policy that lets any
-- player member of the room update the row (host still has its own policy).
-- Scope is narrow — rooms only carry game-level metadata, and anything that
-- mutates game state still flows through append_action's SECURITY DEFINER
-- checks.
drop policy if exists "rooms_update_active_player" on public.rooms;

create policy "rooms_update_player_member"
  on public.rooms for update to authenticated
  using (exists (
    select 1 from public.room_members
    where room_id = rooms.id and user_id = auth.uid() and role = 'player'
  ))
  with check (exists (
    select 1 from public.room_members
    where room_id = rooms.id and user_id = auth.uid() and role = 'player'
  ));
