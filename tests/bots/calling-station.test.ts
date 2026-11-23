import { describe, expect, it } from 'vitest';
import { decideCallingStation } from '../../src/bots/calling-station';
import { drawDeviation } from '../../src/bots/style';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import { seededTagPolicy } from '../../src/playtest/policy';
import { runPlaytest } from '../../src/playtest/runner';

const TEST_TIMEOUT_MS = 120_000;

/** A stub generator returning `values` in turn (then 0) and counting calls. */
function stub(...values: number[]) {
  const generator = {
    calls: 0,
    nextUint32: () => values[generator.calls++] ?? 0,
  };
  return generator;
}

describe('Calling station decision', () => {
  it('drawDeviation draws once and compares against p', () => {
    for (const [p, yes, no] of [
      [0.5, 2147483647, 2147483648],
      [0.6, 2576980377, 2576980378],
    ] as const) {
      expect(drawDeviation(p, stub(yes))).toBe(true);
      expect(drawDeviation(p, stub(no))).toBe(false);
    }
    expect(drawDeviation(0, stub(0))).toBe(false);
    expect(drawDeviation(1, stub(4294967295))).toBe(true);
    const once = stub(0, 0);
    drawDeviation(0.5, once);
    expect(once.calls).toBe(1);
  });

  it(
    'seated Calling stations among seeded TAGs break no invariant',
    () => {
      // 1,000 hands (10,000 before TASK-7.8): bot equity now runs at every postflop decision.
      const summary = runPlaytest({ hands: 1_000, seed: 42, size: 6 }, undefined, {
        makePolicy: (code, seat) =>
          seat === 2 || seat === 4
            ? (view) =>
                decideCallingStation(view, { random: botRandom(botDecisionSeed(code, view)) })
            : seededTagPolicy(code),
      });
      expect(summary.violations).toBe(0);
      expect(summary.handsPlayed).toBe(1_000);
    },
    TEST_TIMEOUT_MS,
  );
});
