import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  nextButton,
  type Action,
  type HandState,
  type SeatConfig,
  type SeatNumber,
} from '../../src/engine/hand';
import { checkDeal, checkStep } from '../../src/engine/invariants';
import { playerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { handReplayCode } from '../../src/playtest/runner';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, i) => i);
const seatsOf = (stacks: readonly number[]): SeatConfig[] =>
  stacks.map((stack, i) => ({ seat: i + 1, stack }));

function play(state: HandState, ...steps: Action[]): HandState {
  let current = state;
  for (const action of steps) {
    const result = applyAction(current, action);
    if (!result.ok) throw new Error(result.error.message);
    current = result.state;
  }
  return current;
}

/** Every combination of `values` over `n` positions. */
function combinations(values: readonly number[], n: number): number[][] {
  if (n === 0) return [[]];
  return combinations(values, n - 1).flatMap((rest) => values.map((v) => [...rest, v]));
}

describe('all-in blinds', () => {
  it('lone player rule, floor and nextButton', () => {
    // W10: seat 4 calls all-in for $3; once seat 2 folds, the big blind has nobody to bet against.
    const hand = createHand({
      stakes: STAKES,
      seats: seatsOf([160, 160, 160, 3, 160, 160]),
      button: 1,
      deck: DECK,
    });
    const fold = (seat: SeatNumber): Action => ({ seat, type: 'fold' });
    const called = play(hand, { seat: 4, type: 'call', amount: 3 });
    expect(called.players[3]?.allIn).toBe(true);
    const beforeLast = play(called, fold(5), fold(6), fold(1));
    expect(beforeLast.toAct).toBe(2);
    const done = play(beforeLast, fold(2));
    expect(done.toAct).toBeNull();
    expect(done.result?.returned).toEqual({ seat: 3, amount: 1 });
    expect(done.result?.awards.map((a) => a.amount)).toEqual([8]);
    expect(done.pots.map((p) => p.eligible)).toEqual([[3, 4]]);
    expect(done.actions.some((a) => a.seat === 3 && a.type !== 'big-blind')).toBe(false);

    const config = (stack: number) => ({
      stakes: STAKES,
      seats: seatsOf([160, 160, stack]),
      button: 1,
      deck: DECK,
    });
    expect(() => createHand(config(0))).toThrow(
      new RangeError('Stack at seat 3 must be an integer of at least 1'),
    );
    expect(() => createHand(config(1.5))).toThrow(
      new RangeError('Stack at seat 3 must be an integer of at least 1'),
    );
    expect(createHand(config(1)).players[2]?.startingStack).toBe(1);

    expect(() => nextButton(seatsOf([160, 0]), 1)).toThrow(
      new RangeError('Need at least 2 seats with chips'),
    );
    expect(() => nextButton([], 1)).toThrow(new RangeError('Need at least 2 seats with chips'));
    expect(nextButton(seatsOf([5, 0, 0, 9]), 4)).toBe(1);
    expect(nextButton(seatsOf([5, 0, 0, 9]), 1)).toBe(4);
    expect(nextButton(seatsOf([5, 7, 0, 9]), 3)).toBe(4);
    expect(nextButton([...seatsOf([5, 7, 0, 9])].reverse(), 2)).toBe(4);
  });

  it('all small-stack deals play out with clean invariants', () => {
    let i = 0;
    let atDeal = 0;
    let shortBigBlind = 0;
    for (const n of [2, 3]) {
      for (const stacks of combinations([1, 2, 3, 4, 5, 9], n)) {
        for (let button = 1; button <= n; button++) {
          i++;
          const code = handReplayCode(1, i);
          const label = `stacks ${stacks.join(',')} button ${button}`;
          let state = createHand({
            stakes: STAKES,
            seats: seatsOf(stacks),
            button,
            deck: shuffledDeck(code),
          });
          expect(checkDeal(state), label).toEqual([]);
          expect(state.toAct === null, label).toBe(state.result !== null);
          if (state.result !== null) atDeal++;
          const bb = state.actions.find((a) => a.type === 'big-blind');
          if (bb !== undefined && bb.added < bb.amount) shortBigBlind++;
          const policies = new Map(
            stacks.map((_, s) => [s + 1, randomMovePolicy(seatGenerator(code, s + 1))]),
          );
          while (state.toAct !== null) {
            const policy = policies.get(state.toAct);
            if (policy === undefined) throw new Error(label);
            const action = policy(playerView(state, state.toAct));
            const result = applyAction(state, action);
            expect(checkStep({ before: state, action, result }), label).toEqual([]);
            if (!result.ok) throw new Error(`${label}: ${result.error.message}`);
            state = result.state;
          }
          const total = state.players.reduce((sum, p) => sum + p.stack, 0);
          expect(total, label).toBe(stacks.reduce((sum, s) => sum + s, 0));
        }
      }
    }
    expect(i).toBe(6 * 6 * 2 + 6 * 6 * 6 * 3);
    expect(atDeal).toBeGreaterThan(0);
    expect(shortBigBlind).toBeGreaterThan(0);
  });
});
