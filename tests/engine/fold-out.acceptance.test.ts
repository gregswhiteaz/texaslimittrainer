import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);
const SEATS = [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 }));
const start = () => createHand({ stakes: STAKES, seats: SEATS, button: 1, deck: DECK });

type Step = [SeatNumber, Action['type'], number?];

function apply(state: HandState, [seat, type, amount]: Step): HandState {
  const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

const play = (state: HandState, ...steps: Step[]) => steps.reduce(apply, state);
const folds = (...seats: SeatNumber[]): Step[] => seats.map((seat) => [seat, 'fold']);

function expectReset(end: HandState) {
  expect(end.result?.endedBy).toBe('fold');
  expect(end.toAct).toBeNull();
  expect(end.currentBet).toBe(0);
  expect(end.betCount).toBe(0);
  expect(end.players.every((p) => p.streetContribution === 0)).toBe(true);
}

describe('fold-out bet counters', () => {
  it('a preflop fold-out leaves currentBet and betCount at 0', () => {
    const raised = play(start(), [4, 'raise', 8]);
    expect([raised.currentBet, raised.betCount]).toEqual([8, 2]);

    const end = play(raised, ...folds(5, 6, 1, 2, 3));
    expect(end.street).toBe('preflop');
    expectReset(end);
  });

  it('a flop fold-out after a raise leaves currentBet and betCount at 0', () => {
    const limps: Step[] = [4, 5, 6, 1].map((seat) => [seat, 'call', 4]);
    const flop = play(start(), ...limps, [2, 'call', 2], [3, 'check']);
    expect(flop.street).toBe('flop');
    const raised = play(flop, [2, 'bet', 4], [3, 'raise', 8]);
    expect([raised.currentBet, raised.betCount]).toEqual([8, 2]);

    const end = play(raised, ...folds(4, 5, 6, 1, 2));
    expect(end.street).toBe('flop');
    expectReset(end);
    expect(end.result?.awards).toEqual([
      { pot: 0, amount: 32, winners: [{ seat: 3, amount: 32 }] },
    ]);
  });
});
