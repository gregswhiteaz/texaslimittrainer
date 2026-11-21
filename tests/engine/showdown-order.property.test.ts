import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import { evaluate } from '../../src/engine/hand-evaluator';
import {
  applyAction,
  createHand,
  legalActions,
  splitPot,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { checkState } from '../../src/engine/invariants';
import { Xoshiro128 } from '../../src/engine/seeded-random';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const MAX_ACTIONS = 400;
const HANDS = 5_000;

/** 2-6 seats, a random button, stacks uniform in $5..$60, then the deck. */
function dealHand(rng: Xoshiro128): HandState {
  const n = 2 + rng.nextInt(5);
  const button = 1 + rng.nextInt(n);
  const seats = Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: 5 + rng.nextInt(56) }));
  const words = [rng.nextUint32(), rng.nextUint32(), rng.nextUint32(), rng.nextUint32()];
  return createHand({
    stakes: STAKES,
    seats,
    button,
    deck: shuffledDeck(replayCodeFromWords(words)),
  });
}

function playOut(rng: Xoshiro128): HandState {
  let state = dealHand(rng);
  for (let count = 0; state.result === null; count++) {
    if (count >= MAX_ACTIONS) throw new Error(`Hand did not complete in ${MAX_ACTIONS} actions`);
    const legal = legalActions(state);
    const applied = applyAction(state, legal[rng.nextInt(legal.length)] as Action);
    if (!applied.ok) throw new Error(`${applied.error.code}: ${applied.error.message}`);
    state = applied.state;
  }
  return state;
}

const counters = { multiPot: 0, mucks: 0, sideOnlyWins: 0 };

/** Checks a hand that ended at showdown; returns a failure description or null. */
function showdownMessage(end: HandState): string | null {
  const result = end.result;
  if (result === null) return 'hand not complete';
  const seats = end.players.map((p) => p.seat);
  const active = end.players.filter((p) => !p.folded);
  const clockwise = [
    ...active.filter((p) => p.seat > end.button),
    ...active.filter((p) => p.seat <= end.button),
  ];
  const lastAggressor = end.actions.findLast(
    (a) => a.street === 'river' && (a.type === 'bet' || a.type === 'raise'),
  )?.seat;
  const first = Math.max(
    0,
    clockwise.findIndex((p) => p.seat === lastAggressor),
  );
  const order = [...clockwise.slice(first), ...clockwise.slice(0, first)].map((p) => p.seat);
  const rank = new Map(
    active.map((p) => [p.seat, evaluate([...p.holeCards, ...end.board])] as const),
  );

  const shown = result.showdown.map((s) => s.seat);
  if (new Set(shown).size !== shown.length) return `repeated shown seat ${shown.join()}`;
  const positions = shown.map((seat) => order.indexOf(seat));
  if (positions.some((at, i) => at < 0 || (i > 0 && at <= (positions[i - 1] as number)))) {
    return `shown ${shown.join()} not in showdown order ${order.join()}`;
  }
  for (const s of result.showdown) {
    if (s.rank !== rank.get(s.seat)) return `seat ${s.seat} has a wrong rank`;
  }

  const pots = end.pots;
  if (pots.length > 1) counters.multiPot++;
  for (const [k, pot] of pots.entries()) {
    const award = result.awards[k];
    if (award === undefined) return `pot ${k} has no award`;
    const best = Math.max(...pot.eligible.map((seat) => rank.get(seat) as number));
    const bestSeats = pot.eligible.filter((seat) => rank.get(seat) === best);
    const expected = splitPot(award.amount, bestSeats, end.button, seats);
    if (JSON.stringify(award.winners) !== JSON.stringify(expected)) {
      return `pot ${k} paid ${JSON.stringify(award.winners)}, expected ${JSON.stringify(expected)}`;
    }
    if (pot.eligible.length < 2) continue;
    for (const w of award.winners) {
      if (!shown.includes(w.seat)) return `pot ${k} winner ${w.seat} was not shown`;
    }
  }

  for (const seat of order.filter((s) => !shown.includes(s))) {
    counters.mucks++;
    for (const [k, pot] of pots.entries()) {
      if (pot.eligible.length < 2 || !pot.eligible.includes(seat)) continue;
      const beaten = shown.some(
        (s) => pot.eligible.includes(s) && (rank.get(s) as number) > (rank.get(seat) as number),
      );
      if (!beaten) return `seat ${seat} mucked but no shown hand beats it in pot ${k}`;
    }
  }

  if (pots.length === 1) {
    const running: SeatNumber[] = [];
    let bestShown = -Infinity;
    for (const seat of order) {
      if ((rank.get(seat) as number) >= bestShown) {
        running.push(seat);
        bestShown = rank.get(seat) as number;
      }
    }
    if (shown.join() !== running.join())
      return `one pot shown ${shown.join()}, expected ${running.join()}`;
  }

  const mainWinners = (result.awards[0]?.winners ?? []).map((w) => w.seat);
  for (const seat of shown) {
    const winsSide = result.awards.some(
      (a, k) =>
        k > 0 && (pots[k]?.eligible.length ?? 0) > 1 && a.winners.some((w) => w.seat === seat),
    );
    if (winsSide && !mainWinners.includes(seat)) counters.sideOnlyWins++;
  }

  const violations = checkState(end);
  return violations.length === 0 ? null : JSON.stringify(violations);
}

describe('showdown order property', () => {
  it('5,000 random all-in hands follow the pot-by-pot show and muck rule', () => {
    const rng = new Xoshiro128(1115);
    let showdowns = 0;
    for (let h = 0; h < HANDS; h++) {
      const end = playOut(rng);
      if (end.result?.endedBy !== 'showdown') continue;
      showdowns++;
      const failure = showdownMessage(end);
      if (failure !== null) expect.fail(`hand ${h}: ${failure}`);
    }
    expect(showdowns).toBeGreaterThan(0);
    expect(counters.multiPot).toBeGreaterThan(0);
    expect(counters.mucks).toBeGreaterThan(0);
    expect(counters.sideOnlyWins).toBeGreaterThan(0);
  }, 60_000);
});
