import { describe, expect, it } from 'vitest';
import { seatLineUp, type LineUpPreset } from '../../src/bots/lineup';
import { MAX_BETS_PER_STREET, checkStep, type Violation } from '../../src/engine/invariants';
import { showdownOf, type EarlierShowdown } from '../../src/engine/player-view';
import { main } from '../../src/playtest/cli';
import { seatStylesPolicyFactory } from '../../src/playtest/policy';
import {
  composeChecks,
  playHand,
  runPlaytest,
  type ActionHook,
  type PlayedHand,
  type PlaytestSeams,
  type PolicyFactory,
} from '../../src/playtest/runner';
import { FAULTS } from '../support/faulty-engine';

const TOUGH_SIX = seatLineUp('Tough', 6, 1);
const TEST_TIMEOUT_MS = 120_000;

/** Runs Tough at 6 seats with a policy that records every decision's earlierShowdowns, grouped by hand.
 *  `seamsFor` gets the hands played so far (live), for hooks that depend on the hand number. */
function recordShowdowns(
  hands: number,
  seamsFor: (played: readonly PlayedHand[]) => Omit<PlaytestSeams, 'makePolicy'> = () => ({}),
) {
  const inner = seatStylesPolicyFactory(TOUGH_SIX);
  const perHand: (readonly EarlierShowdown[])[][] = [];
  const played: PlayedHand[] = [];
  let current: (readonly EarlierShowdown[])[] = [];
  const makePolicy: PolicyFactory = (code, seat) => {
    const policy = inner(code, seat);
    return (view) => {
      current.push(view.earlierShowdowns);
      return policy(view);
    };
  };
  const summary = runPlaytest(
    { hands, seed: 42, size: 6, lineUp: 'Tough' },
    (hand) => {
      played.push(hand);
      perHand.push(current);
      current = [];
    },
    { ...seamsFor(played), makePolicy },
  );
  return { summary, perHand, played };
}

const MANIAC_SEATS = new Set(TOUGH_SIX.filter((s) => s.style === 'Maniac').map((s) => s.seat));

/** A test style check: a Maniac seat never folds preflop when it owes nothing. */
const styleCheck: ActionHook = ({ before, action }) => {
  const player = before.players.find((p) => p.seat === action.seat);
  const owed = before.currentBet - (player?.streetContribution ?? 0);
  return MANIAC_SEATS.has(action.seat) &&
    before.street === 'preflop' &&
    action.type === 'fold' &&
    owed === 0
    ? [{ invariant: 'style-check', message: `Maniac seat ${action.seat} folded owing nothing` }]
    : [];
};
const alwaysFires: ActionHook = () => [{ invariant: 'style-check', message: 'forced' }];

/** Postflop bets/raises and postflop streets that reached the cap over a 2,000-hand 6-seat line-up run. */
function postflopBetting(preset: LineUpPreset) {
  let betsAndRaises = 0;
  let cappedStreets = 0;
  const summary = runPlaytest({ hands: 2000, seed: 42, size: 6, lineUp: preset }, (hand) => {
    const perStreet = new Map<string, number>();
    for (const a of hand.final.actions) {
      if (a.street === 'preflop' || (a.type !== 'bet' && a.type !== 'raise')) continue;
      betsAndRaises++;
      perStreet.set(a.street, (perStreet.get(a.street) ?? 0) + 1);
    }
    cappedStreets += [...perStreet.values()].filter((n) => n >= MAX_BETS_PER_STREET).length;
  });
  return { summary, betsAndRaises, cappedStreets };
}

