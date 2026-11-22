import { describe, expect, it } from 'vitest';
import type { Action } from '../../src/engine/hand';
import type { SeatPolicy } from '../../src/engine/player-view';
import { Xoshiro128 } from '../../src/engine/seeded-random';
import { randomMovePolicy, scriptedPolicy } from '../../src/playtest/policy';
import {
  PLAYTEST_USER_SEAT,
  replayWithBots,
  runPlaytest,
  type PlayedHand,
  type PlaytestOptions,
} from '../../src/playtest/runner';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const TEST_TIMEOUT_MS = 120_000;
const SLOW_RUN_LIMIT_MS = 300_000;
const SMALL_HANDS = 100;
// Enough hands for SPEC-03's first 200 hands with a user decision (the 200th is hand 203 here).
const MIXED_HANDS = SLOW ? 1000 : 250;
const SEED = 15; // A-5
const USER_SEED = 2026; // A-2

const userActions = (actions: readonly Action[]) =>
  actions.filter((a) => a.seat === PLAYTEST_USER_SEAT);
const botActions = (actions: readonly Action[]) =>
  actions.filter((a) => a.seat !== PLAYTEST_USER_SEAT);

/** Plays `count` 6-max hands with seat 1 on random legal moves from one shared generator (A-2), so the user's
 *  actions do not follow from the replay code. A shorter run is a prefix of a longer one. */
function record(count: number, lineUp?: PlaytestOptions['lineUp']): PlayedHand[] {
  const rng = new Xoshiro128(USER_SEED);
  const hands: PlayedHand[] = [];
  const summary = runPlaytest(
    { hands: count, seed: SEED, size: 6, lineUp, userPolicy: () => randomMovePolicy(rng) },
    (hand) => hands.push(hand),
  );
  expect(summary.violations).toBe(0);
  expect(hands).toHaveLength(count);
  return hands;
}

let mixed: PlayedHand[] | undefined;
const mixedRun = () => (mixed ??= record(MIXED_HANDS, 'Mixed'));

/** Replays every hand with seat 1's recorded actions and checks the whole action list, result and violations. */
function expectSameReplays(hands: readonly PlayedHand[]) {
  for (const hand of hands) {
    const { record } = hand;
    const replay = replayWithBots(record, hand.lineUp, scriptedPolicy(userActions(record.actions)));
    expect(replay.violations, `hand ${hand.number}`).toBe(0);
    expect(replay.record.actions, `hand ${hand.number}`).toEqual(record.actions);
    expect(replay.final.result, `hand ${hand.number}`).toEqual(hand.final.result);
  }
}

/** SPEC-01: every replay matches; enough user hands and bot actions show the check is not vacuous. */
function checkTag(hands: readonly PlayedHand[]) {
  expectSameReplays(hands);
  const userHands = hands.filter((h) => userActions(h.record.actions).length > 0).length;
  const bot = hands.reduce((n, h) => n + botActions(h.record.actions).length, 0);
  expect(userHands).toBeGreaterThanOrEqual(hands.length / 10);
  expect(bot).toBeGreaterThanOrEqual(hands.length);
}

/** SPEC-02: every replay matches, and bots of every style acted. */
function checkMixed(hands: readonly PlayedHand[]) {
  expectSameReplays(hands);
  const byStyle = new Map<string, number>();
  for (const hand of hands) {
    for (const action of botActions(hand.record.actions)) {
      const style = hand.lineUp?.find((s) => s.seat === action.seat)?.style;
      expect(style).toBeTruthy();
      byStyle.set(style as string, (byStyle.get(style as string) ?? 0) + 1);
    }
  }
  for (const style of ['TAG', 'Calling station', 'Maniac', 'Rock']) {
    expect(byStyle.get(style) ?? 0, style).toBeGreaterThanOrEqual(1);
  }
}

/** Check if legal, else fold (A-4). */
const passive: SeatPolicy = (view) =>
  view.legalActions.find((a) => a.type === 'check') ??
  (view.legalActions.find((a) => a.type === 'fold') as Action);

describe('TASK-6.15 bot replay', () => {
  // The 1,000-hand runs are opt-in (TLH_SLOW_TESTS=1); every push runs the same checks on 100 hands.
  it.runIf(SLOW)(
    "replaying 1,000 6-max TAG hands with the user's recorded actions reproduces every bot action",
    () => checkTag(record(1000)),
    SLOW_RUN_LIMIT_MS,
  );

  it(
    "replaying 100 6-max TAG hands with the user's recorded actions reproduces every bot action",
    () => checkTag(record(SMALL_HANDS)),
    TEST_TIMEOUT_MS,
  );

  it.runIf(SLOW)(
    "replaying 1,000 6-max Mixed hands with the user's recorded actions reproduces every bot action of every style",
    () => checkMixed(mixedRun()),
    SLOW_RUN_LIMIT_MS,
  );

  it(
    "replaying 100 6-max Mixed hands with the user's recorded actions reproduces every bot action of every style",
    () => checkMixed(mixedRun().slice(0, SMALL_HANDS)),
    TEST_TIMEOUT_MS,
  );

  it(
    'replaying with a different first user action deals the same cards and keeps every bot action before it',
    () => {
      const hands = mixedRun()
        .filter((h) => userActions(h.record.actions).length > 0)
        .slice(0, 200);
      expect(hands).toHaveLength(200);
      for (const hand of hands) {
        const { record, final } = hand;
        const firstUser = record.actions.findIndex((a) => a.seat === PLAYTEST_USER_SEAT);
        const original = record.actions[firstUser] as Action;
        // A-4: alt is the first legal action at seat 1's first decision whose type differs from the recorded one.
        let firstLegal: readonly Action[] = [];
        const recorded = scriptedPolicy(userActions(record.actions));
        replayWithBots(record, hand.lineUp, (view) => {
          if (firstLegal.length === 0) firstLegal = view.legalActions;
          return recorded(view);
        });
        const alt = firstLegal.find((a) => a.type !== original.type);
        const label = `hand ${hand.number}`;
        expect(alt, label).toBeDefined();
        const replay = replayWithBots(
          record,
          hand.lineUp,
          scriptedPolicy([alt as Action], passive),
        );
        expect(replay.violations, label).toBe(0);
        expect(
          replay.final.players.map((p) => [p.seat, p.holeCards]),
          label,
        ).toEqual(final.players.map((p) => [p.seat, p.holeCards]));
        const n = Math.min(replay.final.board.length, final.board.length);
        expect(replay.final.board.slice(0, n), label).toEqual(final.board.slice(0, n));
        const replayFirstUser = replay.record.actions.findIndex(
          (a) => a.seat === PLAYTEST_USER_SEAT,
        );
        expect(replay.record.actions.slice(0, replayFirstUser), label).toEqual(
          record.actions.slice(0, firstUser),
        );
        const replayed = replay.record.actions[replayFirstUser] as Action;
        expect(replayed, label).toEqual(alt);
        expect(replayed.type, label).not.toBe(original.type);
      }
    },
    TEST_TIMEOUT_MS,
  );
});
