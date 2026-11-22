import { describe, expect, it } from 'vitest';
import { computeEquity, type EquityInput, type EquityResult } from '../../src/advice/equity';
import { recommend } from '../../src/advice/recommend';
import { decideRock } from '../../src/bots/rock';
import { TAG_STYLE } from '../../src/bots/tag';
import type { Action, SeatNumber } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator, seededTagPolicy } from '../../src/playtest/policy';
import { handReplayCode, playHand, runPlaytest } from '../../src/playtest/runner';

const TEST_TIMEOUT_MS = 120_000;

/** computeEquity, memoized on its input: returns exactly computeEquity's result. */
const memo = new Map<string, EquityResult>();
function equity(input: EquityInput): EquityResult {
  const k = JSON.stringify(input);
  let result = memo.get(k);
  if (result === undefined) {
    result = computeEquity(input);
    memo.set(k, result);
  }
  return result;
}

const owed = (view: PlayerView): number =>
  view.currentBet - (view.players.find((p) => p.seat === view.seat)?.streetContribution ?? 0);

/** Seat 1's views from the seed-65 random-move collection (A-6), with postflop views too. */
function seatOneViews(): PlayerView[] {
  const views: PlayerView[] = [];
  runPlaytest({ hands: 1000, seed: 65, size: 6 }, undefined, {
    makePolicy: (code, seat) => {
      const policy = randomMovePolicy(seatGenerator(code, seat));
      if (seat !== 1) return policy;
      return (view) => {
        views.push(view);
        return policy(view);
      };
    },
  });
  return views;
}

describe('Rock decision', () => {
  it(
    'Rock folds or checks outside its range and plays the advice inside it',
    () => {
      const views = seatOneViews();
      const preflop = views.find((v) => v.street === 'preflop') as PlayerView;
      expect(() => decideRock(preflop, { style: TAG_STYLE })).toThrow(
        new RangeError('Style TAG has no starting range'),
      );
      expect(() => decideRock(preflop, { style: { ...TAG_STYLE, startingRange: [] } })).toThrow(
        /^Style TAG has no starting range for [A-Z]+ [a-z-]+$/,
      );

      let five: PlayerView | undefined;
      playHand(handReplayCode(65, 1), 5, 1, 1, {
        makePolicy: (code, seat) => {
          const policy = randomMovePolicy(seatGenerator(code, seat));
          return (view) => {
            five ??= view;
            return policy(view);
          };
        },
      });
      expect(() => decideRock(five as PlayerView)).toThrow(
        new RangeError('The 6-max chart needs 6 dealt-in seats, got 5'),
      );

      const postflop = views.filter((v) => v.street !== 'preflop');
      const facing = postflop.filter((v) => owed(v) > 0).slice(0, 3);
      expect(facing).toHaveLength(3);
      for (const view of facing) {
        expect(decideRock(view, { equity })).toEqual(recommend(view, { equity }).move);
      }
      const free = postflop.find((v) => owed(v) === 0) as PlayerView;
      expect(decideRock(free)).toEqual(free.legalActions.find((a) => a.type === 'check'));
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'seated Rocks among seeded TAGs break no invariant',
    () => {
      const rockSeats: readonly SeatNumber[] = [2, 4];
      const preflop: Action['type'][] = [];
      const summary = runPlaytest({ hands: 1000, seed: 42, size: 6 }, undefined, {
        makePolicy: (code, seat) => {
          if (!rockSeats.includes(seat)) return seededTagPolicy(code);
          return (view) => {
            const action = decideRock(view);
            if (view.street === 'preflop') preflop.push(action.type);
            return action;
          };
        },
      });
      expect(summary.violations).toBe(0);
      expect(preflop).toContain('fold');
      expect(preflop).toContain('raise');
    },
    TEST_TIMEOUT_MS,
  );
});
