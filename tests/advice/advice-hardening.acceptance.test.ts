import { describe, expect, expectTypeOf, it } from 'vitest';
import { explainPostflop } from '../../src/advice/explain';
import { POSTFLOP_TEMPLATES, POT_ODDS_RIVER_BET_CLAUSE } from '../../src/advice/explanations';
import { gradeDecision, type ActionType, type EquityGradeInput } from '../../src/advice/grade';
import { recommendPostflop, type PostflopRecommendation } from '../../src/advice/postflop';
import type { HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import type { TableState } from '../../src/table/session';
import { FLOP_BET, RIVER } from '../support/table-scenarios';

type PostflopInput = Omit<PostflopRecommendation, 'explanation'>;
type WithoutAdviceFields = Omit<
  PostflopRecommendation,
  'requiredCountsRiverBet' | 'valueThresholdPct'
>;

const CLAUSE = ', counting the big bet you will likely face on the river';
const LEAD_WITH_CLAUSE =
  'Pot odds, the cost of a call as a share of the pot after you call, counting the big bet you will likely face on the river, ask';

const turn = (fields: Partial<PostflopInput>): PostflopInput => ({
  basis: 'equity',
  street: 'turn',
  action: 'call',
  alternative: null,
  move: { seat: 5, type: 'call', amount: 8 },
  ruleId: 'pot-odds-call',
  equityPct: 30,
  requiredEquityPct: 26.7,
  requiredCountsRiverBet: false,
  callAmount: 8,
  pot: 22,
  opponents: 1,
  equityMethod: 'exact',
  equityVsCallingRangePct: 30,
  impliedRequiredEquityPct: null,
  outs: [],
  opponentBasis: [],
  valueThresholdPct: 65,
  ...fields,
});

const userView = (t: TableState) => playerView(t.hand as HandState, t.config.userSeat);

const occurrences = (text: string, part: string) => text.split(part).length - 1;

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

const CALL_FOLD = [
  ['call', 'fold'],
  ['fold', 'call'],
  ['fold', 'raise'],
  ['raise', 'fold'],
] as const;
const AGGRESSION = [
  ['bet', 'check'],
  ['raise', 'call'],
  ['check', 'bet'],
  ['call', 'raise'],
] as const;

describe('advice field and river-bet clause hardening (TASK-7.33)', () => {
  it('AC#1 recommendPostflop output has required requiredCountsRiverBet and valueThresholdPct', () => {
    expectTypeOf<PostflopRecommendation['requiredCountsRiverBet']>().toEqualTypeOf<boolean>();
    expectTypeOf<PostflopRecommendation['valueThresholdPct']>().toEqualTypeOf<50 | 65>();

    const { requiredCountsRiverBet, valueThresholdPct, ...fields } = turn({});
    expect([requiredCountsRiverBet, valueThresholdPct]).toEqual([false, 65]);
    const rest: WithoutAdviceFields = { ...fields, explanation: 'Because.' };
    // @ts-expect-error requiredCountsRiverBet is required
    const noRiverBet: PostflopRecommendation = { ...rest, valueThresholdPct: 50 };
    // @ts-expect-error valueThresholdPct is required
    const noThreshold: PostflopRecommendation = { ...rest, requiredCountsRiverBet: false };
    expect(noRiverBet.requiredCountsRiverBet).toBeUndefined();
    expect(noThreshold.valueThresholdPct).toBeUndefined();

    const flop = recommendPostflop(userView(FLOP_BET));
    expect(flop.requiredCountsRiverBet).toBe(false);
    expect(flop.valueThresholdPct).toBe(65);
    const river = recommendPostflop(userView(RIVER));
    expect(river.requiredCountsRiverBet).toBe(false);
    expect(river.valueThresholdPct).toBe(50);
  });

  it('AC#2 every turn explanation that counts the river bet carries the river-bet clause', () => {
    expect(POT_ODDS_RIVER_BET_CLAUSE).toBe(CLAUSE);
    const fold = {
      action: 'fold',
      move: { seat: 5, type: 'fold' },
      ruleId: 'pot-odds-fold',
    } as const;
    const cases = [
      turn({
        action: 'raise',
        move: { seat: 5, type: 'raise', amount: 16 },
        ruleId: 'value-raise',
      }),
      turn({}),
      turn({
        ruleId: 'implied-odds-call',
        impliedRequiredEquityPct: 10,
        outs: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      }),
      turn({ ...fold, equityPct: 22 }),
      turn({ ...fold, equityPct: 8, impliedRequiredEquityPct: 10 }),
    ];
    for (const input of cases) {
      const w = explainPostflop({ ...input, requiredCountsRiverBet: true }, 65);
      const n = explainPostflop({ ...input, requiredCountsRiverBet: false }, 65);
      expect(occurrences(w, LEAD_WITH_CLAUSE)).toBe(1);
      expect(n).not.toContain('counting the big bet');
      expect(w.replace(CLAUSE, '')).toBe(n);
    }

    const observed = turn({
      requiredCountsRiverBet: true,
      opponentBasis: [{ seat: 2, observedHands: 45, text: 'based on 45 hands of this opponent' }],
    });
    const text = explainPostflop(observed, 65);
    expect(text.startsWith('Ranges here follow the opponent type')).toBe(true);
    expect(occurrences(text, LEAD_WITH_CLAUSE)).toBe(1);
  });

  it('AC#2 every template a bet facing the hero can use has one river-bet slot', () => {
    for (const key of [
      'value-raise',
      'pot-odds-call',
      'implied-odds-call',
      'pot-odds-fold',
      'pot-odds-fold-implied',
    ] as const) {
      const template = POSTFLOP_TEMPLATES[key];
      expect(occurrences(template, '{riverBet}'), key).toBe(1);
      expect(template, key).toContain('{def:pot-odds}{riverBet}');
    }
  });

  it('AC#3 a non-finite valueThresholdPct is rejected like other non-finite percent fields', () => {
    for (const [rec, user] of AGGRESSION) {
      for (const value of [NaN, Infinity, -Infinity]) {
        const message = `valueThresholdPct must be a finite number, got ${String(value)}`;
        expect(() =>
          gradeDecision(
            equity(rec, { equityVsCallingRangePct: 70, valueThresholdPct: value }),
            user,
          ),
        ).toThrow(new RangeError(message));
      }
      expect(() =>
        gradeDecision(equity(rec, { equityVsCallingRangePct: NaN, valueThresholdPct: NaN }), user),
      ).toThrow(new RangeError('equityVsCallingRangePct must be a finite number, got NaN'));
    }
  });

  it('AC#3 an absent or unused valueThresholdPct does not throw', () => {
    for (const [rec, user] of AGGRESSION) {
      for (const value of [undefined, null]) {
        expect(
          gradeDecision(
            equity(rec, { equityVsCallingRangePct: 70, valueThresholdPct: value }),
            user,
          ),
        ).toMatchObject({ grade: 'major', ruleId: 'aggression-margin', marginPts: 20 });
      }
      expect(
        gradeDecision(equity(rec, { equityVsCallingRangePct: 70, valueThresholdPct: 65 }), user),
      ).toMatchObject({ grade: 'minor', ruleId: 'aggression-margin', marginPts: 5 });
      expect(
        gradeDecision(equity(rec, { equityVsCallingRangePct: null, valueThresholdPct: NaN }), user),
      ).toMatchObject({ grade: 'minor', ruleId: 'aggression-no-range', marginPts: null });
      expect(
        gradeDecision(equity(rec, { equityVsCallingRangePct: 70, valueThresholdPct: NaN }), rec),
      ).toMatchObject({ grade: 'correct', ruleId: 'match' });
    }
    for (const [rec, user] of CALL_FOLD) {
      expect(
        gradeDecision(
          equity(rec, { equityPct: 50, requiredEquityPct: 40, valueThresholdPct: NaN }),
          user,
        ),
      ).toMatchObject({ ruleId: 'call-fold-margin' });
    }
  });
});
