// Real targets: the p95 targets in SCENARIOS (scale 1). They are enforced only by
//   EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts
// run with CI unset on the reference machine (Apple-silicon Mac, Node 22.18.0). Local `npm test`
// enforces only the targets times the slack scale below. CI (CI=true) prints the numbers but
// enforces no speed limit.
import { describe, expect, it } from 'vitest';
import { computeEquity, type EquityInput, type HoleCards } from '../../src/advice/equity';
import { parseCards, type Card } from '../../src/engine/cards';
import { SPEED_LIMITS_NOT_ENFORCED, speedLimitsEnforced } from '../support/speed';

const SCALE = Number(process.env.EQUITY_PERF_SCALE ?? 20);
const RUNS = 20;
const ENFORCED = speedLimitsEnforced();

function hole(text: string): HoleCards {
  const [a = -1, b = -1] = parseCards(text);
  return [a, b];
}

function everyCombo(dead: readonly Card[]): HoleCards[] {
  const combos: HoleCards[] = [];
  for (let a = 0; a < 52; a++) {
    for (let b = a + 1; b < 52; b++) {
      if (!dead.includes(a) && !dead.includes(b)) combos.push([a, b]);
    }
  }
  return combos;
}

function vsHand(hero: string, board: string, ...opponents: string[]): EquityInput {
  return { hero: hole(hero), board: parseCards(board), opponents: opponents.map((h) => [hole(h)]) };
}

function vsEveryCombo(hero: string, board: string, opponents: number): EquityInput {
  const range = everyCombo(parseCards(`${hero} ${board}`));
  return {
    hero: hole(hero),
    board: parseCards(board),
    opponents: Array.from({ length: opponents }, () => range),
  };
}

/** [name, input, expected method, target p95 in ms on the reference machine] (spec §9). */
const SCENARIOS: [string, EquityInput, string, number][] = [
  ['HU preflop hand vs hand', vsHand('As Ks', '', 'Qh Qd'), 'sampled', 15],
  ['HU flop hand vs hand', vsHand('Ah As', 'Kh 7c 2d', 'Kd Kc'), 'exact', 2],
  ['HU flop vs every unseen combo', vsEveryCombo('Ah Kh', 'Qh 7h 2c', 1), 'sampled', 20],
  ['HU turn vs every unseen combo', vsEveryCombo('Ah Kh', 'Qh 7h 2c 9s', 1), 'exact', 15],
  ['Three-way preflop AA vs KK vs QQ', vsHand('Ah As', '', 'Kd Kc', 'Qh Qc'), 'sampled', 20],
  ['6-max preflop vs 5 ranges', vsEveryCombo('Ah Kh', '', 5), 'sampled', 50],
  ['Full ring flop vs 9 ranges', vsEveryCombo('Ah Kh', 'Qh 7h 2c', 9), 'sampled', 80],
];

describe('equity performance', () => {
  it('equity latency within target times slack', () => {
    const failures: string[] = [];
    if (!ENFORCED) console.log(SPEED_LIMITS_NOT_ENFORCED);
    for (const [name, input, method, targetMs] of SCENARIOS) {
      const used = computeEquity(input).method;
      const times: number[] = [];
      for (let i = 0; i < RUNS; i++) {
        const start = performance.now();
        computeEquity(input);
        times.push(performance.now() - start);
      }
      times.sort((a, b) => a - b);
      const p95 = times[RUNS - 2] ?? Infinity;
      const limit = targetMs * SCALE;
      console.log(
        `${name}: ${used}, p95 ${p95.toFixed(2)} ms (target ${targetMs} ms x ${SCALE} = ${limit} ms)`,
      );
      expect(used, name).toBe(method);
      if (ENFORCED && p95 > limit) failures.push(`${name}: p95 ${p95.toFixed(2)} ms > ${limit} ms`);
    }
    expect(failures).toEqual([]);
  }, 120_000);
});
