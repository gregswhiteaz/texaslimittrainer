// Real targets: the p95 targets in SCENARIOS (scale 1). They are enforced only by
//   ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts
// and the 25% headroom check (TASK-7.34 AC#2, TASK-7.39) by
//   ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom
// run with CI unset on the reference machine (Apple-silicon Mac, Node 22.18.0). Opt-in: the tests run
// only with TLH_SLOW_TESTS=1 (`npm run test:slow`, at the slack scale below) or with ADVICE_PERF_SCALE
// set; plain `npm test` skips them. CI (CI=true) prints the numbers but enforces no speed limit.
// Times are process CPU time (cpuNowMs in tests/support/speed.ts), so other busy processes do not inflate them.
import { describe, expect, it } from 'vitest';
import { computeEquity, equityWithBudget } from '../../src/advice/equity';
import {
  CALLING_RANGE_BUDGET,
  recommendPostflop,
  type PostflopOptions,
} from '../../src/advice/postflop';
import { callingRange, unseenCombos } from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE } from '../../src/advice/recommend';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { cpuNowMs, SPEED_LIMITS_NOT_ENFORCED, speedLimitsEnforced } from '../support/speed';

const SCALE = Number(process.env.ADVICE_PERF_SCALE ?? 20);
const RUNS = 20;
// Untimed calls first: process CPU time also counts V8's background compiler threads (TASK-7.18 D-3).
const WARMUP_RUNS = 15;
const OPT_IN = process.env.TLH_SLOW_TESTS === '1' || process.env.ADVICE_PERF_SCALE !== undefined;
const HEADROOM = 0.75;
const ENFORCED = speedLimitsEnforced();
const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ORDERED_DECK = Array.from({ length: 52 }, (_, i) => i);

/** Button 1; plays `steps` and returns the view of the seat then to act. */
function viewAfter(seats: number, steps: [SeatNumber, Action['type'], number?][]): PlayerView {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: seats }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck: ORDERED_DECK,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  return playerView(state, state.toAct as SeatNumber);
}

/** `seats` seats, button 1: UTG (4) to the button call, SB (2) completes, BB (3) checks. */
function limpedPreflop(seats: number): [SeatNumber, Action['type'], number?][] {
  const limpers = Array.from({ length: seats - 3 }, (_, i) => i + 4).concat(1);
  return [
    ...limpers.map((seat): [SeatNumber, Action['type'], number] => [seat, 'call', 4]),
    [2, 'call', 2],
    [3, 'check'],
  ];
}

const fullRingPreflop = limpedPreflop(10);

const HU_FACING_BET = viewAfter(3, [
  [1, 'fold'],
  [2, 'call', 2],
  [3, 'check'],
  [2, 'bet', 4],
]);

/** [name, view, target p95 in ms on the reference machine] (spec §9). */
const SCENARIOS: [string, PlayerView, number][] = [
  ['HU flop facing a bet', HU_FACING_BET, 25],
  [
    '6-max flop vs 3 opponents',
    viewAfter(6, [
      [4, 'fold'],
      [5, 'fold'],
      [6, 'call', 4],
      [1, 'call', 4],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'bet', 4],
    ]),
    50,
  ],
  ['10-seat flop vs 9 opponents', viewAfter(10, [...fullRingPreflop, [2, 'bet', 4]]), 100],
];

const NINE_SEAT_FACING_BET = viewAfter(9, [...limpedPreflop(9), [2, 'bet', 4]]);

/**
 * Headroom scenarios (TASK-7.34, TASK-7.39): the 8-opponent target is back to 100 ms (reduced calling budget). HU
 * is timed second and the actions spot last: timed first in a fresh worker, background JIT work put 6 of 17 runs
 * over 18.75 ms.
 */
const HEADROOM_SCENARIOS: [string, PlayerView, number][] = [
  ['9-seat flop vs 8 opponents', NINE_SEAT_FACING_BET, 100],
  ['HU flop facing a bet', HU_FACING_BET, 25],
];

