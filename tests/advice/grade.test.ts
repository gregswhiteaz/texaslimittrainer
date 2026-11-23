import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import {
  GRADE_LABELS,
  GRADE_RULE_IDS,
  gradeDecision,
  gradeView,
  type ActionType,
  type ChartGradeInput,
  type EquityGradeInput,
  type Grade,
  type GradeInput,
  type GradeRuleId,
} from '../../src/advice/grade';
import { recommendPostflop, type PostflopRecommendation } from '../../src/advice/postflop';
import {
  FULL_RING_CHART,
  recommendPreflop,
  type PreflopRecommendation,
} from '../../src/advice/preflop';
import { parseCards, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];

/** 4 fold, 5 fold, 6 call, 1 call, 2 complete, 3 check: pot 16, live seats 1, 2, 3, 6. */
const PREFLOP: Step[] = [f(4), f(5), c(6, 4), c(1, 4), c(2, 2), k(3)];
const FLOP_CHECK: Step[] = [...PREFLOP, k(2)];
const FLOP_BET: Step[] = [...PREFLOP, b(2, 4)];

/** Seat 3 (BB, button 1) holds Ah 5h; flop Kh 9h 2c. */
function heroView(steps: Step[], seats: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6]): PlayerView {
  const fixed = new Map<number, Card>();
  const [h1, h2, f1, f2, f3] = parseCards('Ah 5h Kh 9h 2c');
  const n = seats.length;
  const heroIndex = seats.indexOf(3) - 1;
  for (const [position, card] of [
    [heroIndex, h1],
    [heroIndex + n, h2],
    [2 * n + 1, f1],
    [2 * n + 2, f2],
    [2 * n + 3, f3],
  ] as const) {
    fixed.set(position, card as Card);
  }
  const used = new Set(fixed.values());
  const filler = ALL_CARDS.filter((card) => !used.has(card));
  const deck = Array.from({ length: 52 }, (_, i) => fixed.get(i) ?? (filler.shift() as Card));
  let state = createHand({
    stakes: STAKES_4_8,
    seats: seats.map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return playerView(state, 3);
}

function fixedEquity(equity: number) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return {
      hero: { win: equity, tie: 0, equity },
      opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
      method: 'sampled',
      trials: 1,
    };
  };
  return { fn, calls };
}

const equity = (
  action: ActionType,
  numbers: Partial<Omit<EquityGradeInput, 'basis' | 'action'>> = {},
): EquityGradeInput => ({
  basis: 'equity',
  action,
  alternative: null,
  equityPct: 50,
  requiredEquityPct: 0,
  ...numbers,
});

const REQUIRED = 40;
const MARGINS = [0, 9.9, 10, 14.9, 15];

