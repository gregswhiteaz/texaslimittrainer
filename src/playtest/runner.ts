import { replayCodeFromWords, shuffledDeck, type ReplayCode } from '../engine/deck';
import {
  applyAction,
  createHand,
  type Action,
  type ActionRecord,
  type HandState,
  type SeatConfig,
  type SeatNumber,
  type Stakes,
} from '../engine/hand';
import { actWith, type SeatPolicy } from '../engine/player-view';
import { randomMovePolicy, seatGenerator } from './policy';

export const PLAYTEST_STAKES: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
export const CASH_BUY_IN = 160; // 20 × bigBet (REQ-007.1)
export const MAX_BETS_PER_STREET = 4;

export interface PlaytestOptions {
  readonly hands: number;
  readonly seed: number;
  readonly size: number;
}
/** Makes the policy for one seat of one hand. Default: randomMovePolicy(seatGenerator(code, seat)). */
export type PolicyFactory = (code: ReplayCode, seat: SeatNumber) => SeatPolicy;
/** Everything needed to replay a hand (REQ-013.3). Plain data. */
export interface HandRecord {
  readonly replayCode: ReplayCode;
  readonly stakes: Stakes;
  /** Seats 1..n, starting stacks, ascending. */
  readonly seats: readonly SeatConfig[];
  readonly button: SeatNumber;
  /** Every applied player action in order; blinds excluded. */
  readonly actions: readonly Action[];
}
export interface PlayedHand {
  /** 1-based in the run. */
  readonly number: number;
  readonly record: HandRecord;
  /** Last state (complete unless abandoned). */
  readonly final: HandState;
  readonly violations: number;
}
export interface PlaytestSummary {
  readonly handsPlayed: number;
  readonly foldOuts: number;
  readonly showdowns: number;
  readonly playerActions: number;
  readonly cappedStreets: number;
  readonly largestPot: number;
  readonly firstReplayCode: ReplayCode;
  readonly lastReplayCode: ReplayCode;
  readonly violations: number;
}

const defaultPolicy: PolicyFactory = (code, seat) => randomMovePolicy(seatGenerator(code, seat));

/** Hand k's code: replayCodeFromWords([floor(seed / 2^32), seed mod 2^32, 0, k]). Throws RangeError on bad input. */
export function handReplayCode(seed: number, handNumber: number): ReplayCode {
  if (!Number.isInteger(handNumber) || handNumber < 1) {
    throw new RangeError('Hand number must be a whole number of at least 1');
  }
  return replayCodeFromWords([Math.floor(seed / 2 ** 32), seed >>> 0, 0, handNumber]);
}

/** A player action's record (never a blind) back to the Action that produced it. */
function toAction({ seat, type, amount }: ActionRecord): Action {
  if (type === 'fold' || type === 'check') return { seat, type };
  return { seat, type: type as 'call' | 'bet' | 'raise', amount };
}

/** Deals and plays one hand from `code` with every seat at CASH_BUY_IN. */
export function playHand(
  code: ReplayCode,
  size: number,
  button: SeatNumber,
  number = 1,
  makePolicy: PolicyFactory = defaultPolicy,
): PlayedHand {
  const seats = Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: CASH_BUY_IN }));
  let state = createHand({ stakes: PLAYTEST_STAKES, seats, button, deck: shuffledDeck(code) });
  const policies = new Map(seats.map(({ seat }) => [seat, makePolicy(code, seat)]));
  let violations = 0;
  while (state.toAct !== null) {
    const applied = actWith(state, policies.get(state.toAct) as SeatPolicy);
    if (!applied.ok) {
      violations++;
      break;
    }
    state = applied.state;
    if (state.betCount > MAX_BETS_PER_STREET) violations++;
  }
  const actions = state.actions
    .filter((a) => a.type !== 'small-blind' && a.type !== 'big-blind')
    .map(toAction);
  return {
    number,
    record: { replayCode: code, stakes: PLAYTEST_STAKES, seats, button, actions },
    final: state,
    violations,
  };
}

/** Streets of `state` whose bet count (the big blind counting as 1 preflop) reached the cap. */
function cappedStreets(state: HandState): number {
  const counts = new Map<string, number>();
  for (const a of state.actions) {
    if (a.type === 'big-blind' || a.type === 'bet' || a.type === 'raise') {
      counts.set(a.street, (counts.get(a.street) ?? 0) + 1);
    }
  }
  return [...counts.values()].filter((count) => count >= MAX_BETS_PER_STREET).length;
}

/** Totals over `hands` (consumed one at a time, never retained). Throws RangeError if empty. */
export function summarize(hands: Iterable<PlayedHand>): PlaytestSummary {
  let handsPlayed = 0;
  let foldOuts = 0;
  let showdowns = 0;
  let playerActions = 0;
  let capped = 0;
  let largestPot = 0;
  let violations = 0;
  let firstReplayCode: ReplayCode | undefined;
  let lastReplayCode: ReplayCode | undefined;
  for (const hand of hands) {
    const { final, record } = hand;
    handsPlayed++;
    if (final.result?.endedBy === 'fold') foldOuts++;
    if (final.result?.endedBy === 'showdown') showdowns++;
    playerActions += record.actions.length;
    capped += cappedStreets(final);
    const pot = (final.result?.awards ?? []).reduce((sum, award) => sum + award.amount, 0);
    largestPot = Math.max(largestPot, pot);
    violations += hand.violations;
    firstReplayCode ??= record.replayCode;
    lastReplayCode = record.replayCode;
  }
  if (firstReplayCode === undefined || lastReplayCode === undefined) {
    throw new RangeError('No hands to summarise');
  }
  return {
    handsPlayed,
    foldOuts,
    showdowns,
    playerActions,
    cappedStreets: capped,
    largestPot,
    firstReplayCode,
    lastReplayCode,
    violations,
  };
}

/** Plays options.hands hands; calls onHand after each (not retained, so memory is O(1) in hands). */
export function runPlaytest(
  options: PlaytestOptions,
  onHand?: (hand: PlayedHand) => void,
  makePolicy: PolicyFactory = defaultPolicy,
): PlaytestSummary {
  const { hands, seed, size } = options;
  function* play(): Generator<PlayedHand> {
    for (let k = 1; k <= hands; k++) {
      const hand = playHand(handReplayCode(seed, k), size, ((k - 1) % size) + 1, k, makePolicy);
      onHand?.(hand);
      yield hand;
    }
  }
  return summarize(play());
}

/** Re-deals record.replayCode and applies record.actions through applyAction.
 *  Throws Error('Replay diverged at action <i>') if action i is rejected. */
export function replayHand(record: HandRecord): HandState {
  let state = createHand({
    stakes: record.stakes,
    seats: record.seats,
    button: record.button,
    deck: shuffledDeck(record.replayCode),
  });
  record.actions.forEach((action, i) => {
    const applied = applyAction(state, action);
    if (!applied.ok) throw new Error(`Replay diverged at action ${i}`);
    state = applied.state;
  });
  return state;
}
