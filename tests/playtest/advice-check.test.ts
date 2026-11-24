import { describe, expect, it } from 'vitest';
import type { ObservedOpponent } from '../../src/advice/ranges';
import { recommend } from '../../src/advice/recommend';
import type { ActionStep } from '../../src/engine/invariants';
import type { PlayerView } from '../../src/engine/player-view';
import {
  AdviceCheck,
  firstDifference,
  observedSnapshot,
  userAdvice,
  type AdviseFn,
} from '../../src/playtest/advice-check';
import { handReplayCode, playHand, type PlayedHand } from '../../src/playtest/runner';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  styleStats,
  type StatHand,
  type StyleCounts,
} from '../../src/stats/style-stats';

const counts = (handsDealt: number, voluntary: number, preflopRaised: number): StyleCounts => ({
  ...EMPTY_STYLE_COUNTS,
  handsDealt,
  voluntary,
  preflopRaised,
});

/** Hand k of seed 42 at 6 seats, with every decision's step and view. */
function played(k: number): { hand: PlayedHand; decisions: [ActionStep, PlayerView][] } {
  const decisions: [ActionStep, PlayerView][] = [];
  const hand = playHand(handReplayCode(42, k), 6, 1, k, {
    onAction: (step, view) => {
      decisions.push([step, view as PlayerView]);
      return [];
    },
  });
  return { hand, decisions };
}

const statHand = (hand: PlayedHand): StatHand => ({
  seats: hand.record.seats,
  actions: hand.final.actions,
  board: hand.final.board,
  result: hand.final.result as StatHand['result'],
});

