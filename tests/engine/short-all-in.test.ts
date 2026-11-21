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
import { checkState, checkStep } from '../../src/engine/invariants';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ODD = { smallBlind: 1, bigBlind: 2, smallBet: 5, bigBet: 10 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);

type Step = [SeatNumber, Action['type'], number?];
type Legal = [Action['type'], number?][];

const SIX = { 1: 160, 2: 160, 3: 160, 4: 160, 5: 160, 6: 160 };
const LIMP_6: Step[] = [
  [4, 'call', 4],
  [5, 'call', 4],
  [6, 'call', 4],
  [1, 'call', 4],
  [2, 'call', 2],
  [3, 'check'],
];
const CHECK_FLOP_6: Step[] = [
  [2, 'check'],
  [3, 'check'],
  [4, 'check'],
  [5, 'check'],
  [6, 'check'],
  [1, 'check'],
];

function newHand(stacks: Record<number, number>, stakes: Stakes = STAKES): HandState {
  return createHand({
    stakes,
    seats: Object.entries(stacks).map(([seat, stack]) => ({ seat: Number(seat), stack })),
    button: 1,
    deck: DECK,
  });
}

/** Applies each step, asserting the invariant checker finds nothing wrong with it. */
function play(state: HandState, ...steps: Step[]): HandState {
  return steps.reduce((before, [seat, type, amount]) => {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(before, action);
    expect(checkStep({ before, action, result })).toEqual([]);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    return result.state;
  }, state);
}

/** Asserts the seat to act and its exact legal set. */
function expectLegal(state: HandState, seat: SeatNumber, legal: Legal): void {
  expect(state.toAct).toBe(seat);
  expect(legalActions(state)).toEqual(
    legal.map(([type, amount]) => (amount === undefined ? { seat, type } : { seat, type, amount })),
  );
}

const flop = (short: Record<number, number>): HandState =>
  play(newHand({ ...SIX, ...short }), ...LIMP_6);

