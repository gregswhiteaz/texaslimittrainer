import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  forceFold,
  legalActions,
  type Action,
  type HandState,
  type PlayerState,
  voidedBets,
} from '../../src/engine/hand';
import { checkDeal, checkState, checkStep } from '../../src/engine/invariants';
import { Xoshiro128 } from '../../src/engine/seeded-random';

// TASK-10.13 AC#3 (J-1-02): any number of forced folds in one hand, of any live seat that is not all-in,
// keep every invariant.

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const MAX_STEPS = 400;

/** As side-pots.property.test.ts: 2-10 seats, a random button, stacks uniform in $5..$192, then the deck. */
function dealHand(rng: Xoshiro128): { state: HandState; start: number } {
  const n = 2 + rng.nextInt(9);
  const button = 1 + rng.nextInt(n);
  const seats = Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: 5 + rng.nextInt(188) }));
  const words = [rng.nextUint32(), rng.nextUint32(), rng.nextUint32(), rng.nextUint32()];
  const state = createHand({
    stakes: STAKES,
    seats,
    button,
    deck: shuffledDeck(replayCodeFromWords(words)),
  });
  return { state, start: seats.reduce((sum, s) => sum + s.stack, 0) };
}

interface Outcome {
  readonly failure?: string;
  readonly topFolds: number;
}

function playOut(
  rng: Xoshiro128,
  afterForceFold?: (state: HandState) => string | undefined,
): Outcome {
  const dealt = dealHand(rng);
  let state = dealt.state;
  let topFolds = 0;
  const fail = (failure: string): Outcome => ({ failure, topFolds });
  const deal = checkDeal(state);
  if (deal.length > 0) return fail(`deal: ${JSON.stringify(deal)}`);
  for (let step = 0; state.result === null; step++) {
    if (step >= MAX_STEPS) return fail(`did not complete in ${MAX_STEPS} steps`);
    const actor = state.players.find((p) => p.seat === state.toAct);
    const legal = legalActions(state);
    if (
      actor === undefined ||
      legal.length === 0 ||
      (actor.hasActed && actor.streetContribution >= state.currentBet)
    ) {
      return fail(`step ${step}: seat ${state.toAct ?? 'none'} is to act but has nothing to do`);
    }
    const candidates = state.players.filter((p) => !p.folded && !p.allIn);
    if (rng.nextInt(5) === 0 && candidates.length > 0) {
      const leaver = candidates[rng.nextInt(candidates.length)] as PlayerState;
      const live = state.players
        .filter((p) => !p.folded && p.seat !== leaver.seat)
        .map((p) => p.streetContribution);
      const floor = state.street === 'preflop' ? STAKES.bigBlind : 0;
      if (leaver.streetContribution > Math.max(floor, ...live)) topFolds++;
      state = forceFold(state, leaver.seat);
      const violations = checkState(state);
      if (violations.length > 0) {
        return fail(`step ${step}: forceFold(${leaver.seat}): ${JSON.stringify(violations)}`);
      }
      const mismatch = afterForceFold?.(state);
      if (mismatch !== undefined)
        return fail(`step ${step}: forceFold(${leaver.seat}): ${mismatch}`);
      continue;
    }
    const action = legal[rng.nextInt(legal.length)] as Action;
    const result = applyAction(state, action);
    const violations = checkStep({ before: state, action, result });
    if (violations.length > 0) return fail(`step ${step}: ${JSON.stringify(violations)}`);
    if (!result.ok) return fail(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  const end = checkDeal(state);
  if (end.length > 0) return fail(`end: ${JSON.stringify(end)}`);
  const total = state.players.reduce((sum, p) => sum + p.stack, 0);
  if (total !== dealt.start)
    return fail(`table ends with $${total} but started with $${dealt.start}`);
  const folded = new Set(state.players.filter((p) => p.folded).map((p) => p.seat));
  const paid = state.result.awards.flatMap((a) => a.winners.map((w) => w.seat));
  const returned = state.result.returned?.seat;
  if (paid.some((s) => folded.has(s)) || (returned !== undefined && folded.has(returned))) {
    return fail('a folded seat was paid or given chips back');
  }
  return { topFolds };
}

describe('forced-fold property', () => {
  it('several forced folds in one hand keep every invariant', () => {
    const rng = new Xoshiro128(0x10d13);
    let topFolds = 0;
    for (let h = 0; h < 2000; h++) {
      const outcome = playOut(rng);
      if (outcome.failure !== undefined) expect.fail(`hand ${h}: ${outcome.failure}`);
      topFolds += outcome.topFolds;
    }
    expect(topFolds).toBeGreaterThanOrEqual(200);
  });

  // TASK-10.18: advice's view of voided raises matches the engine's amount to match.
  it("voidedBets agrees with the engine's amount to match after every forced fold", () => {
    const rng = new Xoshiro128(0x10d18);
    let voids = 0;
    const check = (state: HandState): string | undefined => {
      if (state.result !== null) return undefined;
      const voided = voidedBets(state);
      for (const i of voided) {
        const a = state.actions[i];
        if (
          a === undefined ||
          a.street !== state.street ||
          (a.type !== 'bet' && a.type !== 'raise')
        ) {
          return `voided index ${i} is not a same-street bet or raise`;
        }
      }
      voids += voided.size;
      const missed = state.actions.findIndex(
        (a, i) =>
          a.street === state.street &&
          (a.type === 'bet' || a.type === 'raise') &&
          a.amount > state.currentBet &&
          !voided.has(i),
      );
      return missed === -1
        ? undefined
        : `record ${missed} is above currentBet ${state.currentBet} but not voided`;
    };
    for (let h = 0; h < 2000; h++) {
      const outcome = playOut(rng, check);
      if (outcome.failure !== undefined) expect.fail(`hand ${h}: ${outcome.failure}`);
    }
    expect(voids).toBeGreaterThan(0);
  });
});
