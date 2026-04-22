import { reducer } from '@/engine/reducer';
import { createInitialState, type InitialPlayerInput } from '@/engine/init';
import type { Action, GameOptions, GameState } from '@/engine/types';

export interface LoggedAction {
  seq: number;
  action: Action;
}

export class ActionLog {
  state: GameState;
  lastSeq: number = 0;
  private buffer = new Map<number, Action>();

  constructor(seed: number, players: InitialPlayerInput[], options?: GameOptions) {
    this.state = createInitialState(players, seed, options);
  }

  apply(entry: LoggedAction): void {
    if (entry.seq <= this.lastSeq) return;
    this.buffer.set(entry.seq, entry.action);
    while (this.buffer.has(this.lastSeq + 1)) {
      const next = this.lastSeq + 1;
      const action = this.buffer.get(next)!;
      this.buffer.delete(next);
      this.state = reducer(this.state, action);
      this.lastSeq = next;
    }
  }

  static replay(
    seed: number,
    players: InitialPlayerInput[],
    actions: LoggedAction[],
    options?: GameOptions,
  ): ActionLog {
    const log = new ActionLog(seed, players, options);
    const sorted = [...actions].sort((a, b) => a.seq - b.seq);
    for (const a of sorted) log.apply(a);
    return log;
  }
}