describe('margin boundaries for every postflop rule', () => {
  /** [recommended, user, fixture at a margin of `m` points against the user's action]. */
  const callFold: [ActionType, ActionType, (m: number) => EquityGradeInput][] = [
    [
      'call',
      'fold',
      (m) => equity('call', { equityPct: REQUIRED + m, requiredEquityPct: REQUIRED }),
    ],
    [
      'fold',
      'call',
      (m) => equity('fold', { equityPct: REQUIRED - m, requiredEquityPct: REQUIRED }),
    ],
    [
      'fold',
      'raise',
      (m) => equity('fold', { equityPct: REQUIRED - m, requiredEquityPct: REQUIRED }),
    ],
    [
      'raise',
      'fold',
      (m) => equity('raise', { equityPct: REQUIRED + m, requiredEquityPct: REQUIRED }),
    ],
  ];
  const aggression: [ActionType, ActionType][] = [
    ['bet', 'check'],
    ['raise', 'call'],
    ['check', 'bet'],
    ['call', 'raise'],
  ];

  it.each(callFold)('rec %s, user %s: call-fold margin', (_rec, user, fixture) => {
    const results = MARGINS.map((m) => gradeDecision(fixture(m), user));
    expect(results.map((r) => r.grade)).toEqual(['minor', 'minor', 'major', 'major', 'major']);
    expect(results.map((r) => r.marginPts)).toEqual(MARGINS);
    expect(results.every((r) => r.ruleId === 'call-fold-margin')).toBe(true);
    expect(gradeDecision(fixture(-5), user)).toMatchObject({ grade: 'minor', marginPts: -5 });
  });

  it.each(aggression)('rec %s, user %s: calling-range distance', (rec, user) => {
    for (const side of [1, -1]) {
      const results = MARGINS.map((m) =>
        gradeDecision(equity(rec, { equityVsCallingRangePct: 50 + side * m }), user),
      );
      expect(results.map((r) => r.grade)).toEqual(['minor', 'minor', 'minor', 'minor', 'major']);
      expect(results.map((r) => r.marginPts)).toEqual(MARGINS);
      expect(results.every((r) => r.ruleId === 'aggression-margin')).toBe(true);
    }
  });

  it('no margin below the close-call band is ever major', () => {
    for (let tenth = 0; tenth < 100; tenth++) {
      const m = tenth / 10;
      for (const [, user, fixture] of callFold) {
        expect(gradeDecision(fixture(m), user).grade).toBe('minor');
      }
    }
    for (let tenth = 0; tenth < 150; tenth++) {
      const m = tenth / 10;
      for (const [rec, user] of aggression) {
        const fixture = equity(rec, { equityVsCallingRangePct: 50 + m });
        expect(gradeDecision(fixture, user).grade).toBe('minor');
      }
    }
  });

  it('exactly 10 points is Major whether float subtraction is exact (26.7-16.7) or falls short (16.4-6.4)', () => {
    const result = gradeDecision(
      equity('call', { equityPct: 26.7, requiredEquityPct: 16.7 }),
      'fold',
    );
    expect(result).toMatchObject({ grade: 'major', marginPts: 10 });
    expect(26.7 - 16.7).toBe(10);
    expect(16.4 - 6.4).toBeLessThan(10);
    expect(
      gradeDecision(equity('call', { equityPct: 16.4, requiredEquityPct: 6.4 }), 'fold'),
    ).toMatchObject({ grade: 'major', marginPts: 10 });
  });
});

describe('aggression deviation without calling-range equity is Minor', () => {
  it.each([
    ['check', 'bet'],
    ['call', 'raise'],
  ] as const)('rec %s, user %s', (rec, user) => {
    const expected = { grade: 'minor', ruleId: 'aggression-no-range', marginPts: null };
    expect(gradeDecision(equity(rec), user)).toMatchObject(expected);
    expect(gradeDecision(equity(rec, { equityVsCallingRangePct: null }), user)).toMatchObject(
      expected,
    );
  });
});

describe('real postflop views carry calling-range equity', () => {
  it('real postflop view: advice bet, user checks', () => {
    const result = gradeView(heroView(FLOP_CHECK), 'check', { equity: fixedEquity(0.9).fn });
    expect(result.recommendation).toMatchObject({
      basis: 'equity',
      action: 'bet',
      equityVsCallingRangePct: 90,
    });
    expect(result).toMatchObject({
      grade: 'major',
      ruleId: 'aggression-margin',
      userAction: 'check',
      marginPts: 40,
    });
  });
});

describe('errors', () => {
  const impossible: [ActionType, ActionType][] = [
    ['check', 'fold'],
    ['check', 'call'],
    ['bet', 'fold'],
    ['bet', 'call'],
    ['bet', 'raise'],
  ];

  it.each(impossible)('%s and %s cannot both be legal', (x, y) => {
    for (const [rec, user] of [
      [x, y],
      [y, x],
    ] as const) {
      expect(() => gradeDecision(equity(rec), user)).toThrow(RangeError);
      const preflop: ChartGradeInput = {
        basis: 'chart',
        action: rec,
        alternative: null,
        borderline: true,
      };
      expect(() => gradeDecision(preflop, user)).toThrow(
        new RangeError(`${user} and ${rec} cannot both be legal`),
      );
    }
  });

  it('gradeView rejects an action that is not legal without computing equity', () => {
    const stub = fixedEquity(0.5);
    const view = heroView(FLOP_BET);
    expect(() => gradeView(view, 'bet', { equity: stub.fn })).toThrow(
      new RangeError('bet is not legal for seat 3'),
    );
    expect(() => gradeView(view, 'check', { equity: stub.fn })).toThrow(RangeError);
    expect(stub.calls).toHaveLength(0);
  });

  it("recommend's errors propagate", () => {
    const view = heroView(FLOP_BET);
    expect(() => gradeView({ ...view, toAct: 6 }, 'call', { equity: fixedEquity(0.5).fn })).toThrow(
      new RangeError('Seat 3 is not to act'),
    );
    const bbFacingNothing = heroView([f(4), f(5), f(1), c(2, 2)], [1, 2, 3, 4, 5]);
    expect(() => gradeView(bbFacingNothing, 'check', { chart: FULL_RING_CHART })).toThrow(
      new RangeError('The full-ring chart does not fit 5 dealt-in seats'),
    );
  });
});

