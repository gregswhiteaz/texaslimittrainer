import { describe, expect, it } from 'vitest';
import { recommend } from '../../src/advice/recommend';
import type { LineUpSeat } from '../../src/bots/lineup';
import type { StyleName } from '../../src/bots/style';
import { BOT_EQUITY } from '../../src/bots/tag';
import type { Action } from '../../src/engine/hand';
import { checkStep, type ActionStep } from '../../src/engine/invariants';
import { playerView } from '../../src/engine/player-view';
import { handReplayCode, playHand, type PlayedHand } from '../../src/playtest/runner';
import {
  formatStyleReport,
  roundStat,
  STYLE_BANDS,
  StyleCheck,
  type MixedCounts,
} from '../../src/playtest/style-check';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  type StatHand,
  type StyleCounts,
} from '../../src/stats/style-stats';

/** Hand `k` of seed 42 at 6 seats, all TAG, played clean. */
const played = (k: number): PlayedHand => playHand(handReplayCode(42, k), 6, 1, k);

const statHandOf = (hand: PlayedHand): StatHand => ({
  seats: hand.record.seats,
  actions: hand.final.actions,
  board: hand.final.board,
  result: hand.final.result as NonNullable<PlayedHand['final']['result']>,
});

/** Seat 1 the user; seats 2.. the given styles. */
const lineUp = (...styles: StyleName[]): LineUpSeat[] => [
  { seat: 1, kind: 'user', style: null, name: null },
  ...styles.map((style, i): LineUpSeat => ({
    seat: i + 2,
    kind: 'bot',
    style,
    name: `Bot ${i + 2}`,
  })),
];

/** TAG counts with `voluntary` of 1000 hands, and enough postflop actions for every stat. */
const tagCounts = (voluntary: number): StyleCounts => ({
  ...EMPTY_STYLE_COUNTS,
  handsDealt: 1000,
  voluntary,
  preflopRaised: 180,
  postflopAggressive: 55,
  postflopCalls: 45,
});

interface Found {
  readonly step: ActionStep;
  readonly situation: string;
  readonly move: Action['type'];
  readonly alternative: string | null;
}

/** Preflop steps of the first 60 all-TAG hands of seed 42, with their chart advice. */
function preflopSteps(): Found[] {
  const found: Found[] = [];
  for (let k = 1; k <= 60; k++) {
    const onAction = (step: ActionStep) => {
      if (step.before.street === 'preflop') {
        const advice = recommend(playerView(step.before, step.action.seat, []), {
          equity: BOT_EQUITY,
        });
        if (advice.basis === 'chart') {
          found.push({
            step,
            situation: advice.situation,
            move: advice.move.type,
            alternative: advice.alternative,
          });
        }
      }
      return checkStep(step);
    };
    playHand(handReplayCode(42, k), 6, 1, k, { onAction });
  }
  return found;
}

/** `step` with the actor's action replaced by one of `type` (amount is ignored by the classifier). */
const withType = ({ before, action, result }: ActionStep, type: string): ActionStep => ({
  before,
  action: { seat: action.seat, type, amount: 0 } as Action,
  result,
});