/** p95 failures for `scenarios` run with `options`; logs every scenario's numbers. */
function slowScenarios(
  scenarios: [string, PlayerView, number][],
  options?: PostflopOptions,
  owed = true,
): string[] {
  const failures: string[] = [];
  if (!ENFORCED) console.log(SPEED_LIMITS_NOT_ENFORCED);
  for (const [name, view, targetMs] of scenarios) {
    const first = recommendPostflop(view, options);
    if (owed) expect(first.callAmount, name).toBeGreaterThan(0);
    else expect(first.callAmount, name).toBe(0);
    for (let i = 1; i < WARMUP_RUNS; i++) recommendPostflop(view, options);
    const times: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const start = cpuNowMs();
      recommendPostflop(view, options);
      times.push(cpuNowMs() - start);
    }
    times.sort((a, b) => a - b);
    const p95 = times[RUNS - 2] ?? Infinity;
    const limit = targetMs * SCALE;
    console.log(
      `${name}: ${first.opponents} opponents, ${first.equityMethod}, p95 ${p95.toFixed(2)} ms (target ${targetMs} ms x ${SCALE} = ${limit} ms)`,
    );
    if (ENFORCED && p95 > limit) failures.push(`${name}: p95 ${p95.toFixed(2)} ms > ${limit} ms`);
  }
  return failures;
}

/** Nothing owed: the flop is checked to the SB (seat 2), so `bet` is legal (TASK-7.18 A-4). */
const VALUE_BET_SCENARIOS: [string, PlayerView, number][] = [
  ['10-seat flop checked to the SB vs 9 opponents', viewAfter(10, fullRingPreflop), 100],
];

/** Action-range scenarios (TASK-7.5 spec SPEC-14): six seats, so the authored ranges apply. */
const ACTION_SCENARIOS: [string, PlayerView, number][] = [
  [
    'actions: 6-max flop facing a bet, one opponent',
    viewAfter(6, [
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'raise', 8],
      [2, 'fold'],
      [3, 'call', 4],
      [3, 'check'],
      [1, 'bet', 4],
    ]),
    25,
  ],
  [
    'actions: 6-max flop vs 3 opponents',
    viewAfter(6, [
      [4, 'fold'],
      [5, 'fold'],
      [6, 'call', 4],
      [1, 'call', 4],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'bet', 4],
    ]),
    50,
  ],
];

describe('postflop advice performance', { timeout: 120_000 }, () => {
  it.runIf(OPT_IN)('postflop advice latency within target times slack', () => {
    expect(slowScenarios(SCENARIOS)).toEqual([]);
  });

  it.runIf(OPT_IN)('value-bet postflop advice latency within target times slack', () => {
    const [[, view]] = VALUE_BET_SCENARIOS as [[string, PlayerView, number]];
    expect(view.legalActions.some((a) => a.type === 'bet')).toBe(true);
    // The calling-range run throws, so A-7 falls back to the whole-range number.
    const calling = callingRange(unseenCombos([...view.holeCards, ...view.board]), view.board);
    expect(() =>
      computeEquity({
        hero: view.holeCards,
        board: view.board,
        opponents: new Array<typeof calling>(9).fill(calling),
      }),
    ).toThrow(new RangeError('Sampling rejected too many deals'));
    const advice = recommendPostflop(view);
    expect(advice.equityVsCallingRangePct).toBe(advice.equityPct);
    expect(slowScenarios(VALUE_BET_SCENARIOS, undefined, false)).toEqual([]);
  });

  it.runIf(OPT_IN)('actions-mode postflop advice latency within target times slack', () => {
    expect(slowScenarios(ACTION_SCENARIOS, ACTION_RANGE_ADVICE)).toEqual([]);
  });

  it.runIf(OPT_IN)(
    'headroom: HU facing a bet, 8 opponents and the actions spot within 75% of target times slack',
    () => {
      // The calling-range run succeeds, so this is a calling-range spot, not the A-7 fallback.
      const { holeCards, board } = NINE_SEAT_FACING_BET;
      const calling = callingRange(unseenCombos([...holeCards, ...board]), board);
      const opponents = new Array<typeof calling>(8).fill(calling);
      const reduced = equityWithBudget({ hero: holeCards, board, opponents }, CALLING_RANGE_BUDGET);
      expect(reduced.method).toBe('sampled');
      expect(recommendPostflop(HU_FACING_BET).opponents).toBe(1);
      expect(recommendPostflop(NINE_SEAT_FACING_BET).opponents).toBe(8);
      const limits = (scenarios: [string, PlayerView, number][]) =>
        scenarios.map(([n, v, t]): [string, PlayerView, number] => [n, v, t * HEADROOM]);
      const actions = limits(ACTION_SCENARIOS.slice(0, 1));
      expect([
        ...slowScenarios(limits(HEADROOM_SCENARIOS)),
        ...slowScenarios(actions, ACTION_RANGE_ADVICE),
      ]).toEqual([]);
    },
  );
});
