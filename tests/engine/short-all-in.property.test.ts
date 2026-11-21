import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type PlayerState,
} from '../../src/engine/hand';
import { checkStep } from '../../src/engine/invariants';
import { Xoshiro128 } from '../../src/engine/seeded-random';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const MAX_ACTIONS = 400;
const HANDS = 20_000;

/** A-5: 2-10 seats, a random button, stacks uniform in $5..$40, then the deck. */
function dealHand(rng: Xoshiro128): { state: HandState; start: number } {
  const n = 2 + rng.nextInt(9);
  const button = 1 + rng.nextInt(n);
  const seats = Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: 5 + rng.nextInt(36) }));
  const words = [rng.nextUint32(), rng.nextUint32(), rng.nextUint32(), rng.nextUint32()];
  const state = createHand({
    stakes: STAKES,
    seats,
    button,
    deck: shuffledDeck(replayCodeFromWords(words)),
  });
  return { state, start: seats.reduce((sum, s) => sum + s.stack, 0) };
}

const unitOf = (state: HandState): number =>
  state.street === 'preflop' || state.street === 'flop' ? STAKES.smallBet : STAKES.bigBet;

/** The street's full bet level, computed from the records as in spec §5. */
function levelOf(state: HandState): number {
  let level = 0;
  for (const a of state.actions) {
    if (a.street !== state.street) continue;
    if (a.type === 'big-blind') level = a.amount;
    else if ((a.type === 'bet' || a.type === 'raise') && 2 * (a.amount - level) >= unitOf(state)) {
      level = a.amount;
    }
  }
  return level;
}

const counters = { uncounted: 0, shortBets: 0, callOrFoldOnly: 0, completions: 0 };

/** Checks the legal set against the rule; returns a failure description or null. */
function legalSetMessage(state: HandState, legal: readonly Action[]): string | null {
  const player = state.players.find((p) => p.seat === state.toAct) as PlayerState;
  const owe = state.currentBet - player.streetContribution;
  const aggressive = legal.filter((a) => a.type === 'bet' || a.type === 'raise');
  if (player.hasActed && owe > 0) {
    if (aggressive.length > 0) return `seat ${player.seat} already acted but may bet/raise`;
    counters.callOrFoldOnly++;
  }
  if (player.stack <= owe && aggressive.length > 0) {
    return `seat ${player.seat} has $${player.stack} facing $${owe} but may bet/raise`;
  }
  const fullTo = levelOf(state) + unitOf(state);
  const allInTo = player.streetContribution + player.stack;
  for (const a of aggressive) {
    if (!('amount' in a) || (a.amount !== fullTo && a.amount !== allInTo)) {
      return `seat ${player.seat} offered ${JSON.stringify(a)}; full $${fullTo}, all-in $${allInTo}`;
    }
  }
  return null;
}

/** Returns a failure description, or null when the hand completed cleanly. */
function playOut(rng: Xoshiro128): string | null {
  const dealt = dealHand(rng);
  let state = dealt.state;
  for (let count = 0; state.result === null; count++) {
    if (count >= MAX_ACTIONS) return `did not complete in ${MAX_ACTIONS} actions`;
    const legal = legalActions(state);
    const problem = legalSetMessage(state, legal);
    if (problem !== null) return `action ${count + 1}: ${problem}`;
    const action = legal[rng.nextInt(legal.length)] as Action;
    const result = applyAction(state, action);
    const violations = checkStep({ before: state, action, result });
    if (violations.length > 0) return `action ${count + 1}: ${JSON.stringify(violations)}`;
    if (!result.ok) return `${result.error.code}: ${result.error.message}`;
    if (action.type === 'bet' || action.type === 'raise') {
      if (result.state.betCount === state.betCount) counters.uncounted++;
      if (action.type === 'bet' && action.amount < unitOf(state)) counters.shortBets++;
      if (action.type === 'raise' && state.betCount === 0) counters.completions++;
    }
    state = result.state;
    if (state.betCount > 4) return `betCount ${state.betCount} on ${state.street}`;
  }
  const end = state.players.reduce((sum, p) => sum + p.stack, 0);
  return end === dealt.start ? null : `table ends with $${end} but started with $${dealt.start}`;
}

describe('short all-in property', () => {
  it('20,000 random short-stack hands follow the half-bet rule and pass every invariant', () => {
    const rng = new Xoshiro128(20261121);
    for (let h = 0; h < HANDS; h++) {
      const failure = playOut(rng);
      if (failure !== null) expect.fail(`hand ${h}: ${failure}`);
    }
    expect(counters.uncounted).toBeGreaterThanOrEqual(1);
    expect(counters.shortBets).toBeGreaterThanOrEqual(1);
    expect(counters.callOrFoldOnly).toBeGreaterThanOrEqual(1);
    expect(counters.completions).toBeGreaterThanOrEqual(1);
  }, 60_000);
});
