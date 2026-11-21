import { describe, expect, it } from 'vitest';
import { gradeDecision, type ActionType, type EquityGradeInput } from '../../src/advice/grade';

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

describe('grader input hardening (TASK-7.23)', () => {
  it('non-finite call-fold equity throws RangeError', () => {
    for (const [rec, user] of CALL_FOLD) {
      for (const field of ['equityPct', 'requiredEquityPct'] as const) {
        for (const value of [NaN, Infinity, -Infinity, undefined]) {
          const fixture = {
            ...equity(rec, { equityPct: 50, requiredEquityPct: 40 }),
            [field]: value,
          };
          const message = `${field} must be a finite number, got ${String(value)}`;
          expect(() => gradeDecision(fixture, user)).toThrow(new RangeError(message));
        }
      }
    }
  });

  it('non-finite calling-range equity throws RangeError', () => {
    for (const [rec, user] of AGGRESSION) {
      for (const value of [NaN, Infinity, -Infinity]) {
        const message = `equityVsCallingRangePct must be a finite number, got ${String(value)}`;
        expect(() => gradeDecision(equity(rec, { equityVsCallingRangePct: value }), user)).toThrow(
          new RangeError(message),
        );
      }
      for (const value of [undefined, null]) {
        expect(gradeDecision(equity(rec, { equityVsCallingRangePct: value }), user)).toMatchObject({
          grade: 'minor',
          ruleId: 'aggression-no-range',
          marginPts: null,
        });
      }
    }
  });

  it('unused non-finite numbers do not throw', () => {
    const allNaN = { equityPct: NaN, requiredEquityPct: NaN, equityVsCallingRangePct: NaN };
    expect(gradeDecision(equity('call', allNaN), 'call')).toMatchObject({
      grade: 'correct',
      ruleId: 'match',
    });
    expect(
      gradeDecision(equity('raise', { ...allNaN, alternative: 'call' }), 'call'),
    ).toMatchObject({ grade: 'correct', ruleId: 'alternative' });
    const finite = { equityPct: 50, requiredEquityPct: 40, equityVsCallingRangePct: NaN };
    expect(gradeDecision(equity('call', finite), 'fold')).toMatchObject({
      grade: 'major',
      ruleId: 'call-fold-margin',
      marginPts: 10,
    });
  });

  it('a -15 wrong-way margin is Minor', () => {
    for (const [rec, user] of CALL_FOLD) {
      const equityPct = user === 'fold' ? 25 : 55;
      expect(gradeDecision(equity(rec, { equityPct, requiredEquityPct: 40 }), user)).toMatchObject({
        grade: 'minor',
        ruleId: 'call-fold-margin',
        marginPts: -15,
      });
    }
  });
});
