// Real targets: >= 10,000,000 seven-card evals/s and table build <= 50 ms. They are enforced only by
//   EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts
// run with CI unset on the reference machine (Apple-silicon Mac, Node 22.18.0). Local `npm test`
// enforces only the slack floor below. CI (CI=true) prints the numbers but enforces no speed limit.
// Times are process CPU time (cpuNowMs in tests/support/speed.ts), so other busy processes do not inflate them.
// Each measurement is the best of RUNS timed repetitions, because heavy load still inflates CPU time
// somewhat (cache and core contention); the fastest run is the closest to the code's real cost.
import { describe, expect, it } from 'vitest';
import { buildEvaluatorTables, evaluate } from '../../src/engine/hand-evaluator';
import { cpuNowMs, SPEED_LIMITS_NOT_ENFORCED, speedLimitsEnforced } from '../support/speed';

const HANDS = 1_000_000;
const RUNS = 10;
const MIN_EVALS_PER_SEC = Number(process.env.EVALUATOR_MIN_EVALS_PER_SEC ?? 1_000_000);
const MAX_BUILD_MS = Number(process.env.EVALUATOR_MAX_BUILD_MS ?? 500);
const ENFORCED = speedLimitsEnforced();

/** Small seeded generator (mulberry32) so the sample hands are reproducible. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSevenCardHands(count: number): number[][] {
  const random = seededRandom(20261117);
  const deck = Array.from({ length: 52 }, (_, i) => i);
  const hands: number[][] = [];
  for (let h = 0; h < count; h++) {
    for (let i = 0; i < 7; i++) {
      const j = i + Math.floor(random() * (52 - i));
      [deck[i], deck[j]] = [deck[j] ?? 0, deck[i] ?? 0];
    }
    hands.push(deck.slice(0, 7));
  }
  return hands;
}

function evaluateAll(hands: number[][]): number {
  let checksum = 0;
  for (const hand of hands) checksum += evaluate(hand);
  return checksum;
}

describe('hand evaluator performance', () => {
  it('meets the evaluation throughput floor', () => {
    const hands = randomSevenCardHands(HANDS);
    const warmUp = evaluateAll(hands);

    let checksum = 0;
    let evalMs = Infinity;
    let buildMs = Infinity;
    for (let run = 0; run < RUNS; run++) {
      const start = cpuNowMs();
      checksum = evaluateAll(hands);
      evalMs = Math.min(evalMs, cpuNowMs() - start);
      expect(checksum).toBe(warmUp);

      const buildStart = cpuNowMs();
      buildEvaluatorTables();
      buildMs = Math.min(buildMs, cpuNowMs() - buildStart);
    }
    const rate = HANDS / (evalMs / 1000);

    console.log(
      `evaluate: ${Math.round(rate).toLocaleString('en-US')} seven-card evals/s; ` +
        `table build: ${buildMs.toFixed(1)} ms` +
        (ENFORCED ? '' : `; ${SPEED_LIMITS_NOT_ENFORCED}`),
    );
    expect(checksum).toBe(warmUp);
    expect(checksum).toBeGreaterThan(0);
    if (ENFORCED) {
      expect(rate).toBeGreaterThanOrEqual(MIN_EVALS_PER_SEC);
      expect(buildMs).toBeLessThanOrEqual(MAX_BUILD_MS);
    }
  }, 60_000);
});
