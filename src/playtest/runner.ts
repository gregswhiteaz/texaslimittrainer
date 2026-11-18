import { replayCodeFromWords, shuffledDeck, type ReplayCode } from '../engine/deck';
import {
  applyAction,
  createHand,
  type Action,
  type ActionRecord,
  type ApplyResult,
  type HandConfig,
  type HandState,
  type SeatConfig,
  type SeatNumber,
  type Stakes,
} from '../engine/hand';
import {
  checkStep,
  describeAction,
  INVARIANTS,
  MAX_BETS_PER_STREET,
  type ActionStep,
  type Violation,
} from '../engine/invariants';
import { playerView, type SeatPolicy } from '../engine/player-view';
import { randomMovePolicy, seatGenerator } from './policy';

export { MAX_BETS_PER_STREET };
export const PLAYTEST_STAKES: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
export const CASH_BUY_IN = 160; // 20 × bigBet (REQ-007.1)

export interface PlaytestOptions {
  readonly hands: number;
  readonly seed: number;
  readonly size: number;
}
/** Makes the policy for one seat of one hand. Default: randomMovePolicy(seatGenerator(code, seat)). */
export type PolicyFactory = (code: ReplayCode, seat: SeatNumber) => SeatPolicy;
/** Called after every applied player action; returns the violations it found ([] when clean). */
export type ActionHook = (step: ActionStep) => readonly Violation[];
export interface PlaytestEngine {
  readonly createHand: (config: HandConfig) => HandState;
  readonly applyAction: (state: HandState, action: Action) => ApplyResult;
}
/** Test seams; the CLI entry passes none. */
export interface PlaytestSeams {
  /** Default: randomMovePolicy(seatGenerator(code, seat)). */
  readonly makePolicy?: PolicyFactory;
  /** Default: checkStep. A custom hook replaces it (compose with checkStep to keep the built-in checks). */
  readonly onAction?: ActionHook;
  /** Default: the real engine. */
  readonly engine?: PlaytestEngine;
}
export interface HandViolation {
  /** 1-based among player actions (blinds excluded). */
  readonly actionNumber: number;
  /** The proposed action. */
  readonly action: Action;
  /** Non-empty. */
  readonly violations: readonly Violation[];
}
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
  /** Last state (complete unless abandoned); includes the violating action if the engine accepted it. */
  readonly final: HandState;
  readonly violations: number;
  /** The action that stopped the hand, or null. */
  readonly violation: HandViolation | null;
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
  /** Hands violating each id: every INVARIANTS id, then custom ids in first-seen order. */
  readonly violationCounts: Readonly<Record<string, number>>;
  /** The earliest violating hand. */
  readonly firstViolation: PlayedHand | null;
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

const realEngine: PlaytestEngine = { createHand, applyAction };

/** Deals and plays one hand from `code` with every seat at CASH_BUY_IN.
 *  Stops at the first action with a violation (an engine rejection always is one). */
export function playHand(
  code: ReplayCode,
  size: number,
  button: SeatNumber,
  number = 1,
  seams: PlaytestSeams = {},
): PlayedHand {
  const { makePolicy = defaultPolicy, onAction = checkStep, engine = realEngine } = seams;
  const seats = Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: CASH_BUY_IN }));
  let state = engine.createHand({
    stakes: PLAYTEST_STAKES,
    seats,
    button,
    deck: shuffledDeck(code),
  });
  const policies = new Map(seats.map(({ seat }) => [seat, makePolicy(code, seat)]));
  let violation: HandViolation | null = null;
  let actionNumber = 0;
  while (state.toAct !== null) {
    const policy = policies.get(state.toAct) as SeatPolicy;
    const action = policy(playerView(state, state.toAct));
    const result = engine.applyAction(state, action);
    actionNumber++;
    let found = onAction({ before: state, action, result });
    if (found.length > 0 || !result.ok) {
      if (found.length === 0 && !result.ok) {
        found = [
          {
            invariant: 'legal-action',
            message: `engine rejected ${describeAction(action)} (${result.error.code})`,
          },
        ];
      }
      violation = { actionNumber, action, violations: found };
      if (result.ok) state = result.state;
      break;
    }
    state = result.state;
  }
  const actions = state.actions
    .filter((a) => a.type !== 'small-blind' && a.type !== 'big-blind')
    .map(toAction);
  return {
    number,
    record: { replayCode: code, stakes: PLAYTEST_STAKES, seats, button, actions },
    final: state,
    violations: violation?.violations.length ?? 0,
    violation,
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
  const violationCounts: Record<string, number> = {};
  for (const id of INVARIANTS) violationCounts[id] = 0;
  let firstViolation: PlayedHand | null = null;
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
    if (hand.violation !== null) {
      firstViolation ??= hand;
      for (const id of new Set(hand.violation.violations.map((v) => v.invariant))) {
        violationCounts[id] = (violationCounts[id] ?? 0) + 1;
      }
    }
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
    violationCounts,
    firstViolation,
  };
}

/** Plays options.hands hands; calls onHand after each (not retained, so memory is O(1) in hands). */
export function runPlaytest(
  options: PlaytestOptions,
  onHand?: (hand: PlayedHand) => void,
  seams: PlaytestSeams = {},
): PlaytestSummary {
  const { hands, seed, size } = options;
  function* play(): Generator<PlayedHand> {
    for (let k = 1; k <= hands; k++) {
      const hand = playHand(handReplayCode(seed, k), size, ((k - 1) % size) + 1, k, seams);
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
