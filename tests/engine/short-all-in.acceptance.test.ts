import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type PlayerState,
  type SeatNumber,
} from '../../src/engine/hand';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);

type Step = [SeatNumber, Action['type'], number?];

const SIX = { 1: 160, 2: 160, 3: 160, 4: 160, 5: 160, 6: 160 };
const LIMP_6: Step[] = [
  [4, 'call', 4],
  [5, 'call', 4],
  [6, 'call', 4],
  [1, 'call', 4],
  [2, 'call', 2],
  [3, 'check'],
];

function newHand(stacks: Record<number, number>): HandState {
  return createHand({
    stakes: STAKES,
    seats: Object.entries(stacks).map(([seat, stack]) => ({ seat: Number(seat), stack })),
    button: 1,
    deck: DECK,
  });
}

function apply(state: HandState, [seat, type, amount]: Step): HandState {
  const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

const play = (state: HandState, ...steps: Step[]): HandState => steps.reduce(apply, state);

const playerAt = (state: HandState, seat: SeatNumber): PlayerState =>
  state.players.find((p) => p.seat === seat) as PlayerState;

/** Six seats, button 1, $160 stacks except `short`; every seat limps preflop, so the flop opens at seat 2. */
const flop = (short: Record<number, number>): HandState =>
  play(newHand({ ...SIX, ...short }), ...LIMP_6);

function expectIllegal(state: HandState, action: Action): void {
  const before = structuredClone(state);
  const result = applyAction(state, action);
  expect(result.ok).toBe(false);
  expect(!result.ok && result.error.code).toBe('illegal-action');
  expect(state).toEqual(before);
}

describe('short all-in acceptance', () => {
  it('AC#1 an all-in raise to $5 over a $4 bet lets seat 2 only call $1 or fold', () => {
    const facing = play(flop({ 4: 9 }), [2, 'bet', 4], [3, 'call', 4]);
    expect(playerAt(facing, 4).stack).toBe(5);
    expect(legalActions(facing)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 4 },
      { seat: 4, type: 'raise', amount: 5 },
    ]);
    const short = play(facing, [4, 'raise', 5]);
    expect(playerAt(short, 4)).toMatchObject({ stack: 0, allIn: true });
    expect(short.betCount).toBe(1);
    expect(legalActions(short)).toEqual([
      { seat: 5, type: 'fold' },
      { seat: 5, type: 'call', amount: 5 },
      { seat: 5, type: 'raise', amount: 8 },
    ]);
    const back = play(short, [5, 'call', 5], [6, 'call', 5], [1, 'call', 5]);
    expect(back.toAct).toBe(2);
    expect(back.currentBet).toBe(5);
    expect(back.betCount).toBe(1);
    expect(legalActions(back)).toEqual([
      { seat: 2, type: 'fold' },
      { seat: 2, type: 'call', amount: 1 },
    ]);
    expectIllegal(back, { seat: 2, type: 'raise', amount: 9 });
    expectIllegal(back, { seat: 2, type: 'raise', amount: 8 });
    const seat3 = play(back, [2, 'call', 1]);
    expect(legalActions(seat3)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 1 },
    ]);
    const turn = play(seat3, [3, 'call', 1]);
    expect(turn.street).toBe('turn');
    expect(turn.toAct).toBe(2);
    expect(turn.betCount).toBe(0);
    expect(turn.pots).toEqual([{ amount: 54, eligible: [1, 2, 3, 4, 5, 6] }]);
  });

  it('AC#2 an all-in raise to $6 over a $4 bet lets seat 2 call, fold or raise to $10', () => {
    const raised = play(flop({ 4: 10 }), [2, 'bet', 4], [3, 'call', 4], [4, 'raise', 6]);
    expect(raised.betCount).toBe(2);
    expect(raised.currentBet).toBe(6);
    expect(playerAt(raised, 2).hasActed).toBe(false);
    expect(playerAt(raised, 3).hasActed).toBe(false);
    expect(legalActions(raised)).toEqual([
      { seat: 5, type: 'fold' },
      { seat: 5, type: 'call', amount: 6 },
      { seat: 5, type: 'raise', amount: 10 },
    ]);
    const back = play(raised, [5, 'call', 6], [6, 'call', 6], [1, 'call', 6]);
    expect(back.toAct).toBe(2);
    expect(back.betCount).toBe(2);
    expect(back.currentBet).toBe(6);
    expect(legalActions(back)).toEqual([
      { seat: 2, type: 'fold' },
      { seat: 2, type: 'call', amount: 2 },
      { seat: 2, type: 'raise', amount: 10 },
    ]);
    const reraised = play(back, [2, 'raise', 10]);
    expect(reraised.betCount).toBe(3);
    expect(reraised.currentBet).toBe(10);
    expect(legalActions(reraised)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 6 },
      { seat: 3, type: 'raise', amount: 14 },
    ]);
  });

  it('AC#3 a $10 all-in after a raise to $8 is the third bet, so after a raise to $14 seat 6 may only call $14 or fold', () => {
    const bet = play(flop({ 4: 14 }), [2, 'bet', 4]);
    expect(legalActions(bet)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 4 },
      { seat: 3, type: 'raise', amount: 8 },
    ]);
    const raised = play(bet, [3, 'raise', 8]);
    expect(raised.betCount).toBe(2);
    expect(legalActions(raised)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 8 },
      { seat: 4, type: 'raise', amount: 10 },
    ]);
    const allIn = play(raised, [4, 'raise', 10]);
    expect(allIn.betCount).toBe(3);
    expect(playerAt(allIn, 4).allIn).toBe(true);
    expect(legalActions(allIn)).toEqual([
      { seat: 5, type: 'fold' },
      { seat: 5, type: 'call', amount: 10 },
      { seat: 5, type: 'raise', amount: 14 },
    ]);
    const capped = play(allIn, [5, 'raise', 14]);
    expect(capped.betCount).toBe(4);
    expect(capped.toAct).toBe(6);
    expect(legalActions(capped)).toEqual([
      { seat: 6, type: 'fold' },
      { seat: 6, type: 'call', amount: 14 },
    ]);
    expectIllegal(capped, { seat: 6, type: 'raise', amount: 18 });
    const closed = play(capped, [6, 'call', 14], [1, 'call', 14], [2, 'call', 10], [3, 'call', 6]);
    expect(closed.street).toBe('turn');
    const flopAggression = closed.actions
      .filter((a) => a.street === 'flop' && (a.type === 'bet' || a.type === 'raise'))
      .map((a) => a.amount);
    expect(flopAggression).toEqual([4, 8, 10, 14]);
  });

  it('AC#4 seat 4, not yet acted, may fold, call $5 or raise to $8 over a $5 all-in', () => {
    const short = play(flop({ 3: 9 }), [2, 'bet', 4], [3, 'raise', 5]);
    expect(short.toAct).toBe(4);
    expect(short.betCount).toBe(1);
    expect(short.currentBet).toBe(5);
    expect(playerAt(short, 3).allIn).toBe(true);
    expect(legalActions(short)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 5 },
      { seat: 4, type: 'raise', amount: 8 },
    ]);
    const raised = play(short, [4, 'raise', 8]);
    expect(raised.betCount).toBe(2);
    expect(raised.currentBet).toBe(8);
    expect(playerAt(raised, 2).hasActed).toBe(false);
  });

  it('AC#5 a $3 stack with no bet facing may check or bet all-in $3', () => {
    const checked = play(flop({ 4: 7 }), [2, 'check'], [3, 'check']);
    expect(legalActions(checked)).toEqual([
      { seat: 4, type: 'check' },
      { seat: 4, type: 'bet', amount: 3 },
    ]);
    expectIllegal(checked, { seat: 4, type: 'bet', amount: 4 });
    const bet = play(checked, [4, 'bet', 3]);
    expect(playerAt(bet, 4)).toMatchObject({ stack: 0, allIn: true });
    expect(bet.actions.at(-1)).toEqual({
      street: 'flop',
      seat: 4,
      type: 'bet',
      amount: 3,
      added: 3,
    });
  });

  it('AC#6 a $6 stack facing a $4 bet may fold, call $4 or raise all-in to $6, and a raise to $8 is illegal', () => {
    const facing = play(flop({ 4: 10 }), [2, 'bet', 4], [3, 'call', 4]);
    expect(legalActions(facing)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 4 },
      { seat: 4, type: 'raise', amount: 6 },
    ]);
    expectIllegal(facing, { seat: 4, type: 'raise', amount: 8 });
    const raised = play(facing, [4, 'raise', 6]);
    expect(playerAt(raised, 4)).toMatchObject({ stack: 0, allIn: true });
    expect(raised.actions.at(-1)).toEqual({
      street: 'flop',
      seat: 4,
      type: 'raise',
      amount: 6,
      added: 6,
    });
  });

  it('AC#7 a $4 stack facing a $4 bet may only fold or call $4 all-in', () => {
    const facing = play(flop({ 4: 8 }), [2, 'bet', 4], [3, 'call', 4]);
    expect(legalActions(facing)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 4 },
    ]);
    expectIllegal(facing, { seat: 4, type: 'raise', amount: 8 });
    expectIllegal(facing, { seat: 4, type: 'raise', amount: 4 });
    const called = play(facing, [4, 'call', 4]);
    expect(playerAt(called, 4)).toMatchObject({ stack: 0, allIn: true });
  });
});
