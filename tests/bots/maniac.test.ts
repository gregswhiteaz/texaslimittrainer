import { describe, expect, it } from 'vitest';
import { recommend } from '../../src/advice/recommend';
import { MANIAC_STYLE, decideManiac } from '../../src/bots/maniac';
import { FREE_CHECK_EQUITY } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import type { Action } from '../../src/engine/hand';
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

describe('Maniac decision', () => {
  it(
    'Maniac draws once only at deviating decisions',
    () => {
      const views = seatOneViews();
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
      const check = views.filter((v) => owed(v) === 0 && advice(v).action === 'check');
      const call = views.filter((v) => owed(v) > 0 && advice(v).action === 'call');
      const capped = views.filter((v) => owed(v) > 0 && v.betCount === 4);
      // Examples A, D, E, B, C, F, G.
      const examples = [check[0], check[1], check[7], call[3], call[1], capped[1], capped[0]].map(
        (v) => v as PlayerView,
      );
      for (const view of examples) {
        const random = stub(4294967295);
        expect(decideManiac(view, { random })).toEqual(advice(view).move);
        expect(random.calls).toBe(1);
        const hot = stub(0);
        decideManiac(view, { random: hot });
        expect(hot.calls).toBe(1);
      }

      const exampleA = examples[0] as PlayerView;
      const exampleB = examples[3] as PlayerView;
      const exampleF = examples[5] as PlayerView;
      // A-1: no generator, no deviation.
      expect(decideManiac(exampleB)).toEqual({ seat: 1, type: 'call', amount: 4 });
      // Capped: the aggressive draw falls back to the legal call.
      expect(decideManiac(exampleF, { random: stub(0) })).toEqual({
        seat: 1,
        type: 'call',
        amount: 14,
      });
      // Owed 0 with no legal bet: no call to fall back to, so the advice's check.
      const noBet = {
        ...exampleA,
        legalActions: exampleA.legalActions.filter((a) => a.type === 'check'),
      };
      const fallback = stub(0);
      expect(decideManiac(noBet, { random: fallback })).toEqual({ seat: 1, type: 'check' });
      expect(fallback.calls).toBe(1);

      const postflopFold = views.find(
        (v) => v.street !== 'preflop' && owed(v) > 0 && advice(v).action === 'fold',
      );
      const preflopRaise = views.find(
        (v) => v.street === 'preflop' && advice(v).action === 'raise',
      );
      const noDeviations = { ...MANIAC_STYLE, deviations: [] };
      const zeroDraw: [PlayerView, object][] = [
        [postflopFold as PlayerView, {}],
        [preflopRaise as PlayerView, {}],
        ...examples.map((v): [PlayerView, object] => [v, { style: noDeviations }]),
      ];
      for (const [view, extra] of zeroDraw) {
        const random = stub(0);
        expect(decideManiac(view, { random, ...extra })).toEqual(advice(view).move);
        expect(random.calls).toBe(0);
      }
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'seated Maniacs among seeded TAGs break no invariant',
    () => {
      const maniacActions: Action[] = [];
      const summary = runPlaytest({ hands: 200, seed: 42, size: 6 }, undefined, {
        makePolicy: (code, seat) =>
          seat === 2 || seat === 4
            ? (view) => {
                const action = decideManiac(view, {
                  random: botRandom(botDecisionSeed(code, view)),
                });
                maniacActions.push(action);
                return action;
              }
            : seededTagPolicy(code),
      });
      expect(summary.violations).toBe(0);
      expect(summary.handsPlayed).toBe(200);
      expect(maniacActions.some((a) => a.type === 'bet')).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );
});