describe('Style bots in the playtest', () => {
  it(
    'the playtest passes each seat the earlier showdowns from previous hands',
    () => {
      const { summary, perHand, played } = recordShowdowns(300);
      expect(summary.violations).toBe(0);
      expect(perHand).toHaveLength(300);
      const expected: EarlierShowdown[] = [];
      let nonEmpty = 0;
      perHand.forEach((decisions, k) => {
        expect(decisions.length).toBeGreaterThan(0);
        // Every decision of a hand gets the same list, so compare each distinct list once.
        for (const seen of new Set(decisions)) {
          expect(seen).toEqual(expected);
          if (seen.length > 0) nonEmpty++;
        }
        const entry = showdownOf((played[k] as PlayedHand).final);
        if (entry !== null) expected.push(entry);
      });
      expect(perHand[0]?.every((seen) => seen.length === 0)).toBe(true);
      expect(nonEmpty).toBeGreaterThan(0);
      expect(expected.length).toBeGreaterThan(0);
      expect(expected.length).toBeLessThan(300);

      const unwrapped = runPlaytest({ hands: 300, seed: 42, size: 6, lineUp: 'Tough' }, undefined, {
        makePolicy: seatStylesPolicyFactory(TOUGH_SIX),
      });
      expect(summary).toEqual(unwrapped);

      // A violation in hand 6 restarts the table, so hand 7 starts over with no earlier showdowns. (Hand 5 before
      // TASK-7.32: with bots folding more after the flop, the first showdown is now hand 5.)
      const flagged = recordShowdowns(8, (done) => ({
        onAction: (step) =>
          done.length === 5 && step.result.ok && step.result.state.result !== null
            ? [{ invariant: 'custom', message: 'flagged' }]
            : checkStep(step),
      }));
      expect(flagged.played.map((hand) => hand.violations)).toEqual([0, 0, 0, 0, 0, 1, 0, 0]);
      const earlier = flagged.played.slice(0, 5).filter((hand) => showdownOf(hand.final) !== null);
      expect(earlier.length).toBeGreaterThan(0);
      expect(flagged.perHand[5]?.every((seen) => seen.length === earlier.length)).toBe(true);
      expect(flagged.perHand[6]?.every((seen) => seen.length === 0)).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'bot style checks are composed with checkStep through the onAction hook',
    () => {
      let seen = 0;
      const counting: ActionHook = (step) => {
        seen++;
        return styleCheck(step);
      };
      let out = '';
      const code = main(
        ['--hands', '200', '--seed', '42', '--size', '6', '--lineup', 'tough'],
        { out: (t) => (out += t), err: () => undefined },
        { onAction: composeChecks(checkStep, counting) },
      );
      expect(code).toBe(0);
      const lines = out.split('\n');
      expect(lines).toContain('Invariant violations: 0');
      expect(lines).toContain(`Player actions: ${seen}`);
      expect(seen).toBeGreaterThan(0);

      // A faulty engine (a chip on the first action) and a style check that always fires, alone and together.
      const options = { hands: 20, seed: 42, size: 6, lineUp: 'Tough' } as const;
      const { hands } = options;
      const engine = FAULTS.chipsCreated.seams.engine;
      const chips = runPlaytest(options, undefined, {
        engine,
        onAction: composeChecks(checkStep, styleCheck),
      });
      expect(chips.violationCounts.chips).toBe(hands);
      expect(chips.violationCounts['style-check']).toBeUndefined();

      const style = runPlaytest(options, undefined, {
        onAction: composeChecks(checkStep, alwaysFires),
      });
      expect(style.violationCounts['style-check']).toBe(hands);
      expect(style.violationCounts.chips).toBe(0);

      const both = runPlaytest(options, undefined, {
        engine,
        onAction: composeChecks(checkStep, alwaysFires),
      });
      expect(both.violationCounts).toMatchObject({ chips: hands, 'style-check': hands });
      const ids = (both.firstViolation?.violation?.violations ?? []).map(
        (v: Violation) => v.invariant,
      );
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(ids.at(-1)).toBe('style-check');
      expect(ids.slice(0, -1).every((id) => id === 'chips')).toBe(true);

      const empty: (readonly Violation[])[] = [];
      runPlaytest({ ...options, hands: 1 }, undefined, {
        onAction: (step) => {
          empty.push(composeChecks()(step));
          return checkStep(step);
        },
      });
      expect(empty.length).toBeGreaterThan(0);
      expect(empty.every((found) => found.length === 0)).toBe(true);
      expect(runPlaytest.length).toBe(2);
      expect(playHand.length).toBe(3);
      expect(main.length).toBe(2);
      const seamKeys: Record<keyof PlaytestSeams, true> = {
        makePolicy: true,
        onAction: true,
        engine: true,
      };
      expect(Object.keys(seamKeys)).toHaveLength(3);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'a 6-player line-up with betting policies exercises postflop bets and the postflop cap',
    () => {
      const tough = postflopBetting('Tough');
      expect(tough.summary.violations).toBe(0);
      expect(tough.betsAndRaises).toBeGreaterThan(0);
      expect(tough.cappedStreets).toBeGreaterThanOrEqual(1);

      const mixed = postflopBetting('Mixed');
      expect(mixed.summary.violations).toBe(0);
      expect(mixed.betsAndRaises).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );
});