describe('determinism, plain data and types', () => {
  it('same inputs give deep-equal, JSON-safe results without mutating the recommendation', () => {
    const fixtures: [GradeInput, ActionType][] = [
      [Object.freeze(equity('call', { equityPct: 30, requiredEquityPct: 16.7 })), 'fold'],
      [Object.freeze(equity('check', { equityVsCallingRangePct: 70 })), 'bet'],
      [
        Object.freeze({ basis: 'chart', action: 'raise', alternative: null, borderline: true }),
        'call',
      ],
    ];
    for (const [rec, user] of fixtures) {
      const snapshot = structuredClone(rec);
      const first = gradeDecision(rec, user);
      expect(gradeDecision(rec, user)).toStrictEqual(first);
      expect(JSON.parse(JSON.stringify(first))).toStrictEqual(first);
      expect(rec).toStrictEqual(snapshot);
      expect(first.recommendation).toBe(rec);
    }
  });

  it('gradeView runs the equity stub twice (whole and calling range) and repeats deep-equal', () => {
    const view = heroView(FLOP_BET);
    const stub = fixedEquity(0.1);
    const first = gradeView(view, 'call', { equity: stub.fn });
    expect(stub.calls).toHaveLength(2);
    expect(gradeView(view, 'call', { equity: stub.fn })).toStrictEqual(first);
    expect(stub.calls).toHaveLength(4);
    expect(JSON.parse(JSON.stringify(first))).toStrictEqual(first);
  });

  it('recommendations are grader inputs and labels are fixed', () => {
    const chartFits = (r: PreflopRecommendation): ChartGradeInput => r;
    const equityFits = (r: PostflopRecommendation): EquityGradeInput => r;
    const preflop = chartFits(recommendPreflop(heroView([f(4), f(5), f(6), f(1), c(2, 2)])));
    const postflop = equityFits(
      recommendPostflop(heroView(FLOP_BET), { equity: fixedEquity(0.08).fn }),
    );
    expect(gradeDecision(preflop, preflop.action).grade).toBe('correct');
    expect(gradeDecision(postflop, 'call')).toMatchObject({ grade: 'minor', marginPts: 8.7 });
    expect(GRADE_LABELS).toStrictEqual({
      correct: 'Correct',
      minor: 'Minor error',
      major: 'Major error',
    });
  });

  it('every rule id is produced', () => {
    const produced = new Set<GradeRuleId>();
    const samples: [GradeInput, ActionType, Grade][] = [
      [equity('call'), 'call', 'correct'],
      [equity('call', { alternative: 'raise' }), 'raise', 'correct'],
      [{ basis: 'chart', action: 'raise', alternative: null, borderline: true }, 'fold', 'minor'],
      [{ basis: 'chart', action: 'raise', alternative: null, borderline: false }, 'fold', 'major'],
      [equity('call', { equityPct: 60, requiredEquityPct: 20 }), 'fold', 'major'],
      [equity('bet', { equityVsCallingRangePct: 80 }), 'check', 'major'],
      [equity('bet'), 'check', 'minor'],
    ];
    for (const [rec, user, grade] of samples) {
      const result = gradeDecision(rec, user);
      expect(result.grade).toBe(grade);
      produced.add(result.ruleId);
    }
    expect([...produced]).toEqual([...GRADE_RULE_IDS]);
  });
});
