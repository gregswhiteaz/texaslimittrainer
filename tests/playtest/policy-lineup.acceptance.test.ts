import { describe, expect, it } from 'vitest';
import { decideManiac } from '../../src/bots/maniac';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import {
  lineUpPolicyFactory,
  randomMovePolicy,
  seatGenerator,
  seededTagPolicy,
} from '../../src/playtest/policy';
import {
  handReplayCode,
  playHand,
  runPlaytest,
  type PolicyFactory,
} from '../../src/playtest/runner';

const TEST_TIMEOUT_MS = 120_000;

describe('lineUpPolicyFactory', () => {
  it(
    'lineUpPolicyFactory plays the preset at every size',
    () => {
      // 30 hands: seed 42's first Tough replacement (which the plain policy run doesn't make) comes after.
      const tough = runPlaytest({ hands: 30, seed: 42, size: 6, lineUp: 'Tough' });
      const maniacAtSeat2: PolicyFactory = (code, seat) =>
        seat === 2
          ? (view) => decideManiac(view, { random: botRandom(botDecisionSeed(code, view)) })
          : seededTagPolicy(code);
      expect(tough).toEqual(
        runPlaytest({ hands: 30, seed: 42, size: 6 }, undefined, { makePolicy: maniacAtSeat2 }),
      );
      expect(tough.violations).toBe(0);
      expect(tough).not.toEqual(runPlaytest({ hands: 30, seed: 42, size: 6 }));

      // 9 seats: seat 2 plays the Maniac and the rest TAG in every hand (no random-move fallback).
      const nine = lineUpPolicyFactory('Tough', 9);
      let differs = false;
      for (let k = 1; k <= 12; k++) {
        const code = handReplayCode(42, k);
        const styled = playHand(code, 9, 1, k, { makePolicy: nine }).record.actions;
        expect(styled).toEqual(
          playHand(code, 9, 1, k, { makePolicy: maniacAtSeat2 }).record.actions,
        );
        const random: PolicyFactory = (c, seat) => randomMovePolicy(seatGenerator(c, seat));
        expect(styled).not.toEqual(playHand(code, 9, 1, k, { makePolicy: random }).record.actions);
        differs ||=
          JSON.stringify(styled) !== JSON.stringify(playHand(code, 9, 1, k).record.actions);
      }
      expect(differs).toBe(true);
      expect(runPlaytest({ hands: 60, seed: 42, size: 9, lineUp: 'Tough' }).violations).toBe(0);

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
