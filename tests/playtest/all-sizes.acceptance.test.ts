import { describe, expect, it, vi } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { LINE_UP_PRESETS, type LineUpSeat } from '../../src/bots/lineup';
import { decideStyle } from '../../src/bots/decide';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import type { Action, HandState } from '../../src/engine/hand';
import { checkStep } from '../../src/engine/invariants';
import { playerView } from '../../src/engine/player-view';
import { main } from '../../src/playtest/cli';
import { randomMovePolicy, seatGenerator, seededTagPolicy } from '../../src/playtest/policy';
import { runPlaytest, type PlayedHand, type PolicyFactory } from '../../src/playtest/runner';

// computeEquity memoized on its input: the AC#11 check re-decides every action, and the repeat equity runs
// then return the run's own (identical, deterministic) results instead of sampling again.
vi.mock('../../src/advice/equity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/advice/equity')>();
  const memo = new Map<string, EquityResult>();
  return {
    ...actual,
    computeEquity: (input: EquityInput): EquityResult => {
      const key = JSON.stringify(input);
      let result = memo.get(key);
      if (result === undefined) {
        result = actual.computeEquity(input);
        memo.set(key, result);
      }
      return result;
    },
  };
});

const SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const TEST_TIMEOUT_MS = 60_000;

describe('playtests at every table size', () => {
  it(
    'AC#9 default playtest seats TAG at every size from 2 to 10',
    () => {
      const tag: PolicyFactory = (code) => seededTagPolicy(code);
      for (const size of SIZES) {
        const options = { hands: 40, seed: 42, size };
        const summary = runPlaytest(options);
        expect(summary, `size ${size}`).toEqual(
          runPlaytest(options, undefined, { makePolicy: tag }),
        );
        expect(summary.violations).toBe(0);
      }
      const random: PolicyFactory = (code, seat) => randomMovePolicy(seatGenerator(code, seat));
      const options = { hands: 40, seed: 42, size: 9 };
      expect(runPlaytest(options)).not.toEqual(
        runPlaytest(options, undefined, { makePolicy: random }),
      );
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#11 line-up seats play their own style in every hand at sizes 2 to 10',
    () => {
      const started = performance.now();
      for (const lineUp of LINE_UP_PRESETS) {
        for (const size of SIZES) {
          const label = `${lineUp} at ${size}`;
          let steps: { before: HandState; action: Action }[] = [];
          let checked = 0;
          const onHand = (hand: PlayedHand) => {
            const seats = hand.lineUp as readonly LineUpSeat[];
            const code = hand.record.replayCode;
            for (const { before, action } of steps) {
              const view = playerView(before, action.seat);
              const { style } = seats[action.seat - 1] as LineUpSeat;
              const expected =
                style === null
                  ? seededTagPolicy(code)(view)
                  : decideStyle(view, style, botRandom(botDecisionSeed(code, view)));
              expect(action, `${label}, hand ${hand.number}`).toEqual(expected);
              checked++;
            }
            steps = [];
          };
          const summary = runPlaytest({ hands: 30, seed: 42, size, lineUp }, onHand, {
            onAction: (step) => {
              steps.push({ before: step.before, action: step.action });
              return checkStep(step);
            },
          });
          expect(summary.violations, label).toBe(0);
          expect(checked, label).toBe(summary.playerActions);
        }
      }
      console.log(
        `AC#11: 27 line-up runs in ${((performance.now() - started) / 1000).toFixed(1)} s`,
      );

      let out = '';
      const code = main(['--lineup', 'tough', '--size', '9', '--hands', '30'], {
        out: (text) => (out += text),
        err: () => undefined,
      });
      expect(code).toBe(0);
      expect(out).toContain('Line-up: tough, seat 1 plays the user, seat 2 ');
      expect(out).toContain('Invariant violations: 0\n');
      expect(out).not.toContain('Line-up note');
    },
    TEST_TIMEOUT_MS,
  );
});
