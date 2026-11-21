import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type ApplyResult,
  type HandResult,
  type HandState,
  type PlayerState,
  type SeatNumber,
} from '../../src/engine/hand';
import { checkState, checkStep, type ActionStep } from '../../src/engine/invariants';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);

type Step = [SeatNumber, Action['type'], number?];

function newHand(stacks: Record<number, number>): HandState {
  return createHand({
    stakes: STAKES,
    seats: Object.entries(stacks).map(([seat, stack]) => ({ seat: Number(seat), stack })),
    button: 1,
    deck: DECK,
  });
}

const toAction = ([seat, type, amount]: Step): Action =>
  (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;

function act(state: HandState, step: Step): HandState {
  const result = applyAction(state, toAction(step));
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

const play = (state: HandState, ...steps: Step[]): HandState => steps.reduce(act, state);

const withPlayers = (
  state: HandState,
  patches: Record<number, Partial<PlayerState>>,
): HandState => ({
  ...state,
  players: state.players.map((p) => ({ ...p, ...patches[p.seat] })),
});

/** The completed `state` with its result replaced by `result`. */
const withResult = (state: HandState, result: HandResult): HandState => ({ ...state, result });

const stepOf = (before: HandState, step: Step): ActionStep => ({
  before,
  action: toAction(step),
  result: applyAction(before, toAction(step)),
});

const forged = (state: HandState): ApplyResult => ({ ok: true, state });

const SIX = { 1: 160, 2: 160, 3: 160, 4: 160, 5: 160, 6: 160 };

describe('all-in invariants acceptance', () => {
  it('legal-action and chips accept an all-in call and catch a wrong amount', () => {
    const before = play(
      newHand({ 1: 160, 2: 160, 3: 7 }),
      [1, 'call', 4],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'bet', 4],
    );
    const good = stepOf(before, [3, 'call', 3]);
    expect(checkStep(good)).toEqual([]);

    expect(checkStep(stepOf(before, [3, 'call', 4]))).toEqual([
      { invariant: 'legal-action', message: 'engine rejected seat 3 calls $4 (illegal-action)' },
    ]);

    const real = (good.result as { ok: true; state: HandState }).state;
    const patched = withPlayers(real, {
      3: { stack: -1, streetContribution: 4, totalContribution: 8 },
    });
    const last = real.actions.at(-1) as HandState['actions'][number];
    const wrong: HandState = {
      ...patched,
      actions: [...real.actions.slice(0, -1), { ...last, amount: 4, added: 4 }],
    };
    expect(
      checkStep({ before, action: { seat: 3, type: 'call', amount: 4 }, result: forged(wrong) }),
    ).toEqual([
      { invariant: 'chips', message: 'seat 3 has an invalid stack or contribution' },
      { invariant: 'legal-action', message: 'seat 3 calls $4 is not in the legal set' },
    ]);
  });

  it('chips accepts a returned uncalled bet and catches a wrong return', () => {
    const before = play(
      newHand({ 1: 160, 2: 160, 3: 9 }),
      [1, 'fold'],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'check'],
      [3, 'check'],
      [2, 'bet', 8],
    );
    const action: Action = { seat: 3, type: 'call', amount: 5 };
    const step = stepOf(before, [3, 'call', 5]);
    expect(checkStep(step)).toEqual([]);
    const done = (step.result as { ok: true; state: HandState }).state;
    const result = done.result as HandResult;
    const check = (state: HandState) => checkStep({ before, action, result: forged(state) });

    const walkBefore = play(newHand(SIX), [4, 'fold'], [5, 'fold'], [6, 'fold'], [1, 'fold']);
    expect(checkStep(stepOf(walkBefore, [2, 'fold']))).toEqual([]);
    const flopBefore = play(
      newHand(SIX),
      [4, 'call', 4],
      [5, 'call', 4],
      [6, 'call', 4],
      [1, 'call', 4],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'bet', 4],
      [3, 'fold'],
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
    );
    expect(checkStep(stepOf(flopBefore, [1, 'fold']))).toEqual([]);

    const tooMuch = withResult(withPlayers(done, { 2: { stack: 152 }, 3: { stack: 17 } }), {
      ...result,
      returned: { seat: 2, amount: 4 },
      awards: [{ pot: 0, amount: 17, winners: [{ seat: 3, amount: 17 }] }],
    });
    expect(check(tooMuch)).toEqual([
      { invariant: 'chips', message: 'seat 2 got $4 back but $3 was uncalled' },
    ]);

    const none = withResult(withPlayers(done, { 2: { stack: 148 }, 3: { stack: 21 } }), {
      endedBy: result.endedBy,
      showdown: result.showdown,
      awards: [{ pot: 0, amount: 21, winners: [{ seat: 3, amount: 21 }] }],
    });
    expect(check(none)).toEqual([
      { invariant: 'chips', message: 'seat 2 got $0 back but $3 was uncalled' },
    ]);

    expect(check(withPlayers(done, { 2: { stack: 148 } }))).toEqual([
      { invariant: 'chips', message: 'table holds $326 but the hand started with $329' },
    ]);

    expect(checkState(done)).toEqual([]);
  });
});
