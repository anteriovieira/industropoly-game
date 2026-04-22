import type { Action } from '@/engine/types';

export type RoomStatus = 'lobby' | 'in_game' | 'finished' | 'abandoned';
export type MemberRole = 'player' | 'spectator';

export interface RoomRow {
  id: string;
  code: string;
  host_user_id: string;
  status: RoomStatus;
  rng_seed: number | null;
  current_player_user_id: string | null;
  created_at: string;
  last_activity_at: string;
  finished_at: string | null;
}

export interface RoomMemberRow {
  room_id: string;
  user_id: string;
  role: MemberRole;
  seat_index: number | null;
  nickname: string;
  color: string | null;
  joined_at: string;
}

export interface GameActionRow {
  room_id: string;
  seq: number;
  actor_user_id: string;
  action: Action;
  created_at: string;
}

/** Synthetic wire-only action that seeds initial state on every client. Not in the reducer Action union. */
export interface GameStartAction {
  type: 'GAME_START';
  seed: number;
  players: { user_id: string; seat_index: number; name: string; token: string }[];
}

export interface PresenceState {
  user_id: string;
  seat_index: number | null;
  status: 'online' | 'away';
}

export type BroadcastEvent =
  | { type: 'dice:rolling'; userId: string }
  | { type: 'quiz:thinking'; userId: string; secondsLeft: number }
  | { type: 'emote'; userId: string; emoji: string }
  | { type: 'room:closed'; userId: string };
