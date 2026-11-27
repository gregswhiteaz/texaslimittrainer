import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  forceFold,
  legalActions,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { checkDeal, checkState, checkStep } from '../../src/engine/invariants';
import { Xoshiro128 } from '../../src/engine/seeded-random';

// TASK-10.13 (Q-1 rule (a), Q-2 dead big blind): a forced fold forfeits every chip put in, and voids a strict
// top bet down to the highest live bet. Worked examples E1-E7 of the spec.

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

function deal(): HandState {
  return createHand({
    stakes: STAKES,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
    button: 6,
    deck: shuffledDeck(replayCodeFromWords([1, 2, 3, 4])),
  });
}

/** Applies "seat:type[:amount]" moves, e.g. "3:raise:8 4:fold". */
function play(hand: HandState, moves: string): HandState {
  let state = hand;
  for (const move of moves.split(' ').filter(Boolean)) {
    const [seat, type, amount] = move.split(':');
    const action = (
      amount === undefined
        ? { seat: Number(seat), type }
        : { seat: Number(seat), type, amount: Number(amount) }
    ) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${move}: ${result.error.message}`);
    expect(checkStep({ before: state, action, result })).toEqual([]);
    state = result.state;
  }
  return state;
}

const after = (moves: string): HandState => play(deal(), moves);
const seatOf = (hand: HandState, seat: SeatNumber) => hand.players.find((p) => p.seat === seat);
const stacks = (hand: HandState): number[] => hand.players.map((p) => p.stack);
const hasActed = (hand: HandState, seats: readonly SeatNumber[]): boolean[] =>
  seats.map((s) => seatOf(hand, s)?.hasActed as boolean);

const E3_FLOP = '3:call:4 4:call:4 5:fold 6:fold 1:call:2 2:check 1:check 2:check 3:bet:4';

describe('forced fold of the top bettor (TASK-10.13)', () => {
  it('a preflop raiser who leaves forfeits the raise and the others match the big blind', () => {
    // E2
    const e2 = forceFold(after('3:call:4 4:raise:8 5:fold 6:fold'), 4);
    expect(e2.currentBet).toBe(4);
    expect(e2.betCount).toBe(1);
    expect(e2.toAct).toBe(1);
    expect(legalActions(e2)).toEqual([
      { seat: 1, type: 'fold' },
      { seat: 1, type: 'call', amount: 2 },
      { seat: 1, type: 'raise', amount: 8 },
    ]);
    expect(seatOf(e2, 4)).toMatchObject({ folded: true, stack: 152, streetContribution: 8 });
    expect(hasActed(e2, [1, 2, 3])).toEqual([false, false, true]);
    expect(checkState(e2)).toEqual([]);

    const flop = play(e2, '1:call:2 2:check');
    expect(flop.street).toBe('flop');
    expect(flop.pots).toEqual([{ amount: 20, eligible: [1, 2, 3] }]);
    expect(stacks(flop)).toEqual([156, 156, 156, 152, 160, 160]);
    expect(checkState(flop)).toEqual([]);

    // E1
    const e1 = forceFold(after('3:raise:8 4:fold 5:fold 6:fold 1:fold'), 3);
    expect(e1.result?.endedBy).toBe('fold');
    expect(e1.result?.awards).toEqual([{ pot: 0, amount: 14, winners: [{ seat: 2, amount: 14 }] }]);
    expect(e1.result?.returned).toBeUndefined();
    expect(stacks(e1)).toEqual([158, 170, 152, 160, 160, 160]);
    expect(checkDeal(e1)).toEqual([]);
  });

  it('a flop bettor who leaves forfeits the bet and the street goes on unbet', () => {
    // E3
    const e3 = forceFold(after(E3_FLOP), 3);
    expect(e3.currentBet).toBe(0);
    expect(e3.betCount).toBe(0);
    expect(e3.toAct).toBe(4);
    expect(legalActions(e3)).toEqual([
      { seat: 4, type: 'check' },
      { seat: 4, type: 'bet', amount: 4 },
    ]);
    expect(hasActed(e3, [1, 2, 4])).toEqual([true, true, false]);
    expect(checkState(e3)).toEqual([]);

    const turn = play(e3, '4:check');
    expect(turn.street).toBe('turn');
    expect(turn.pots).toEqual([{ amount: 20, eligible: [1, 2, 4] }]);
    expect(checkState(turn)).toEqual([]);

    // E4
    const e4 = forceFold(after(`${E3_FLOP} 4:fold 1:fold`), 3);
    expect(e4.result?.endedBy).toBe('fold');
    expect(e4.result?.awards).toEqual([{ pot: 0, amount: 20, winners: [{ seat: 2, amount: 20 }] }]);
    expect(e4.result?.returned).toBeUndefined();
    expect(stacks(e4)).toEqual([156, 176, 152, 156, 160, 160]);
    expect(checkDeal(e4)).toEqual([]);
  });

  it('a big blind who leaves is dead money and still sets the price', () => {
    // E5
    const e5 = forceFold(after('3:fold 4:fold 5:fold 6:fold'), 2);
    expect(e5.result?.awards).toEqual([{ pot: 0, amount: 6, winners: [{ seat: 1, amount: 6 }] }]);
    expect(e5.result?.returned).toBeUndefined();
    expect(stacks(e5)).toEqual([164, 156, 160, 160, 160, 160]);
    expect(checkDeal(e5)).toEqual([]);

    // E6
    const e6 = forceFold(deal(), 2);
    expect(e6.currentBet).toBe(4);
    expect(e6.toAct).toBe(3);
    expect(legalActions(e6)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 4 },
      { seat: 3, type: 'raise', amount: 8 },
    ]);
    expect(checkDeal(e6)).toEqual([]);
  });

  it('a voided raise frees its place under the bet cap', () => {
    // E7
    const e7 = forceFold(after('3:raise:8 4:raise:12 5:raise:16 6:fold 1:fold 2:fold'), 5);
    expect(e7.currentBet).toBe(12);
    expect(e7.betCount).toBe(3);
    expect(e7.toAct).toBe(3);
    expect(legalActions(e7)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 4 },
      { seat: 3, type: 'raise', amount: 16 },
    ]);
    expect(seatOf(e7, 4)?.hasActed).toBe(true);
    expect(checkState(e7)).toEqual([]);

    const action: Action = { seat: 3, type: 'raise', amount: 16 };
    const result = applyAction(e7, action);
    expect(checkStep({ before: e7, action, result })).toEqual([]);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.betCount).toBe(4);
    expect(result.state.toAct).toBe(4);
    expect(legalActions(result.state)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 4 },
    ]);
  });

  it('play without a voided bet is unchanged', () => {
    for (let i = 0; i < 500; i++) {
      const rng = new Xoshiro128(i + 1);
      let state = createHand({
        stakes: STAKES,
        seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
        button: 1 + (i % 6),
        deck: shuffledDeck(replayCodeFromWords([i, 5, 6, 7])),
      });
      expect(checkDeal(state)).toEqual([]);
      while (state.result === null) {
        const live = state.players.filter((p) => !p.folded).map((p) => p.streetContribution);
        const floor = state.street === 'preflop' ? STAKES.bigBlind : 0;
        expect(state.currentBet).toBe(Math.max(floor, ...live));
        const legal = legalActions(state);
        const action = legal[rng.nextInt(legal.length)] as Action;
        const result = applyAction(state, action);
        expect(checkStep({ before: state, action, result })).toEqual([]);
        if (!result.ok) throw new Error(result.error.message);
        state = result.state;
      }
      expect(checkDeal(state)).toEqual([]);
      const returned = state.result.returned;
      if (returned !== undefined) expect(seatOf(state, returned.seat)?.folded).toBe(false);
    }
  });
});
