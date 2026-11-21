import { describe, expect, it } from 'vitest';
import { recommend } from '../../src/advice/recommend';
import { CALLING_STATION_STYLE, decideCallingStation } from '../../src/bots/calling-station';
import { drawDeviation } from '../../src/bots/style';
import { FREE_CHECK_EQUITY } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import type { PlayerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator, seededTagPolicy } from '../../src/playtest/policy';
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

const owed = (view: PlayerView): number =>
  view.currentBet - (view.players.find((p) => p.seat === view.seat)?.streetContribution ?? 0);

/** Seat 1's views in the D-5 collection run (seeded TAG at seat 1 against random seats, seed 61). */
function seatOneViews(): PlayerView[] {
  const views: PlayerView[] = [];
  runPlaytest({ hands: 200, seed: 61, size: 6 }, undefined, {
    makePolicy: (code, seat) => {
      if (seat !== 1) return randomMovePolicy(seatGenerator(code, seat));
      const policy = seededTagPolicy(code);
      return (view) => {
        views.push(view);
        return policy(view);
      };
    },
  });
  return views;
}

describe('Calling station decision', () => {
  it(
    'Calling station draws once only at deviating decisions',
    () => {
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

      const views = seatOneViews();
      // Each view's advice, computed once. A postflop free check never reads equity, so the stand-in skips it there.
      const advices = new Map(
        views.map((v) => [
          v,
          recommend(
            v,
            v.street !== 'preflop' && owed(v) === 0 ? { equity: FREE_CHECK_EQUITY } : {},
          ),
        ]),
      );
      const advice = (v: PlayerView) => advices.get(v) as ReturnType<typeof recommend>;
      const fold = views.filter((v) => advice(v).action === 'fold');
      const raise = views.filter((v) => advice(v).action === 'raise' && owed(v) > 0);
      const exampleA = raise[0] as PlayerView;
      const exampleC = fold[0] as PlayerView;
      const exampleB = fold[30] as PlayerView;
      expect(exampleB.street).toBe('flop');
      for (const view of [exampleA, exampleB, exampleC]) {
        const random = stub(4294967295);
        expect(decideCallingStation(view, { random })).toEqual(recommend(view).move);
        expect(random.calls).toBe(1);
      }
      expect(decideCallingStation(exampleA, { random: stub(0) })).toEqual({
        seat: 1,
        type: 'call',
        amount: 2,
      });
      // A-1: no generator, no deviation.
      expect(decideCallingStation(exampleA)).toEqual({ seat: 1, type: 'raise', amount: 8 });

      const postflopFree = views.find((v) => v.street !== 'preflop' && owed(v) === 0);
      const passive = views.filter((v) => {
        const a = advice(v);
        return v.street === 'preflop' && (a.action === 'call' || a.action === 'check');
      });
      expect(passive.some((v) => advice(v).action === 'call')).toBe(true);
      expect(passive.some((v) => advice(v).action === 'check')).toBe(true);
      const noDeviations = { ...CALLING_STATION_STYLE, deviations: [] };
      const zeroDraw: [PlayerView, object][] = [
        [postflopFree as PlayerView, {}],
        ...passive.map((v): [PlayerView, object] => [v, {}]),
        ...[exampleA, exampleB, exampleC].map((v): [PlayerView, object] => [
          v,
          { style: noDeviations },
        ]),
      ];
      for (const [view, extra] of zeroDraw) {
        const random = stub(0);
        expect(decideCallingStation(view, { random, ...extra })).toEqual(recommend(view).move);
        expect(random.calls).toBe(0);
      }

      // A-4: the big blind's option in a limped pot (advice raise, nothing owed) deviates to the check.
      const free = views.find(
        (v) => v.street === 'preflop' && owed(v) === 0 && advice(v).action === 'raise',
      ) as PlayerView;
      expect(free).toBeDefined();
      const random = stub(0);
      expect(decideCallingStation(free, { random })).toEqual(
        free.legalActions.find((a) => a.type === 'check'),
      );
      expect(random.calls).toBe(1);

      // A view with no legal passive move (unreachable in play) throws.
      const noCall = {
        ...exampleA,
        legalActions: exampleA.legalActions.filter((a) => a.type !== 'call'),
      };
      expect(() => decideCallingStation(noCall, { random: stub(0) })).toThrow(
        'No legal call for seat 1',
      );
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'seated Calling stations among seeded TAGs break no invariant',
    () => {
      const summary = runPlaytest({ hands: 10_000, seed: 42, size: 6 }, undefined, {
        makePolicy: (code, seat) =>
          seat === 2 || seat === 4
            ? (view) =>
                decideCallingStation(view, { random: botRandom(botDecisionSeed(code, view)) })
            : seededTagPolicy(code),
      });
      expect(summary.violations).toBe(0);
      expect(summary.handsPlayed).toBe(10_000);
    },
    TEST_TIMEOUT_MS,
  );
});
