# Supabase Realtime Multiplayer (Rooms) — Design

**Date:** 2026-04-22
**Status:** Approved (brainstorm), pending implementation plan
**Scope:** Add online multiplayer mode to Industropoly using Supabase (Postgres + Realtime: Postgres Changes, Presence, Broadcast). Hot-seat mode is preserved unchanged.

## Goals

- Allow 2–4 players to play a full Industropoly match across separate devices in real time.
- Keep the existing hot-seat mode intact and selectable from the menu.
- Reuse the existing pure `engine/reducer.ts` as the single source of game logic — sync action streams, not state diffs.
- Keep the SPA static; Supabase is the only backend dependency.

## Non-Goals (MVP)

- Real user accounts / OAuth.
- Public lobby / room discovery.
- Free-text chat (only fixed emotes).
- Permanent match history / leaderboard.
- Divergence reconciliation between clients (we rely on a seeded deterministic reducer).
- Deep anti-cheat (RLS gating actions to the player whose turn it is is sufficient).

## Decisions Summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | Coexistence | Online mode added alongside hot-seat (separate menu entry). |
| 2 | Auth | Anonymous persistent (`signInAnonymously()` + `user_id` in `localStorage`). |
| 3 | Discovery | Code-only (`ABCD-1234`). No public lobby. |
| 4 | Authority model | DB-authoritative: every action `INSERT`s into `game_actions`; clients subscribe via Postgres Changes. |
| 5 | Room lifetime | Persistent until the match ends; rooms abandoned for >7 days are cleaned up by a scheduled job. |
| 6 | Spectators | Allowed (separate `role='spectator'` in `room_members`, no seat). |
| 7 | Game start | Host (creator) clicks "Start" once ≥2 players have claimed seats. |
| 8 | Presence usage | Per-seat connection status (online/away) shown in HUD. |
| 9 | Broadcast usage | Ephemeral signals only (dice rolling, quiz timer, emotes). Never used to mutate game state. |
| 10 | Reconnect / mid-join | Replay all `game_actions` ordered by `seq`, then subscribe to new ones. |
| 11 | Quiz UX | Only the active player sees the quiz modal; others see "X is answering… ⏱". |
| 12 | RNG | Seed generated at `GAME_START` and persisted on the room row, ensuring deterministic replay everywhere. |

## Architecture

```
┌──────────────────┐         ┌──────────────────┐
│  Client A        │         │  Client B        │
│  (player 1)      │         │  (player 2)      │
│                  │         │                  │
│  pure reducer    │         │  pure reducer    │
│      ▲           │         │      ▲           │
│      │ apply     │         │      │ apply     │
│      │           │         │      │           │
│  pg_changes sub ◄┼────┬────┼─► pg_changes sub │
│      │           │    │    │      │           │
│      ▼ INSERT    │    │    │      ▼ INSERT    │
└──────────────────┘    │    └──────────────────┘
                        ▼
              ┌─────────────────┐
              │  Supabase       │
              │  ┌───────────┐  │
              │  │ rooms     │  │
              │  │ room_     │  │
              │  │  members  │  │
              │  │ game_     │  │
              │  │  actions  │  │
              │  └───────────┘  │
              │  Realtime:      │
              │  ├─ pg_changes  │
              │  ├─ presence    │
              │  └─ broadcast   │
              └─────────────────┘
```

The `engine/reducer.ts` and `engine/init.ts` are unchanged. The whole online stack lives in a new `src/realtime/` folder so that the offline (hot-seat) build path is untouched.

## Database Schema

```sql
-- Rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,            -- e.g. "ABCD-1234"
  host_user_id uuid not null,
  status text not null check (status in ('lobby','in_game','finished','abandoned')),
  rng_seed bigint,                      -- set at GAME_START
  created_at timestamptz default now(),
  last_activity_at timestamptz default now(),
  finished_at timestamptz
);

-- Members (players + spectators)
create table room_members (
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('player','spectator')),
  seat_index int,                        -- 0..3 if player, null if spectator
  nickname text not null,
  color text,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);
create unique index room_members_seat_uniq
  on room_members(room_id, seat_index)
  where role = 'player';

-- Authoritative action log
create table game_actions (
  room_id uuid references rooms(id) on delete cascade,
  seq bigint not null,
  actor_user_id uuid not null,
  action jsonb not null,                 -- typed reducer payload
  created_at timestamptz default now(),
  primary key (room_id, seq)
);
```

### RLS Policies (high level)

- `rooms`, `room_members`, `game_actions`: `SELECT` allowed when `auth.uid()` is a member of the room.
- `rooms`: `INSERT` allowed for any authenticated user, with `host_user_id = auth.uid()` enforced by policy. `UPDATE` allowed only when `auth.uid() = host_user_id` (start game, set status). `DELETE` not allowed (rely on cleanup job).
- `room_members`: `INSERT` allowed for self when room is in `lobby`. `DELETE` of own row allowed.
- `game_actions`: `INSERT` allowed via a `SECURITY DEFINER` function `append_action(room_id, action)` which validates: (a) `auth.uid()` is a `player` member of the room, (b) room is `in_game`, (c) the action's actor matches the current turn's player (derived by replaying or from a cached `current_player` column — see Open Questions), (d) `seq` is `coalesce(max(seq),0)+1`. The function is the only writer.

