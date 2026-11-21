import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type SeatNumber,
  type Stakes,
} from '../../src/engine/hand';
import { checkState } from '../../src/engine/invariants';

const STAKES_4_8: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

/** A deck whose card at 0-based index i is 51 - i, so every position is distinct and known. */
const REVERSED: Card[] = Array.from({ length: 52 }, (_, i) => 51 - i);

function newHand(seats: number[], button: SeatNumber, deck: Card[] = REVERSED): HandState {
  return createHand({
    stakes: STAKES_4_8,
    seats: seats.map((seat) => ({ seat, stack: 160 })),
    button,
    deck,
  });
}

type Step = [SeatNumber, Action['type'], number?];

function play(state: HandState, ...steps: Step[]): HandState {
  let current = state;
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(current, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    current = result.state;
  }
  return current;
}

const stackOf = (state: HandState, seat: SeatNumber) =>
  state.players.find((p) => p.seat === seat)?.stack;

describe('heads-up hands', () => {
  it('AC#1 heads-up the button posts the $2 small blind and the other player the $4 big blind', () => {
    const cases: [number[], SeatNumber, SeatNumber][] = [
      [[1, 2], 1, 2],
      [[1, 2], 2, 1],
      [[3, 7], 7, 3],
    ];
    for (const [seats, button, other] of cases) {
      const state = newHand(seats, button);
      expect(state.players).toHaveLength(2);
      expect(state.actions).toEqual([
        { street: 'preflop', seat: button, type: 'small-blind', amount: 2, added: 2 },
        { street: 'preflop', seat: other, type: 'big-blind', amount: 4, added: 4 },
      ]);
      expect(stackOf(state, button)).toBe(158);
      expect(stackOf(state, other)).toBe(156);
      expect(state.currentBet).toBe(4);
      expect(state.betCount).toBe(1);
    }
  });

  it('AC#2 heads-up the button acts first preflop', () => {
    for (const [button, other] of [
      [1, 2],
      [2, 1],
    ] as const) {
      const start = newHand([1, 2], button);
      expect(start.toAct).toBe(button);
      expect(legalActions(start)).toEqual([
        { seat: button, type: 'fold' },
        { seat: button, type: 'call', amount: 2 },
        { seat: button, type: 'raise', amount: 8 },
      ]);
      const option = play(start, [button, 'call', 2]);
      expect(option.street).toBe('preflop');
      expect(option.toAct).toBe(other);
      expect(legalActions(option)).toEqual([
        { seat: other, type: 'check' },
        { seat: other, type: 'raise', amount: 8 },
      ]);
      const flop = play(option, [other, 'check']);
      expect(flop.street).toBe('flop');
    }
  });

  it('AC#3 heads-up the non-button player acts first on flop turn and river', () => {
    for (const [button, other] of [
      [1, 2],
      [2, 1],
    ] as const) {
      let state = play(newHand([1, 2], button), [button, 'call', 2], [other, 'check']);
      for (const street of ['flop', 'turn', 'river'] as const) {
        expect(state.street).toBe(street);
        expect(state.toAct).toBe(other);
        state = play(state, [other, 'check']);
        expect(state.toAct).toBe(button);
        state = play(state, [button, 'check']);
      }
      expect(state.street).toBe('showdown');

      const raised = play(
        newHand([1, 2], button),
        [button, 'call', 2],
        [other, 'check'],
        [other, 'bet', 4],
        [button, 'raise', 8],
        [other, 'call', 4],
      );
      expect(raised.street).toBe('turn');
      expect(raised.toAct).toBe(other);
      expect(raised.actions.filter((a) => a.street === 'flop').map((a) => a.seat)).toEqual([
        other,
        button,
        other,
      ]);
    }
  });

  it('heads-up hands deal from the D-5 positions and reach showdown with chips conserved', () => {
    const deck = REVERSED;
    let state = newHand([1, 2], 1, deck);
    expect(checkState(state)).toEqual([]);
    const seat = (s: SeatNumber) => state.players.find((p) => p.seat === s);
    expect(seat(2)?.holeCards).toEqual([deck[0], deck[2]]);
    expect(seat(1)?.holeCards).toEqual([deck[1], deck[3]]);

    const steps: Step[] = [
      [1, 'call', 2],
      [2, 'check'],
      [2, 'check'],
      [1, 'check'],
      [2, 'check'],
      [1, 'check'],
      [2, 'check'],
      [1, 'check'],
    ];
    for (const step of steps) {
      state = play(state, step);
      expect(checkState(state)).toEqual([]);
    }
    expect(state.board).toEqual([deck[5], deck[6], deck[7], deck[9], deck[11]]);
    expect(state.burned).toEqual([deck[4], deck[8], deck[10]]);
    expect(state.result?.endedBy).toBe('showdown');
    expect(state.players.reduce((sum, p) => sum + p.stack, 0)).toBe(320);
  });
});