describe('short all-in rule', () => {
  it('short all-in bets count at half a bet and can be completed under half', () => {
    const half = play(flop({ 4: 7 }), [2, 'check'], [3, 'check'], [4, 'bet', 3]);
    expect(half.betCount).toBe(1);
    expect(half.currentBet).toBe(3);
    expectLegal(half, 5, [['fold'], ['call', 3], ['raise', 7]]);
    const halfBack = play(half, [5, 'call', 3], [6, 'call', 3], [1, 'call', 3]);
    expectLegal(halfBack, 2, [['fold'], ['call', 3], ['raise', 7]]);

    const checked = play(flop({ 4: 5 }), [2, 'check'], [3, 'check']);
    expectLegal(checked, 4, [['check'], ['bet', 1]]);
    const tiny = play(checked, [4, 'bet', 1]);
    expect(tiny.betCount).toBe(0);
    expect(tiny.currentBet).toBe(1);
    expectLegal(tiny, 5, [['fold'], ['call', 1], ['raise', 4]]);

    const called = play(tiny, [5, 'call', 1], [6, 'call', 1], [1, 'call', 1]);
    expectLegal(called, 2, [['fold'], ['call', 1]]);
    expectLegal(play(called, [2, 'call', 1]), 3, [['fold'], ['call', 1]]);

    const completed = play(tiny, [5, 'raise', 4]);
    expect(completed.betCount).toBe(1);
    expect(completed.currentBet).toBe(4);
    expectLegal(completed, 6, [['fold'], ['call', 4], ['raise', 8]]);
    expectLegal(play(completed, [6, 'call', 4], [1, 'call', 4]), 2, [
      ['fold'],
      ['call', 4],
      ['raise', 8],
    ]);
  });

  it('two short all-ins that together reach half a bet count as a raise', () => {
    const short = play(flop({ 3: 9, 4: 10 }), [2, 'bet', 4], [3, 'raise', 5]);
    expect(short.betCount).toBe(1);
    expectLegal(short, 4, [['fold'], ['call', 5], ['raise', 6]]);
    const counted = play(short, [4, 'raise', 6]);
    expect(counted.betCount).toBe(2);
    expect(counted.currentBet).toBe(6);
    expectLegal(counted, 5, [['fold'], ['call', 6], ['raise', 10]]);
    expectLegal(play(counted, [5, 'call', 6], [6, 'call', 6], [1, 'call', 6]), 2, [
      ['fold'],
      ['call', 2],
      ['raise', 10],
    ]);
  });

  it('half a bet is measured as twice the increment against the unit on every street', () => {
    const turn = (stack: number): HandState =>
      play(
        newHand({ ...SIX, 4: stack }),
        ...LIMP_6,
        ...CHECK_FLOP_6,
        [2, 'bet', 8],
        [3, 'call', 8],
      );

    const under = turn(15);
    expect(under.street).toBe('turn');
    expectLegal(under, 4, [['fold'], ['call', 8], ['raise', 11]]);
    const underRaised = play(under, [4, 'raise', 11]);
    expect(underRaised.betCount).toBe(1);
    expectLegal(underRaised, 5, [['fold'], ['call', 11], ['raise', 16]]);
    expectLegal(play(underRaised, [5, 'call', 11], [6, 'call', 11], [1, 'call', 11]), 2, [
      ['fold'],
      ['call', 3],
    ]);

    const atHalf = turn(16);
    expectLegal(atHalf, 4, [['fold'], ['call', 8], ['raise', 12]]);
    const halfRaised = play(atHalf, [4, 'raise', 12]);
    expect(halfRaised.betCount).toBe(2);
    expectLegal(halfRaised, 5, [['fold'], ['call', 12], ['raise', 20]]);
    expectLegal(play(halfRaised, [5, 'call', 12], [6, 'call', 12], [1, 'call', 12]), 2, [
      ['fold'],
      ['call', 4],
      ['raise', 20],
    ]);

    const odd = (stack: number): HandState =>
      play(
        newHand({ 1: 160, 2: 160, 3: stack }, ODD),
        [1, 'call', 2],
        [2, 'call', 1],
        [3, 'check'],
        [2, 'bet', 5],
      );

    const oddUnder = odd(9);
    expectLegal(oddUnder, 3, [['fold'], ['call', 5], ['raise', 7]]);
    const oddUnderRaised = play(oddUnder, [3, 'raise', 7]);
    expect(oddUnderRaised.betCount).toBe(1);
    expectLegal(oddUnderRaised, 1, [['fold'], ['call', 7], ['raise', 10]]);
    expectLegal(play(oddUnderRaised, [1, 'call', 7]), 2, [['fold'], ['call', 2]]);

    const oddOver = play(odd(10), [3, 'raise', 8]);
    expect(oddOver.betCount).toBe(2);
    expectLegal(oddOver, 1, [['fold'], ['call', 8], ['raise', 13]]);
    expectLegal(play(oddOver, [1, 'call', 8]), 2, [['fold'], ['call', 3], ['raise', 13]]);
  });

  it('blinds may raise over a short preflop all-in and an uncounted all-in leaves room for the fourth bet', () => {
    const preflop = newHand({ ...SIX, 4: 5 });
    expectLegal(preflop, 4, [['fold'], ['call', 4], ['raise', 5]]);
    const short = play(preflop, [4, 'raise', 5]);
    expect(short.betCount).toBe(1);
    expect(short.currentBet).toBe(5);
    expectLegal(short, 5, [['fold'], ['call', 5], ['raise', 8]]);
    const toSb = play(short, [5, 'call', 5], [6, 'call', 5], [1, 'call', 5]);
    expectLegal(toSb, 2, [['fold'], ['call', 3], ['raise', 8]]);
    expectLegal(play(toSb, [2, 'call', 3]), 3, [['fold'], ['call', 1], ['raise', 8]]);

    const three = play(flop({ 5: 17 }), [2, 'bet', 4], [3, 'raise', 8], [4, 'raise', 12]);
    expect(three.betCount).toBe(3);
    expectLegal(three, 5, [['fold'], ['call', 12], ['raise', 13]]);
    const short13 = play(three, [5, 'raise', 13]);
    expect(short13.betCount).toBe(3);
    expect(short13.currentBet).toBe(13);
    expectLegal(short13, 6, [['fold'], ['call', 13], ['raise', 16]]);
    const capped = play(short13, [6, 'raise', 16]);
    expect(capped.betCount).toBe(4);
    expectLegal(capped, 1, [['fold'], ['call', 16]]);
  });

  it('the invariant checker accepts short all-ins and does not count them toward the cap', () => {
    // Every `play` step above and below asserts checkStep returns []; replay the acceptance scripts here.
    play(flop({ 4: 9 }), [2, 'bet', 4], [3, 'call', 4], [4, 'raise', 5], [5, 'call', 5]);
    play(
      flop({ 4: 9 }),
      [2, 'bet', 4],
      [3, 'call', 4],
      [4, 'raise', 5],
      [5, 'call', 5],
      [6, 'call', 5],
      [1, 'call', 5],
      [2, 'call', 1],
      [3, 'call', 1],
    );
    play(
      flop({ 4: 10 }),
      [2, 'bet', 4],
      [3, 'call', 4],
      [4, 'raise', 6],
      [5, 'call', 6],
      [6, 'call', 6],
      [1, 'call', 6],
      [2, 'raise', 10],
    );
    play(
      flop({ 4: 14 }),
      [2, 'bet', 4],
      [3, 'raise', 8],
      [4, 'raise', 10],
      [5, 'raise', 14],
      [6, 'call', 14],
      [1, 'call', 14],
      [2, 'call', 10],
      [3, 'call', 6],
    );
    play(flop({ 3: 9 }), [2, 'bet', 4], [3, 'raise', 5], [4, 'raise', 8]);
    play(flop({ 4: 7 }), [2, 'check'], [3, 'check'], [4, 'bet', 3]);
    play(flop({ 4: 8 }), [2, 'bet', 4], [3, 'call', 4], [4, 'call', 4]);
    play(
      newHand({ ...SIX, 4: 5 }),
      [4, 'raise', 5],
      [5, 'call', 5],
      [6, 'call', 5],
      [1, 'call', 5],
      [2, 'call', 3],
      [3, 'raise', 8],
    );

    const capped = play(
      flop({ 5: 17 }),
      [2, 'bet', 4],
      [3, 'raise', 8],
      [4, 'raise', 12],
      [5, 'raise', 13],
      [6, 'raise', 16],
    );
    const flopAggression = capped.actions.filter(
      (a) => a.street === 'flop' && (a.type === 'bet' || a.type === 'raise'),
    );
    expect(flopAggression.map((a) => a.amount)).toEqual([4, 8, 12, 13, 16]);
    expect(capped.betCount).toBe(4);
    expect(checkState(capped)).toEqual([]);
    const fifth: HandState = {
      ...capped,
      actions: [
        ...capped.actions,
        { street: 'flop', seat: 1, type: 'raise', amount: 20, added: 0 },
      ],
    };
    expect(checkState(fifth)).toEqual([
      { invariant: 'bet-cap', message: 'flop has 5 bets (at most 4)' },
    ]);
  });
});
