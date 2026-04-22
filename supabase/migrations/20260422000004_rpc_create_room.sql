create or replace function public.generate_room_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  chars text := '';
  i int;
  r int;
begin
  for i in 1..8 loop
    r := 1 + floor(random() * length(alphabet))::int;
    chars := chars || substr(alphabet, r, 1);
  end loop;
  return substr(chars, 1, 4) || '-' || substr(chars, 5, 4);
end;
$$;

create or replace function public.create_room(
  p_nickname text,
  p_color text default null
)
returns table (id uuid, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_code text;
  v_attempts int := 0;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  loop
    v_code := public.generate_room_code();
    begin
      insert into public.rooms (code, host_user_id, status)
      values (v_code, v_uid, 'lobby')
      returning rooms.id into v_id;
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 5 then raise; end if;
    end;
  end loop;

  insert into public.room_members (room_id, user_id, role, seat_index, nickname, color)
  values (v_id, v_uid, 'player', 0, p_nickname, p_color);

  return query select v_id, v_code;
end;
$$;

revoke all on function public.create_room(text, text) from public;
grant execute on function public.create_room(text, text) to authenticated;
