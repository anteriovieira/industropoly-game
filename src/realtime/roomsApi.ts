import { getSupabase } from './supabaseClient';
import type { Action } from '@/engine/types';
import type { RoomRow, RoomMemberRow, GameActionRow } from './types';

export async function createRoom(nickname: string, color?: string): Promise<{ id: string; code: string }> {
  const { data, error } = await getSupabase()
    .rpc('create_room', { p_nickname: nickname, p_color: color ?? null })
    .single();
  if (error) throw error;
  if (!data) throw new Error('create_room returned no row');
  return data as { id: string; code: string };
}

/**
 * Returns the user's most recent non-finished membership, or null.
 * Used on app boot to resume into the active room.
 */
export async function findActiveMembership(userId: string): Promise<{ room: RoomRow } | null> {
  const { data: rows, error } = await getSupabase()
    .from('room_members')
    .select('room_id, rooms:room_id(*)')
    .eq('user_id', userId);
  if (error) throw error;
  const candidates = ((rows ?? []) as unknown as { rooms: RoomRow | RoomRow[] | null }[])
    .flatMap((r) => (Array.isArray(r.rooms) ? r.rooms : r.rooms ? [r.rooms] : []))
    .filter((r) => r.status === 'lobby' || r.status === 'in_game')
    .sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at));
  return candidates[0] ? { room: candidates[0] } : null;
}

export async function findRoomByCode(code: string): Promise<RoomRow | null> {
  const { data, error } = await getSupabase()
    .from('rooms')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  return (data as RoomRow) ?? null;
}

export async function joinRoom(
  roomId: string,
  userId: string,
  nickname: string,
  color: string | null,
): Promise<RoomMemberRow> {
  const supabase = getSupabase();
  const { data: members, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .eq('role', 'player');
  if (error) throw error;

  const taken = new Set((members as RoomMemberRow[]).map((m) => m.seat_index));
  let seat: number | null = null;
  for (let i = 0; i < 4; i++) if (!taken.has(i)) { seat = i; break; }

  const role = seat === null ? 'spectator' : 'player';
  const { data: row, error: insErr } = await supabase
    .from('room_members')
    .insert({ room_id: roomId, user_id: userId, role, seat_index: seat, nickname, color })
    .select()
    .single();
  if (insErr) throw insErr;
  return row as RoomMemberRow;
}

export async function listMembers(roomId: string): Promise<RoomMemberRow[]> {
  const { data, error } = await getSupabase()
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .order('seat_index', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as RoomMemberRow[];
}

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function appendAction(roomId: string, action: Action): Promise<number> {
  const { data, error } = await getSupabase()
    .rpc('append_action', { p_room_id: roomId, p_action: action });
  if (error) throw error;
  return data as number;
}

export async function fetchActions(roomId: string, sinceSeq = 0): Promise<GameActionRow[]> {
  const { data, error } = await getSupabase()
    .from('game_actions')
    .select('*')
    .eq('room_id', roomId)
    .gt('seq', sinceSeq)
    .order('seq', { ascending: true });
  if (error) throw error;
  return data as GameActionRow[];
}

export async function setCurrentPlayer(roomId: string, userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('rooms')
    .update({ current_player_user_id: userId, last_activity_at: new Date().toISOString() })
    .eq('id', roomId);
  if (error) throw error;
}
