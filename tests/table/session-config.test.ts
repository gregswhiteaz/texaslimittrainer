import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { Action } from '../../src/engine/hand';
import { userActionBar } from '../../src/table/action-bar';
import {
  DEFAULT_SEATS,
  DEFAULT_SESSION_CONFIG,
  applyUserAction,
  completedHand,
  dealHand,
  nextStep,
  resolveSessionConfig,
  seatSession,
  stepBot,
  userActions,
  type SessionSeat,
  type TableState,
} from '../../src/table/session';

/** DEFAULT_SEATS with the names and kinds of seats 2 and 5 swapped: the user sits at seat 2. */
const SWAPPED: readonly SessionSeat[] = DEFAULT_SEATS.map((s) => {
  if (s.seat === 2) return { seat: 2, name: 'You', kind: 'user', style: null };
  if (s.seat === 5) return { seat: 5, name: 'Ben', kind: 'bot', style: 'TAG' };
  return s;
});

function checkOrCall(table: TableState): Action {
  const actions = userActions(table);
  const pick = actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
  if (pick === undefined) throw new Error('No check or call offered');
  return pick;
}

describe('session config', () => {
  it('the table honours the configured user seat, button and seats', () => {
    let totalUserTurns = 0;
    for (let i = 0; i < 20; i += 1) {
      const seated = seatSession({ userSeat: 2, button: 3, seats: SWAPPED });
      expect(seated.seats).toBe(SWAPPED);
      expect(userActionBar(seated)).toBeNull();

      let t = dealHand(seated, replayCodeFromWords([i, 1, 2, 3]));
      expect(t.hand?.button).toBe(3);
      expect(t.hand?.actions.slice(0, 2).map((a) => [a.seat, a.type])).toEqual([
        [4, 'small-blind'],
        [5, 'big-blind'],
      ]);

      let userTurns = 0;
      while (nextStep(t) !== 'done') {
        const userTurn = t.hand?.toAct === 2;
        expect(nextStep(t)).toBe(userTurn ? 'user' : 'bot');
        expect(userActionBar(t)?.enabled).toBe(userTurn);
        if (userTurn) {
          userTurns += 1;
          t = applyUserAction(t, checkOrCall(t));
        } else {
          t = stepBot(t);
        }
      }
      const record = completedHand(t);
      expect(record?.userSeat).toBe(2);
      expect(record?.button).toBe(3);
      expect(record?.userDecisions).toHaveLength(userTurns);
      expect(record?.userDecisions.every((d) => d.view.seat === 2)).toBe(true);
      expect(record?.seats.map((s) => s.name)).toEqual(['Ava', 'You', 'Cal', 'Dee', 'Ben', 'Eli']);
      totalUserTurns += userTurns;
    }
    expect(totalUserTurns).toBeGreaterThan(0);
  });

  it('partial input is merged over the first-use defaults', () => {
    const stake = { smallBet: 10, bigBet: 20 };
    expect(seatSession({ stake }).config).toEqual({ ...DEFAULT_SESSION_CONFIG, stake });
    expect(seatSession().config).toEqual(DEFAULT_SESSION_CONFIG);
    expect(resolveSessionConfig()).toEqual(DEFAULT_SESSION_CONFIG);
    expect(resolveSessionConfig({ button: 2 })).toEqual({ ...DEFAULT_SESSION_CONFIG, button: 2 });
  });

  it('the first-use config is plain JSON data', () => {
    expect(JSON.parse(JSON.stringify(DEFAULT_SESSION_CONFIG))).toEqual(DEFAULT_SESSION_CONFIG);
  });
});
