import { describe, it, expect } from 'vitest';
import { ActionLog, type LoggedAction } from '@/realtime/actionLog';
import { createInitialState } from '@/engine/init';
import { reducer } from '@/engine/reducer';
import type { Action, GameState } from '@/engine/types';

const PLAYERS = [
  { name: 'Ada', token: 'locomotive' as const },
  { name: 'Babbage', token: 'top-hat' as const },
];

const SEED = 12345;

function applyAll(actions: LoggedAction[]): GameState {
  let state = createInitialState(PLAYERS, SEED);
  for (const a of actions) state = reducer(state, a.action);
  return state;
}

describe('ActionLog', () => {
  it('starts empty with seq 0', () => {
    const log = new ActionLog(SEED, PLAYERS);
    expect(log.lastSeq).toBe(0);
    expect(log.state.turn).toBe(1);
  });

  it('applies in-order actions', () => {
    const log = new ActionLog(SEED, PLAYERS);
    log.apply({ seq: 1, action: { type: 'ROLL_DICE' } as Action });
    expect(log.lastSeq).toBe(1);
    expect(log.state).toEqual(applyAll([{ seq: 1, action: { type: 'ROLL_DICE' } }]));
  });

  it('buffers out-of-order actions until contiguous', () => {
    const log = new ActionLog(SEED, PLAYERS);
    log.apply({ seq: 2, action: { type: 'ANSWER_QUESTION', optionId: 'a' } as Action });
    expect(log.lastSeq).toBe(0);
    log.apply({ seq: 1, action: { type: 'ROLL_DICE' } as Action });
    expect(log.lastSeq).toBe(2);
  });

  it('ignores duplicates', () => {
    const log = new ActionLog(SEED, PLAYERS);
    log.apply({ seq: 1, action: { type: 'ROLL_DICE' } as Action });
    log.apply({ seq: 1, action: { type: 'ROLL_DICE' } as Action });
    expect(log.lastSeq).toBe(1);
  });

  it('replays a list of actions deterministically', () => {
    const actions: LoggedAction[] = [
      { seq: 1, action: { type: 'ROLL_DICE' } as Action },
    ];
    const a = ActionLog.replay(SEED, PLAYERS, actions);
    const b = ActionLog.replay(SEED, PLAYERS, actions);
    expect(a.state).toEqual(b.state);
  });
});
