create or replace function public.append_action(
  p_room_id uuid,
  p_action jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_status text;
  v_current uuid;
  v_host uuid;
  v_seq bigint;
  v_action_type text := p_action->>'type';
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  select rm.role, r.status, r.current_player_user_id, r.host_user_id
    into v_role, v_status, v_current, v_host
  from public.rooms r
  join public.room_members rm
    on rm.room_id = r.id and rm.user_id = v_uid
  where r.id = p_room_id;

  if v_role is null then
    raise exception 'not a member of this room';
  end if;
  if v_role <> 'player' then
    raise exception 'spectators cannot dispatch actions';
  end if;

  if v_action_type = 'GAME_START' then
    if v_uid <> v_host then
      raise exception 'only host can start the game';
    end if;
    if v_status <> 'lobby' then
      raise exception 'game already started';
    end if;
    update public.rooms
      set status = 'in_game',
          rng_seed = (p_action->>'seed')::bigint,
          current_player_user_id = v_uid,
          last_activity_at = now()
      where id = p_room_id;
  else
    if v_status <> 'in_game' then
      raise exception 'room is not in_game';
    end if;
    if v_uid <> v_current then
      raise exception 'not your turn';
    end if;
  end if;

  select coalesce(max(seq), 0) + 1 into v_seq
    from public.game_actions where room_id = p_room_id;

  insert into public.game_actions (room_id, seq, actor_user_id, action)
  values (p_room_id, v_seq, v_uid, p_action);

  update public.rooms set last_activity_at = now() where id = p_room_id;

  return v_seq;
end;
$$;

revoke all on function public.append_action(uuid, jsonb) from public;
grant execute on function public.append_action(uuid, jsonb) to authenticated;