describe('StyleCheck and the style report', () => {
  it("StyleCheck counts bot seats by their hand's style with the shared style-stat functions", () => {
    const hand = playHand(handReplayCode(42, 1), 3, 1, 1);
    expect(hand.violations).toBe(0);
    const check = new StyleCheck(false);
    check.add({ ...hand, lineUp: lineUp('TAG', 'Rock') });
    const stat = statHandOf(hand);
    expect([...check.counts().keys()].sort()).toEqual(['Rock', 'TAG']);
    expect(check.counts().get('TAG')).toEqual(handStyleCounts(stat, 2));
    expect(check.counts().get('Rock')).toEqual(handStyleCounts(stat, 3));
    expect(check.counts().get('TAG')?.handsDealt).toBe(1);

    const skipped = new StyleCheck(false);
    skipped.add({ ...hand, violations: 1 });
    skipped.add({ ...hand, final: { ...hand.final, result: null } });
    expect(skipped.counts().size).toBe(0);

    const allTag = new StyleCheck(false);
    allTag.add(hand);
    const expected = [1, 2, 3].map((seat) => handStyleCounts(stat, seat)).reduce(addStyleCounts);
    expect(allTag.counts().get('TAG')).toEqual(expected);
    expect(allTag.counts().get('TAG')?.handsDealt).toBe(3);
    expect(allTag.onAction({} as ActionStep)).toEqual([]);
  });

  it('band check rounds to one decimal and treats both band edges as inside', () => {
    expect(roundStat(17.94)).toBe(17.9);
    expect(roundStat(17.95)).toBe(18);
    expect(roundStat(26.05)).toBe(26.1);
    expect(roundStat(null)).toBeNull();

    const tag = (voluntary: number) =>
      formatStyleReport(new Map([['TAG', tagCounts(voluntary)]]), new Map(), true);
    for (const inside of [180, 260]) {
      const report = tag(inside);
      expect(report.passed).toBe(true);
      expect(report.text.endsWith('Style check: passed\n')).toBe(true);
    }
    expect(tag(180).text).toContain(
      'Style: TAG, 1000 hands, VPIP 18.0% (band 18.0-26.0%), PFR 18.0% (band 14.0-22.0%), aggression 55.0% (band 45.0-65.0%)\n',
    );
    expect(tag(179)).toEqual({
      text: expect.stringContaining(
        'Outside band: TAG VPIP 17.9% (band 18.0-26.0%)\nStyle check: failed\n',
      ) as string,
      passed: false,
    });
    expect(tag(261).text).toContain('Outside band: TAG VPIP 26.1% (band 18.0-26.0%)\n');

    const noPostflop = formatStyleReport(
      new Map([['TAG', { ...tagCounts(200), postflopAggressive: 0, postflopCalls: 0 }]]),
      new Map(),
      true,
    );
    expect(noPostflop.passed).toBe(false);
    expect(noPostflop.text).toContain('aggression — (band 45.0-65.0%)\n');
    expect(noPostflop.text).toContain('Outside band: TAG aggression — (band 45.0-65.0%)\n');
    expect(
      formatStyleReport(
        new Map([['TAG', { ...tagCounts(200), postflopAggressive: 0, postflopCalls: 0 }]]),
        new Map(),
        false,
      ).text,
    ).toContain('Style: TAG, 1000 hands, VPIP 20.0%, PFR 18.0%, aggression —\n');

    expect(formatStyleReport(new Map(), new Map(), true)).toEqual({
      text: 'Style check: failed, no bot hands were counted\n',
      passed: false,
    });
    expect(formatStyleReport(new Map(), new Map(), false)).toEqual({ text: '', passed: true });

    const order = formatStyleReport(
      new Map<StyleName, StyleCounts>([
        ['Rock', tagCounts(100)],
        ['Maniac', tagCounts(600)],
        ['TAG', tagCounts(200)],
        ['Calling station', tagCounts(500)],
      ]),
      new Map(),
      false,
    );
    expect(order.passed).toBe(true);
    expect(
      order.text
        .split('\n')
        .filter((line) => line.startsWith('Style: '))
        .map((line) => line.split(',')[0]),
    ).toEqual(['Style: TAG', 'Style: Calling station', 'Style: Maniac', 'Style: Rock']);
    expect(STYLE_BANDS.Rock).toEqual({ vpip: [8, 15], pfr: [6, 12], aggression: [35, 55] });
  });

  it('mixed decisions are classified only in chart cells with an alternative in spots the style marks mixed', () => {
    const steps = preflopSteps();
    const unopened = steps.find(
      (s) => s.situation === 'unopened' && s.alternative !== null && s.step.action.seat !== 1,
    );
    const noAlternative = steps.find((s) => s.situation === 'unopened' && s.alternative === null);
    const reRaise = steps.find((s) => s.situation === 're-raise' && s.alternative !== null);
    expect(unopened && noAlternative && reRaise).toBeDefined();
    const { step, move, alternative } = unopened as Found;
    const seat = step.action.seat;
    const hand = played(1);
    const styles = (style: StyleName): LineUpSeat[] =>
      lineUp('TAG', 'TAG', 'TAG', 'TAG', 'TAG').map((s) =>
        s.seat === seat ? { ...s, style } : s,
      ) as LineUpSeat[];
    const mixedOf = (check: StyleCheck) => check.mixed().get('TAG') as Map<string, MixedCounts>;

    const check = new StyleCheck(true);
    check.onAction(withType(step, move));
    check.onAction(withType(step, move));
    check.onAction(withType(step, alternative as string));
    check.onAction(withType(noAlternative?.step as ActionStep, noAlternative?.move as string));
    check.onAction(withType(reRaise?.step as ActionStep, reRaise?.move as string));
    check.add({ ...hand, lineUp: styles('TAG') });
    expect([...mixedOf(check).keys()]).toEqual([
      'preflop-unopened',
      'preflop-limpers',
      'preflop-raise',
      'preflop-raise-and-calls',
      'preflop-blind-defence',
    ]);
    expect(mixedOf(check).get('preflop-unopened')).toEqual({ recommended: 2, alternative: 1 });
    for (const spot of [
      'preflop-limpers',
      'preflop-raise',
      'preflop-raise-and-calls',
      'preflop-blind-defence',
    ]) {
      expect(mixedOf(check).get(spot)).toEqual({ recommended: 0, alternative: 0 });
    }

    // The buffer was cleared by add: a later hand adds nothing.
    check.add({ ...hand, lineUp: styles('TAG') });
    expect(mixedOf(check).get('preflop-unopened')).toEqual({ recommended: 2, alternative: 1 });

    // A Rock seat's steps are never classified, and a style without mixed spots has no mixed entry.
    const rock = new StyleCheck(true);
    rock.onAction(withType(step, move));
    rock.add({ ...hand, lineUp: styles('Rock') });
    expect(rock.mixed().has('Rock')).toBe(false);
    expect(rock.mixed().get('TAG')?.get('preflop-unopened')).toEqual({
      recommended: 0,
      alternative: 0,
    });

    // Steps of a violating hand are discarded and the buffer is cleared.
    const violating = new StyleCheck(true);
    violating.onAction(withType(step, move));
    violating.add({ ...hand, violations: 1 });
    violating.add({ ...hand, lineUp: styles('TAG') });
    expect(mixedOf(violating).get('preflop-unopened')).toEqual({ recommended: 0, alternative: 0 });

    // Without recording, nothing is buffered.
    const off = new StyleCheck(false);
    off.onAction(withType(step, move));
    off.add({ ...hand, lineUp: styles('TAG') });
    expect(mixedOf(off).get('preflop-unopened')).toEqual({ recommended: 0, alternative: 0 });

    const counts = new Map<StyleName, StyleCounts>([['TAG', tagCounts(200)]]);
    const report = (c: MixedCounts) =>
      formatStyleReport(counts, new Map([['TAG', new Map([['preflop-unopened', c]])]]), true);
    expect(report({ recommended: 0, alternative: 0 })).toEqual({
      text: expect.stringContaining(
        'Mixed spot: TAG preflop-unopened, recommended 0, alternative 0\nStyle check: passed\n',
      ) as string,
      passed: true,
    });
    for (const c of [
      { recommended: 5, alternative: 0 },
      { recommended: 0, alternative: 5 },
    ]) {
      const failed = report(c);
      expect(failed.passed).toBe(false);
      expect(failed.text).toContain(
        `One action only: TAG preflop-unopened, recommended ${c.recommended}, alternative ${c.alternative}\nStyle check: failed\n`,
      );
    }
    // Without check there are no mixed-spot lines.
    expect(
      formatStyleReport(
        counts,
        new Map([['TAG', new Map([['preflop-unopened', { recommended: 5, alternative: 0 }]])]]),
        false,
      ).text,
    ).not.toContain('Mixed spot:');
  });
});
