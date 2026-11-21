import { describe, expect, it } from 'vitest';
import type { Action } from '../../src/engine/hand';
import type { PlayerView, SeatPolicy } from '../../src/engine/player-view';
import { userActionBar } from '../../src/table/action-bar';
import {
  DEFAULT_SESSION_CONFIG,
  configForGameType,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  type TableState,
} from '../../src/table/session';
import { SCENARIO_CODE } from '../support/table-scenarios';

const legal = (view: PlayerView, type: Action['type']): Action => {
  const action = view.legalActions.find((a) => a.type === type);
  if (action === undefined) throw new Error(`Seat ${view.seat} cannot ${type}`);
  return action;
};

/** Each bot before the user plays the next move in `moves`, by seat. */
function toUser(table: TableState, moves: Partial<Record<number, Action['type']>>): TableState {
  let t = dealHand(table, SCENARIO_CODE);
  const policy: SeatPolicy = (view) => legal(view, moves[view.seat] ?? 'fold');
  while (nextStep(t) === 'bot') t = stepBot(t, policy);
  expect(nextStep(t)).toBe('user');
  return t;
}

const labels = (table: TableState): string[] =>
  (userActionBar(table)?.buttons ?? []).map((b) => b.label);

describe('Game type acceptance', () => {
  it('a sit-and-go config has game type sit-and-go and carries no stake', () => {
    const before = structuredClone(DEFAULT_SESSION_CONFIG);
    const sng = configForGameType(DEFAULT_SESSION_CONFIG, 'sit-and-go', {
      smallBet: 6,
      bigBet: 12,
    });
    expect(sng).toStrictEqual({
      gameType: 'sit-and-go',
      players: 6,
      lineUp: 'Custom',
      seats: DEFAULT_SESSION_CONFIG.seats,
      speed: 'rapid',
      userSeat: 5,
      button: 6,
    });
    expect('stake' in sng).toBe(false);
    expect(DEFAULT_SESSION_CONFIG).toStrictEqual(before);

    expect(
      configForGameType(DEFAULT_SESSION_CONFIG, 'cash', { smallBet: 6, bigBet: 12 }),
    ).toStrictEqual({ ...DEFAULT_SESSION_CONFIG, stake: { smallBet: 6, bigBet: 12 } });
    expect(
      configForGameType(DEFAULT_SESSION_CONFIG, 'cash', DEFAULT_SESSION_CONFIG.stake),
    ).toStrictEqual(DEFAULT_SESSION_CONFIG);
  });

  it('a sit-and-go table seats 1500 chips at 20/40 with blinds 10 and 20', () => {
    const table = seatSession({ gameType: 'sit-and-go' });
    expect(table.config.gameType).toBe('sit-and-go');
    expect('stake' in table.config).toBe(false);
    expect(table.stakes).toEqual({ smallBlind: 10, bigBlind: 20, smallBet: 20, bigBet: 40 });
    expect(table.stacks).toEqual([1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 1500 })));

    const hand = dealHand(table, SCENARIO_CODE).hand;
    expect(hand?.actions.slice(0, 2).map((a) => [a.seat, a.type, a.amount])).toEqual([
      [1, 'small-blind', 10],
      [2, 'big-blind', 20],
    ]);
  });

  it('a sit-and-go action bar labels amounts in chips without a dollar sign', () => {
    const sng = seatSession({ gameType: 'sit-and-go' });

    const called = toUser(sng, { 3: 'call', 4: 'call' });
    expect(labels(called)).toEqual(['Fold', 'Call 20', 'Raise to 40']);
    expect(userActionBar(called)?.enabled).toBe(true);
    expect(labels(called).some((l) => l.includes('$'))).toBe(false);

    const raised = toUser(sng, { 3: 'raise', 4: 'fold' });
    expect(labels(raised)).toEqual(['Fold', 'Call 40', 'Raise to 60']);

    expect(labels(toUser(seatSession(), { 3: 'call', 4: 'call' }))).toEqual([
      'Fold',
      'Call $4',
      'Raise to $8',
    ]);
  });
});
