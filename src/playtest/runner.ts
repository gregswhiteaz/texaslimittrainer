import { replayCodeFromWords, shuffledDeck, type ReplayCode } from '../engine/deck';
import {
  applyAction,
  createHand,
  nextButton,
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
  checkDeal,
  checkStep,
  describeAction,
  INVARIANTS,
  MAX_BETS_PER_STREET,
  type ActionStep,
  type Violation,
} from '../engine/invariants';
import { playerView, type SeatPolicy } from '../engine/player-view';
import type { LineUpPreset } from '../bots/lineup';
import { lineUpPolicyFactory, randomMovePolicy, seatGenerator, seededTagPolicy } from './policy';

export { MAX_BETS_PER_STREET };
export const PLAYTEST_STAKES: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
export const CASH_BUY_IN = 160; // 20 × bigBet (REQ-007.1)
export const SNG_STAKES: Stakes = { smallBlind: 10, bigBlind: 20, smallBet: 20, bigBet: 40 }; // REQ-008.2 L1
export const SNG_STARTING_CHIPS = 1500; // REQ-008.1

export type GameType = 'cash' | 'sng';
export interface GameRules {
  readonly stakes: Stakes;
  readonly startingStack: number;
  /** A seat that ends a hand on 0 starts the next at startingStack (cash), or sits out (sng). */
  readonly rebuy: boolean;
  /** Replay-code word 2. */
  readonly codeWord: number;
}
export const GAMES: Readonly<Record<GameType, GameRules>> = {
  cash: { stakes: PLAYTEST_STAKES, startingStack: CASH_BUY_IN, rebuy: true, codeWord: 0 },
  sng: { stakes: SNG_STAKES, startingStack: SNG_STARTING_CHIPS, rebuy: false, codeWord: 1 },
};

export interface PlaytestOptions {
  readonly hands: number;
  readonly seed: number;
  readonly size: number;
  /** Default 'cash'. */
  readonly game?: GameType;
  /** Seat 1 plays the user (TAG), seats 2..size the preset's styles (lineUpPolicyFactory); an explicit
   *  seams.makePolicy wins. Default: defaultPolicyFactory. */
  readonly lineUp?: LineUpPreset;
}
/** One hand's table. */
export interface HandSetup {
  /** Default 'cash'. */
  readonly game?: GameType;
  /** One per seat 1..size; 0 = not dealt in. Default: every seat at GAMES[game].startingStack. */
  readonly stacks?: readonly number[];
  /** Previous hand's final {seat, stack} for each seat dealt into it, on the same table; enables the AC#9
   *  cross-hand check. */
  readonly previous?: readonly SeatConfig[];
}
/** Makes the policy for one seat of one hand. Default: defaultPolicyFactory(seats dealt in). */
export type PolicyFactory = (code: ReplayCode, seat: SeatNumber) => SeatPolicy;
/** Called after every applied player action; returns the violations it found ([] when clean). */
export type ActionHook = (step: ActionStep) => readonly Violation[];
export interface PlaytestEngine {
  readonly createHand: (config: HandConfig) => HandState;
  readonly applyAction: (state: HandState, action: Action) => ApplyResult;
}
/** Test seams; the CLI entry passes none. */
export interface PlaytestSeams {
  /** Default: defaultPolicyFactory(seats dealt in) (TAG at 6 players, random-move elsewhere). */
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
  /** Dealt-in seats with their starting stacks, ascending. */
  readonly seats: readonly SeatConfig[];
  readonly button: SeatNumber;
  /** Every applied player action in order; blinds excluded. */
  readonly actions: readonly Action[];
  readonly game: GameType;
  /** Table size, counting seats not dealt in. */
  readonly size: number;
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
  /** Problems found at the deal (A-6); [] when clean. Non-empty ⇒ no actions were played. */
  readonly dealViolations: readonly Violation[];
}
/** A hand that stopped at a violation. */
export type ViolatingHand = PlayedHand & { readonly violation: HandViolation };
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
  /** The earliest hand with violations. */
  readonly firstViolation: PlayedHand | null;
}

const randomPolicy: PolicyFactory = (code, seat) => randomMovePolicy(seatGenerator(code, seat));
const allTag: PolicyFactory = (code) => seededTagPolicy(code);

/** seededTagPolicy(code) (TAG with the worker's per-decision seed) in every seat at 6 players;
 *  randomMovePolicy(seatGenerator(code, seat)) at other sizes, where TAG has no preflop chart yet. */
export function defaultPolicyFactory(size: number): PolicyFactory {
  return size === 6 ? allTag : randomPolicy;
}

/** Hand k's code: replayCodeFromWords([floor(seed / 2^32), seed mod 2^32, GAMES[game].codeWord, k]).
 *  Throws RangeError on bad input. */
