import { describe, expect, it } from 'vitest';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type PlayerState,
  type SeatNumber,
} from '../../src/engine/hand';
import { evaluate } from '../../src/engine/hand-evaluator';
import { checkState } from '../../src/engine/invariants';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);
const BOARD = parseCards('3s 4c 4d 4s 5d');
const BURNED = parseCards('3h 4h 5c');

type Step = [SeatNumber, Action['type'], number?];

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

/** Every state from `state` through each step, in order. */
function trace(state: HandState, ...steps: Step[]): HandState[] {
  const states = [state];
  for (const step of steps) states.push(apply(states[states.length - 1] as HandState, step));
  return states;
}

const play = (state: HandState, ...steps: Step[]): HandState =>
  trace(state, ...steps).at(-1) as HandState;

const playerAt = (state: HandState, seat: SeatNumber): PlayerState =>
  state.players.find((p) => p.seat === seat) as PlayerState;

const stacks = (state: HandState): Record<number, number> =>
  Object.fromEntries(state.players.map((p) => [p.seat, p.stack]));

/** S-A up to seat 3 facing seat 2's $4 flop bet with $3 behind. */
const S_A_FACING = (): HandState =>
  play(
    newHand({ 1: 160, 2: 160, 3: 7 }),
    [1, 'call', 4],
    [2, 'call', 2],
    [3, 'check'],
    [2, 'bet', 4],
  );

/** S-B up to seat 3 facing seat 2's $8 turn bet with $5 behind. */
const S_B_FACING = (stack2 = 160): HandState =>
  play(
    newHand({ 1: 160, 2: stack2, 3: 9 }),
    [1, 'fold'],
    [2, 'call', 2],
    [3, 'check'],
    [2, 'check'],
    [3, 'check'],
    [2, 'bet', 8],
  );

const SIX = { 1: 160, 2: 160, 3: 160, 4: 160, 5: 160, 6: 160 };
const LIMP_6: Step[] = [
  [4, 'call', 4],
  [5, 'call', 4],
  [6, 'call', 4],
  [1, 'call', 4],
  [2, 'call', 2],
  [3, 'check'],
];

