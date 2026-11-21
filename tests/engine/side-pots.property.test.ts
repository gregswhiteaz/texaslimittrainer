import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
} from '../../src/engine/hand';
import { checkStep } from '../../src/engine/invariants';
import { Xoshiro128 } from '../../src/engine/seeded-random';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const MAX_ACTIONS = 400;

/** A-4: 2-10 seats, a random button, stacks uniform in $5..$192, then the deck. */
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

/** A-4: uniform among legal actions, without bet/raise once the street has 4 bets. */
function choose(rng: Xoshiro128, state: HandState, legal: readonly Action[]): Action {
  const allowed =
    state.betCount >= 4 ? legal.filter((a) => a.type !== 'bet' && a.type !== 'raise') : legal;
  return allowed[rng.nextInt(allowed.length)] as Action;
}

/** Returns a failure description, or the completed hand. */
function playOut(rng: Xoshiro128): string | HandState {
  const dealt = dealHand(rng);
  let state = dealt.state;
  for (let count = 0; state.result === null; count++) {
    if (count >= MAX_ACTIONS) return `did not complete in ${MAX_ACTIONS} actions`;
    const action = choose(rng, state, legalActions(state));
    const result = applyAction(state, action);
    const violations = checkStep({ before: state, action, result });
    if (violations.length > 0) return `action ${count + 1}: ${JSON.stringify(violations)}`;
    if (!result.ok) return `${result.error.code}: ${result.error.message}`;
    state = result.state;
  }
  const end = state.players.reduce((sum, p) => sum + p.stack, 0);
  if (end !== dealt.start) return `table ends with $${end} but started with $${dealt.start}`;
  return state;
}

describe('side-pot property', () => {
  it('AC#5 100,000 random-stack hands keep the table total and pass every invariant', () => {
    const rng = new Xoshiro128(20261120);
    let twoPots = 0;
    let threePots = 0;
    for (let h = 0; h < 100_000; h++) {
      const outcome = playOut(rng);
      if (typeof outcome === 'string') expect.fail(`hand ${h}: ${outcome}`);
      const awards = outcome.result?.awards.length ?? 0;
      if (awards >= 2) twoPots++;
      if (awards >= 3) threePots++;
    }
    expect(twoPots).toBeGreaterThanOrEqual(1000);
    expect(threePots).toBeGreaterThanOrEqual(100);
  }, 300_000);
});