export function handReplayCode(
  seed: number,
  handNumber: number,
  game: GameType = 'cash',
): ReplayCode {
  if (!Number.isInteger(handNumber) || handNumber < 1) {
    throw new RangeError('Hand number must be a whole number of at least 1');
  }
  return replayCodeFromWords([
    Math.floor(seed / 2 ** 32),
    seed >>> 0,
    GAMES[game].codeWord,
    handNumber,
  ]);
}

/** A player action's record (never a blind) back to the Action that produced it. */
export function toAction({ seat, type, amount }: ActionRecord): Action {
  if (type === 'fold' || type === 'check') return { seat, type };
  return { seat, type: type as 'call' | 'bet' | 'raise', amount };
}

const realEngine: PlaytestEngine = { createHand, applyAction };

/** Deals and plays one hand from `code` at `setup` (default: cash, every seat at the buy-in). Checks the deal
 *  first and plays no action if it has a violation; otherwise stops at the first action with a violation (an
 *  engine rejection always is one). Throws RangeError if `setup.stacks` isn't one stack per seat. */
export function playHand(
  code: ReplayCode,
  size: number,
  button: SeatNumber,
  number = 1,
  seams: PlaytestSeams = {},
  setup: HandSetup = {},
): PlayedHand {
  const { game = 'cash', previous } = setup;
  const rules = GAMES[game];
  const stacks = setup.stacks ?? Array.from({ length: size }, () => rules.startingStack);
  if (stacks.length !== size) throw new RangeError('Stacks must list one stack per seat');
  const seats = stacks.flatMap((stack, i) => (stack > 0 ? [{ seat: i + 1, stack }] : []));
  const {
    makePolicy = defaultPolicyFactory(seats.length),
    onAction = checkStep,
    engine = realEngine,
  } = seams;
  let state = engine.createHand({
    stakes: rules.stakes,
    seats,
    button,
    deck: shuffledDeck(code),
  });
  const dealViolations = checkDeal(state, previous, rules.rebuy ? rules.startingStack : null);
  const policies = new Map(seats.map(({ seat }) => [seat, makePolicy(code, seat)]));
  let violation: HandViolation | null = null;
  let actionNumber = 0;
  while (dealViolations.length === 0 && state.toAct !== null) {
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
    record: { replayCode: code, stakes: rules.stakes, seats, button, actions, game, size },
    final: state,
    violations: dealViolations.length + (violation?.violations.length ?? 0),
    violation,
    dealViolations,
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
    // D-5: all chips put in the middle, including the uncalled bet returned to its bettor.
    const pot =
      (final.result?.awards ?? []).reduce((sum, award) => sum + award.amount, 0) +
      (final.result?.returned?.amount ?? 0);
    largestPot = Math.max(largestPot, pot);
    violations += hand.violations;
    if (hand.violations > 0) {
      firstViolation ??= hand;
      const found = [...hand.dealViolations, ...(hand.violation?.violations ?? [])];
      for (const id of new Set(found.map((v) => v.invariant))) {
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

/** Plays options.hands hands; calls onHand after each (not retained, so memory is O(1) in hands).
 *  Stacks carry over between hands (D-8): in cash a seat that ends on 0 rebuys; in sng it sits out, and a new
 *  sit-and-go starts when one seat has every chip. A table starts with every seat at the starting stack and
 *  the button at seat 1, also after a hand with a violation (A-2, A-3). */
export function runPlaytest(
  options: PlaytestOptions,
  onHand?: (hand: PlayedHand) => void,
  seams: PlaytestSeams = {},
): PlaytestSummary {
  const { hands, seed, size, game = 'cash', lineUp } = options;
  const rules = GAMES[game];
  const handSeams =
    lineUp === undefined || seams.makePolicy !== undefined
      ? seams
      : { ...seams, makePolicy: lineUpPolicyFactory(lineUp, size) };
  function* play(): Generator<PlayedHand> {
    let setup: HandSetup = { game };
    let button = 1;
    for (let k = 1; k <= hands; k++) {
      const hand = playHand(handReplayCode(seed, k, game), size, button, k, handSeams, setup);
      onHand?.(hand);
      yield hand;
      setup = { game };
      button = 1;
      const { final } = hand;
      if (hand.violations > 0 || final.result === null) continue;
      const stacks = Array.from({ length: size }, (_, i) => {
        const stack = final.players.find((p) => p.seat === i + 1)?.stack ?? 0;
        return stack === 0 && rules.rebuy ? rules.startingStack : stack;
      });
      if (stacks.filter((stack) => stack > 0).length < 2) continue;
      const next = stacks.map((stack, i) => ({ seat: i + 1, stack }));
      button = nextButton(next, final.button);
      setup = {
        game,
        stacks,
        previous: final.players.map(({ seat, stack }) => ({ seat, stack })),
      };
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