Code generation (uniqueness guarantee): `code` is generated as 8 alphanumeric chars with a retry-on-conflict loop in the `create_room` RPC.

## Client Layer (`src/realtime/`)

- `supabaseClient.ts` — singleton client. Calls `signInAnonymously()` on first load and persists `user_id` in `localStorage` so reconnects reclaim the same identity.
- `roomsApi.ts` — `createRoom(nickname, color)`, `joinRoom(code, nickname, color)`, `claimSeat(seatIndex)`, `leaveSeat()`, `becomeSpectator()`, `startGame()`, `appendAction(action)` (calls the `append_action` RPC).
- `useRoomChannel.ts` — React hook bound to a room id. Subscribes to `postgres_changes` on `game_actions` filtered by `room_id`, joins the Realtime channel for `presence` and `broadcast`, returns `{ presence, sendBroadcast, lastSeq }`.
- `actionLog.ts` — pure replay helper: `replay(actions, seed) => GameState`. Buffers/reorders by `seq` to handle out-of-order delivery during reconnection.
- `onlineGameStore.ts` — Zustand store mirroring `gameStore` but: `dispatch(action)` calls `appendAction`; state updates only when the realtime event loops back. Exposes the same `state` shape so UI consumers can be source-agnostic.

## Action Flow

1. Active player triggers `dispatch(BUY)` from the UI.
2. `onlineGameStore` calls `appendAction(BUY)` → `INSERT` via RPC.
3. RPC validates membership, turn, and `seq`. If valid, persists.
4. Postgres Changes notifies all subscribers (including the emitter).
5. Each client appends to its action log and runs `state = reducer(state, action)` in `seq` order.
6. Out-of-order arrivals (rare; only during reconnection) are buffered and applied once contiguous.

## Presence and Broadcast

**Presence** — track `{ user_id, seat_index, status: 'online' | 'away' }`. The HUD shows a colored dot per seat. After a configurable timeout (e.g. 30s without heartbeat), a seat shows "disconnected" but stays reserved.

**Broadcast** payloads (no game-state side-effects):

- `dice:rolling` — visual sync of the dice animation while the active player rolls.
- `quiz:thinking` — propagates the live timer so spectators and other players see the same countdown.
- `emote` — fixed reaction set (👍 😂 😱 🎉 🤔) shown briefly above the sender's avatar.

## UI Changes

- `src/app/IntroScreen.tsx` — add a second primary button "Jogar Online" next to the existing hot-seat button.
- New screens in `src/app/online/`:
  - `OnlineLobbyScreen.tsx` — "Create room" / "Join with code" entry point. Shows the user's nickname and color picker.
  - `RoomLobbyScreen.tsx` — pre-game room view: 4 seat slots (claim/leave), spectator list, host's "Start" button (enabled with ≥2 players).
- `src/app/GameScreen.tsx` — gains a `gameSource: 'local' | 'online'` prop that selects which store to read/dispatch through. Most components stay source-agnostic.
- HUD — per-seat presence indicator and an emote tray (online mode only).

## Error Handling

| Situation | Behavior |
|-----------|----------|
| Connection drops | Banner "Reconectando…", auto-resubscribe, then incremental replay from `lastSeq`. |
| `seq` conflict | Should not occur in practice (only the active player can write). If it does, refetch and retry once; otherwise surface as toast. |
| Host closes tab | No effect on the game. On return, host reclaims its seat by `user_id`. |
| RLS rejection | Action not persisted; toast shown; local state unchanged. |
| Mid-game join (new user) | Allowed only as `spectator`. The set of `player` seats is locked at `GAME_START`. Spectator replays the full log on join. |
| Mid-game return (existing player) | A user whose `user_id` already holds a `player` row reclaims their seat automatically and replays the full log. |

## Testing

- **Unit (Vitest)** — `actionLog` replay determinism, `onlineGameStore` against a mocked Supabase client. Existing reducer tests unchanged.
- **Integration** — Supabase CLI local stack: spin up two clients in the same test, run a sequence of actions, assert convergent `GameState`.
- **E2E (Playwright)** — two headless browsers, create room in one, join via code in the other, complete two turns, assert HUD parity. Hot-seat smoke test must keep passing.

## Infrastructure & Setup

- New Supabase project (free tier is enough for MVP).
- Supabase CLI integrated: `supabase/migrations/` versioned in repo.
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. `.env.example` committed; real values in `.env.local`.
- `scripts/supabase-init.md` — short doc with the manual project-creation steps and how to run migrations locally.
- Cleanup job: `pg_cron` task running daily, sets `status='abandoned'` on rooms whose `last_activity_at` is older than 7 days, and deletes them after another 7. (Two-week retention total.)

## Open Questions (deferred to plan)

- `current_player` cache vs replay-on-write inside `append_action` RPC — replaying may be too expensive once the action log gets long; a cached `current_player_user_id` column on `rooms` updated by the RPC is likely the right call. Decision to be made in the plan.
- Exact emote set and HUD placement — UI detail, not architectural.
- Whether `GAME_START` action contains the full initial `players[]` payload or just references seats — likely the former for replay simplicity.

## Out of Scope (MVP)

Real accounts, public lobby, free-text chat, persistent history/ranking, anti-cheat beyond RLS turn gating, divergence reconciliation.