describe('advice check', () => {
  it('firstDifference', () => {
    const rec = { action: 'call', outs: [1, 2, 3], explanation: 'a' };
    const result = { grade: 'correct', marginPts: null as number | null, recommendation: rec };
    expect(firstDifference(result, structuredClone(result))).toBe('');
    expect(
      firstDifference(result, { ...result, recommendation: { ...rec, explanation: 'b' } }),
    ).toBe('recommendation.explanation');
    expect(
      firstDifference(result, { ...result, recommendation: { ...rec, outs: [1, 9, 3] } }),
    ).toBe('recommendation.outs[1]');
    expect(firstDifference(result, { ...result, recommendation: { ...rec, outs: [1, 2] } })).toBe(
      'recommendation.outs',
    );
    expect(firstDifference(result, { ...result, grade: 'minor' })).toBe('grade');
    expect(firstDifference({ marginPts: null }, { marginPts: 0 })).toBe('marginPts');
    expect(firstDifference({ x: 0 }, { x: -0 })).toBe('x');
    expect(firstDifference({ x: NaN }, { x: 1 })).toBe('x');
    expect(firstDifference({ x: NaN }, { x: NaN })).toBe('');
    expect(firstDifference(1, 2)).toBe('(root)');
    expect(firstDifference('a', 'a')).toBe('');
    expect(firstDifference([1], [2])).toBe('[0]');
    expect(firstDifference({ x: 1, y: 2 }, { x: 1 })).toBe('y');
    expect(firstDifference({ x: 1 }, { y: 1, x: 1 })).toBe('y');
    expect(firstDifference({ x: 1, y: 2 }, { y: 2, x: 1 })).toBe('x');
    expect(firstDifference({ a: { b: [1] } }, { a: { b: {} } })).toBe('a.b');
  });

  it('observed snapshot and isolated inputs', () => {
    const map = new Map<number, StyleCounts>([
      [4, counts(10, 3, 1)],
      [1, counts(40, 10, 8)],
      [2, counts(5, 5, 5)],
      [5, EMPTY_STYLE_COUNTS],
    ]);
    expect(observedSnapshot(map, 2)).toEqual([
      { seat: 1, hands: 40, vpip: 25, pfr: 20 },
      { seat: 4, hands: 10, vpip: 30, pfr: 10 },
    ]);
    expect(observedSnapshot(new Map(), 1)).toEqual([]);

    const calls: { view: PlayerView; observed: readonly ObservedOpponent[] }[] = [];
    const recording: AdviseFn = (view, observed) => {
      calls.push({ view, observed });
      return recommend(view);
    };
    const check = new AdviceCheck(recording);
    const first = played(1);
    const second = played(2);
    const third = played(3);
    expect(first.hand.final.result).not.toBeNull();
    const [step, view] = second.decisions[0] as [ActionStep, PlayerView];
    const snapshotFor = () => {
      calls.length = 0;
      expect(check.onAction(step, view)).toEqual([]);
      expect(calls).toHaveLength(2);
      const [a, b] = calls as [(typeof calls)[0], (typeof calls)[0]];
      expect(a.view).toStrictEqual(view);
      expect(b.view).toStrictEqual(view);
      expect(a.view).not.toBe(view);
      expect(a.view).not.toBe(b.view);
      expect(a.observed).toStrictEqual(b.observed);
      expect(a.observed).not.toBe(b.observed);
      a.observed.forEach((o, i) => expect(o).not.toBe(b.observed[i]));
      return a.observed;
    };

    expect(snapshotFor()).toEqual([]);
    check.add({ ...first.hand, violations: 1 });
    check.add({ ...first.hand, final: { ...first.hand.final, result: null } });
    expect(snapshotFor()).toEqual([]);

    check.add(first.hand);
    const expected = (hands: PlayedHand[], seat: number) => {
      let total = EMPTY_STYLE_COUNTS;
      for (const h of hands) total = addStyleCounts(total, handStyleCounts(statHand(h), seat));
      const stats = styleStats(total);
      return { seat, hands: total.handsDealt, vpip: stats.vpip, pfr: stats.pfr };
    };
    const others = [1, 2, 3, 4, 5, 6].filter((s) => s !== view.seat);
    expect(snapshotFor()).toEqual(others.map((s) => expected([first.hand], s)));

    check.add(second.hand);
    check.add({ ...third.hand, replaced: [3] });
    expect(snapshotFor()).toEqual(
      others.map((s) =>
        s === 3 ? expected([third.hand], s) : expected([first.hand, second.hand, third.hand], s),
      ),
    );
    expect(check.decisions).toBe(4);
    expect(check.mismatches).toBe(0);
    expect(check.firstMismatch).toBeNull();
  });

  it('counts mismatches and keeps the first with its hand, code and action number', () => {
    let n = 0;
    const varying: AdviseFn = (view) => {
      const rec = recommend(view);
      n++;
      return n > 3 ? { ...rec, explanation: `${rec.explanation} #${n}` } : rec;
    };
    const check = new AdviceCheck(varying);
    const { decisions } = played(1);
    const code = handReplayCode(42, 7);
    check.startHand(7, code);
    const results = decisions.slice(0, 3).map(([step, view]) => check.onAction(step, view));
    expect(results[0]).toEqual([]);
    expect(results[1]).toEqual([
      { invariant: 'advice-determinism', message: 'recommendation.explanation differs' },
    ]);
    expect(check.decisions).toBe(3);
    expect(check.mismatches).toBe(2);
    const [step] = decisions[1] as [ActionStep, PlayerView];
    expect(check.firstMismatch).toEqual({
      handNumber: 7,
      replayCode: code,
      actionNumber: 2,
      action: step.action,
      path: 'recommendation.explanation',
    });
    check.startHand(8, handReplayCode(42, 8));
    check.onAction(...(decisions[0] as [ActionStep, PlayerView]));
    expect(check.firstMismatch?.handNumber).toBe(7);
  });

  it('the default advise is the user advice', () => {
    const check = new AdviceCheck();
    const { decisions } = played(1);
    for (const [step, view] of decisions) expect(check.onAction(step, view)).toEqual([]);
    expect(check.decisions).toBe(decisions.length);
    expect(userAdvice(decisions[0]?.[1] as PlayerView, [])).toStrictEqual(
      recommend(decisions[0]?.[1] as PlayerView, {
        opponentRanges: 'actions',
        observedOpponents: [],
      }),
    );
  });
});
