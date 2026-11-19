import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { Action } from '../../src/engine/hand';
import {
  USER_SEAT,
  applyUserAction,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';

const CODE = replayCodeFromWords([7, 1, 2, 3]);

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function untilUser(table: TableState): TableState {
  let t = table;
  while (nextStep(t) === 'bot') t = stepBot(t);
  return t;
}

function untilDone(table: TableState): TableState {
  let t = table;
  while (nextStep(t) !== 'done') {
    if (nextStep(t) === 'bot') t = stepBot(t);
    else {
      const actions = userActions(t);
      const pick =
        actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
      t = applyUserAction(t, pick as Action);
    }
  }
  return t;
}

describe('table session', () => {
  it('wrong-step calls and illegal actions are rejected', () => {
    const seated = deepFreeze(seatSession());
    expect(() => stepBot(seated)).toThrow(RangeError);
    expect(() => applyUserAction(seated, { seat: USER_SEAT, type: 'fold' })).toThrow(RangeError);

    const dealt = deepFreeze(dealHand(seated, CODE));
    expect(() => dealHand(dealt, CODE)).toThrow(new RangeError('Not a deal step'));

    const userTurn = deepFreeze(untilUser(dealt));
    expect(nextStep(userTurn)).toBe('user');
    expect(() => applyUserAction(userTurn, { seat: 5, type: 'bet', amount: 99 })).toThrow(
      RangeError,
    );
    expect(userTurn.userDecisions).toEqual([]);

    const rejectingPolicy = () => ({ seat: 1, type: 'check' }) as const;
    expect(() => stepBot(dealt, rejectingPolicy)).toThrow(RangeError);

    // Normal progress on frozen inputs proves nothing is mutated.
    const done = untilDone(userTurn);
    expect(nextStep(done)).toBe('done');
    expect(() => dealHand(done, CODE)).toThrow(new RangeError('Not a deal step'));
    expect(() => stepBot(done)).toThrow(new RangeError('Not a bot turn'));
  });

  it('next step follows the hand state', () => {
    const seated = seatSession();
    const botTurn = dealHand(seated, CODE);
    const userTurn = untilUser(botTurn);
    const done = untilDone(userTurn);
    expect([seated, botTurn, userTurn, done].map(nextStep)).toEqual([
      'deal',
      'bot',
      'user',
      'done',
    ]);
    expect(userActions(seated)).toEqual([]);
    expect(userActions(botTurn)).toEqual([]);
    expect(userActions(done)).toEqual([]);
    expect(userActions(userTurn).length).toBeGreaterThan(0);
  });
});
