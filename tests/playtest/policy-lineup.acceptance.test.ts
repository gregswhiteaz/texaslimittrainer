import { describe, expect, it } from 'vitest';
import { decideManiac } from '../../src/bots/maniac';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import {
  lineUpPolicyFactory,
  randomMovePolicy,
  seatGenerator,
  seededTagPolicy,
} from '../../src/playtest/policy';
import { runPlaytest, type PolicyFactory } from '../../src/playtest/runner';

const TEST_TIMEOUT_MS = 120_000;

describe('lineUpPolicyFactory', () => {
  it(
    'lineUpPolicyFactory plays the preset at 6 seats and random moves otherwise',
    () => {
      const tough = runPlaytest({ hands: 45, seed: 42, size: 6, lineUp: 'Tough' });
      const maniacAtSeat2: PolicyFactory = (code, seat) =>
        seat === 2
          ? (view) => decideManiac(view, { random: botRandom(botDecisionSeed(code, view)) })
          : seededTagPolicy(code);
      expect(tough).toEqual(
        runPlaytest({ hands: 45, seed: 42, size: 6 }, undefined, { makePolicy: maniacAtSeat2 }),
      );
      expect(tough.violations).toBe(0);
      expect(tough).not.toEqual(runPlaytest({ hands: 45, seed: 42, size: 6 }));

      expect(runPlaytest({ hands: 500, seed: 42, size: 9, lineUp: 'Tough' })).toEqual(
        runPlaytest({ hands: 500, seed: 42, size: 9 }),
      );

      const allRandom: PolicyFactory = (code, seat) => randomMovePolicy(seatGenerator(code, seat));
      expect(
        runPlaytest({ hands: 20, seed: 42, size: 6, lineUp: 'Soft' }, undefined, {
          makePolicy: allRandom,
        }),
      ).toEqual(
        runPlaytest({ hands: 20, seed: 42, size: 6 }, undefined, { makePolicy: allRandom }),
      );

      expect(() => lineUpPolicyFactory('Mixed', 11)).toThrow(RangeError);
    },
    TEST_TIMEOUT_MS,
  );
});
