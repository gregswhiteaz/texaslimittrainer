// Real targets: the p95 targets in SCENARIOS (scale 1). They are enforced only by
//   ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts
// run with CI unset on the reference machine (Apple-silicon Mac, Node 22.18.0). Local `npm test`
// enforces only the targets times the slack scale below. CI (CI=true) prints the numbers but
// enforces no speed limit.
// Times are process CPU time (cpuNowMs in tests/support/speed.ts), so other busy processes do not inflate them.
import { describe, expect, it } from 'vitest';
import { recommendPostflop, type PostflopOptions } from '../../src/advice/postflop';
import { ACTION_RANGE_ADVICE } from '../../src/advice/recommend';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { cpuNowMs, SPEED_LIMITS_NOT_ENFORCED, speedLimitsEnforced } from '../support/speed';

const SCALE = Number(process.env.ADVICE_PERF_SCALE ?? 20);
const RUNS = 20;
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

/** Ten seats, button 1: UTG (4) to the button call, SB (2) completes, BB (3) checks. */
const fullRingPreflop: [SeatNumber, Action['type'], number?][] = [
  ...[4, 5, 6, 7, 8, 9, 10, 1].map((seat): [SeatNumber, Action['type'], number] => [
    seat,
    'call',
    4,
  ]),
  [2, 'call', 2],
  [3, 'check'],
];

/** [name, view, target p95 in ms on the reference machine] (spec §9). */
const SCENARIOS: [string, PlayerView, number][] = [
  [
    'HU flop facing a bet',
    viewAfter(3, [
      [1, 'fold'],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'bet', 4],
    ]),
    25,
  ],
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

/** p95 failures for `scenarios` run with `options`; logs every scenario's numbers. */
function slowScenarios(
  scenarios: [string, PlayerView, number][],
  options?: PostflopOptions,
): string[] {
  const failures: string[] = [];
  if (!ENFORCED) console.log(SPEED_LIMITS_NOT_ENFORCED);
  for (const [name, view, targetMs] of scenarios) {
    const first = recommendPostflop(view, options);
    expect(first.callAmount, name).toBeGreaterThan(0);
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

describe('postflop advice performance', () => {
  it('postflop advice latency within target times slack', () => {
    expect(slowScenarios(SCENARIOS)).toEqual([]);
  }, 120_000);

  it('actions-mode postflop advice latency within target times slack', () => {
    expect(slowScenarios(ACTION_SCENARIOS, ACTION_RANGE_ADVICE)).toEqual([]);
  }, 120_000);
});
