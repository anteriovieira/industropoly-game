create policy "rooms_select_member"
  on public.rooms for select to authenticated
  using (exists (
    select 1 from public.room_members
    where room_id = rooms.id and user_id = auth.uid()
  ));

create policy "rooms_select_by_code"
  on public.rooms for select to authenticated
  using (true);

create policy "rooms_update_host"
  on public.rooms for update to authenticated
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

create policy "rooms_update_active_player"
  on public.rooms for update to authenticated
  using (current_player_user_id = auth.uid())
  with check (current_player_user_id = auth.uid());

create policy "members_select_same_room"
  on public.room_members for select to authenticated
  using (exists (
    select 1 from public.room_members rm2
    where rm2.room_id = room_members.room_id and rm2.user_id = auth.uid()
  ) or user_id = auth.uid());

create policy "members_insert_self_lobby"
  on public.room_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rooms r
      where r.id = room_members.room_id and r.status = 'lobby'
    )
  );

create policy "members_update_self"
  on public.room_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "members_delete_self"
  on public.room_members for delete to authenticated
  using (user_id = auth.uid());

create policy "actions_select_member"
  on public.game_actions for select to authenticated
  using (exists (
    select 1 from public.room_members
    where room_id = game_actions.room_id and user_id = auth.uid()
  ));