describe('all-in acceptance', () => {
  it('a seat with $3 facing a $4 bet may only fold or call $3', () => {
    const facing = S_A_FACING();
    expect(facing.toAct).toBe(3);
    expect(playerAt(facing, 3).stack).toBe(3);
    expect(legalActions(facing)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 3 },
    ]);
    const rejected = applyAction(facing, { seat: 3, type: 'call', amount: 4 });
    expect(rejected.ok).toBe(false);
    expect(!rejected.ok && rejected.error.code).toBe('illegal-action');
  });

  it('the all-in caller puts in $3, is marked all-in and is never asked to act again', () => {
    const called = apply(S_A_FACING(), [3, 'call', 3]);
    expect(playerAt(called, 3)).toMatchObject({
      stack: 0,
      allIn: true,
      streetContribution: 3,
      totalContribution: 7,
    });
    expect(called.actions.at(-1)).toEqual({
      street: 'flop',
      seat: 3,
      type: 'call',
      amount: 3,
      added: 3,
    });
    expect(called.toAct).toBe(1);

    const states = trace(
      called,
      [1, 'call', 4],
      [2, 'check'],
      [1, 'check'],
      [2, 'check'],
      [1, 'check'],
    );
    expect(states[1]?.street).toBe('turn');
    expect(states[1]?.toAct).toBe(2);
    for (const state of states) expect(state.toAct).not.toBe(3);
    const end = states.at(-1) as HandState;
    const callIndex = called.actions.length - 1;
    expect(end.actions.slice(callIndex + 1).filter((a) => a.seat === 3)).toEqual([]);
    expect(end.result?.endedBy).toBe('showdown');
  });

  it('an all-in player who has not folded is included in the showdown', () => {
    const end = play(
      S_A_FACING(),
      [3, 'call', 3],
      [1, 'call', 4],
      [2, 'check'],
      [1, 'check'],
      [2, 'check'],
      [1, 'check'],
    );
    expect(end.result?.endedBy).toBe('showdown');
    const showdown = end.result?.showdown ?? [];
    expect(showdown.map((s) => s.seat)).toEqual([2, 3, 1]);
    const seat3 = showdown.find((s) => s.seat === 3);
    expect(seat3?.holeCards).toEqual(parseCards('2d 3c'));
    expect(seat3?.rank).toBe(evaluate([...parseCards('2d 3c'), ...end.board]));
  });

  it('when all but one remaining player are all-in the rest of the board is dealt with no betting', () => {
    const facing = S_B_FACING();
    expect(facing.street).toBe('turn');
    expect(legalActions(facing)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 5 },
    ]);
    const end = apply(facing, [3, 'call', 5]);
    expect(end.street).toBe('showdown');
    expect(end.board).toEqual(BOARD);
    expect(end.burned).toEqual(BURNED);
    expect(end.toAct).toBeNull();
    expect(end.currentBet).toBe(0);
    expect(end.betCount).toBe(0);
    expect(legalActions(end)).toEqual([]);
    expect(end.actions.filter((a) => a.street === 'river')).toEqual([]);
    expect(checkState(end)).toEqual([]);
  });

  it('the board also runs out from preflop and when no player can still bet', () => {
    const bothAllIn = S_B_FACING(12);
    expect(playerAt(bothAllIn, 2)).toMatchObject({ stack: 0, allIn: true });
    expect(bothAllIn.toAct).toBe(3);
    const c = apply(bothAllIn, [3, 'call', 5]);
    expect(c.street).toBe('showdown');
    expect(c.board).toHaveLength(5);
    expect(c.result?.returned).toEqual({ seat: 2, amount: 3 });
    expect(c.result?.awards).toEqual([{ pot: 0, amount: 18, winners: [{ seat: 3, amount: 18 }] }]);
    expect(stacks(c)).toEqual({ 1: 160, 2: 3, 3: 18 });
    expect(checkState(c)).toEqual([]);

    const raised = play(newHand({ 1: 160, 2: 160, 3: 5 }), [1, 'raise', 8], [2, 'fold']);
    expect(legalActions(raised)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 1 },
    ]);
    const d = apply(raised, [3, 'call', 1]);
    expect(d.street).toBe('showdown');
    expect(d.board).toEqual(BOARD);
    expect(d.burned).toEqual(BURNED);
    expect(d.actions.filter((a) => a.street !== 'preflop')).toEqual([]);
    expect(d.result?.returned).toEqual({ seat: 1, amount: 3 });
    expect(d.result?.awards).toEqual([
      {
        pot: 0,
        amount: 12,
        winners: [
          { seat: 3, amount: 6 },
          { seat: 1, amount: 6 },
        ],
      },
    ]);
    expect(stacks(d)).toEqual({ 1: 161, 2: 158, 3: 6 });
    expect(checkState(d)).toEqual([]);
  });

  it('the uncalled $3 of an $8 bet called all-in for $5 is returned to the bettor', () => {
    const end = apply(S_B_FACING(), [3, 'call', 5]);
    expect(end.result?.endedBy).toBe('showdown');
    expect(end.result?.returned).toEqual({ seat: 2, amount: 3 });
    expect(end.result?.awards).toEqual([
      { pot: 0, amount: 18, winners: [{ seat: 3, amount: 18 }] },
    ]);
    const showdown = end.result?.showdown ?? [];
    const rankOf = (seat: SeatNumber) => showdown.find((s) => s.seat === seat)?.rank as number;
    expect(rankOf(3)).toBeGreaterThan(rankOf(2));
    expect(stacks(end)).toEqual({ 1: 160, 2: 151, 3: 18 });
    expect(end.players.reduce((sum, p) => sum + p.stack, 0)).toBe(329);
    expect(playerAt(end, 2).totalContribution).toBe(12);
    expect(playerAt(end, 3).totalContribution).toBe(9);
  });

  it('a bet that every other player folds to is returned and not counted as won', () => {
    const walk = play(
      newHand(SIX),
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'fold'],
      [2, 'fold'],
    );
    expect(walk.result?.returned).toEqual({ seat: 3, amount: 2 });
    expect(walk.result?.awards).toEqual([{ pot: 0, amount: 4, winners: [{ seat: 3, amount: 4 }] }]);
    expect(playerAt(walk, 3).stack).toBe(162);
    expect(checkState(walk)).toEqual([]);

    const flopBet = play(
      newHand(SIX),
      ...LIMP_6,
      [2, 'bet', 4],
      [3, 'fold'],
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'fold'],
    );
    expect(flopBet.result?.returned).toEqual({ seat: 2, amount: 4 });
    expect(flopBet.result?.awards).toEqual([
      { pot: 0, amount: 24, winners: [{ seat: 2, amount: 24 }] },
    ]);
    expect(playerAt(flopBet, 2).stack).toBe(180);
    expect(checkState(flopBet)).toEqual([]);

    const flopRaise = play(
      newHand(SIX),
      ...LIMP_6,
      [2, 'bet', 4],
      [3, 'raise', 8],
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'fold'],
      [2, 'fold'],
    );
    expect(flopRaise.result?.returned).toEqual({ seat: 3, amount: 4 });
    expect(flopRaise.result?.awards[0]?.amount).toBe(32);
    expect(checkState(flopRaise)).toEqual([]);
  });
});
