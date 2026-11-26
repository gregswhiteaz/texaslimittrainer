import { describe, expect, it } from 'vitest';
import { explainPostflop } from '../../src/advice/explain';
import { VALUE_THRESHOLD_PCT, type PostflopRecommendation } from '../../src/advice/postflop';

type PostflopInput = Omit<PostflopRecommendation, 'explanation'>;

const input = (fields: Partial<PostflopInput>): PostflopInput => ({
  basis: 'equity',
  street: 'flop',
  action: 'check',
  alternative: null,
  move: { seat: 5, type: 'check' },
  ruleId: 'check-free',
  equityPct: 60,
  requiredEquityPct: 0,
  callAmount: 0,
  pot: 20,
  opponents: 1,
  equityMethod: 'exact',
  equityVsCallingRangePct: 45,
  impliedRequiredEquityPct: null,
  outs: [],
  opponentBasis: [],
  requiredCountsRiverBet: false,
  valueThresholdPct: 50,
  ...fields,
});

/** Sentences split after . ! or ? followed by a space and a capital letter. */
const sentences = (text: string): string[] => text.split(/(?<=[.!?])\s+(?=[A-Z])/);

describe('value-rule copy (AC#12)', () => {
  it('the 50% comparison names the calling-range equity', () => {
    const cases: Partial<PostflopInput>[] = [
      { ruleId: 'check-free', action: 'check', equityPct: 60, equityVsCallingRangePct: 45 },
      { ruleId: 'value-bet', action: 'bet', equityPct: 70, equityVsCallingRangePct: 55 },
      { ruleId: 'value-bet', action: 'raise', equityPct: 70, equityVsCallingRangePct: 55 },
      {
        ruleId: 'value-raise',
        action: 'raise',
        equityPct: 75,
        equityVsCallingRangePct: 62,
        requiredEquityPct: 16.7,
        callAmount: 4,
      },
    ];
    for (const fields of cases) {
      const text = explainPostflop(input(fields), VALUE_THRESHOLD_PCT);
      const all = sentences(text);
      expect(all).toHaveLength(3);
      const comparing = all.filter((s) => s.includes('50.0%'));
      expect(comparing).toHaveLength(1);
      const [sentence = ''] = comparing;
      expect(sentence).toContain('hands that would call');
      expect(sentence).not.toMatch(/^That\b/);
      expect(sentence).toMatch(
        /^Your equity against the hands that would call is (not )?above 50\.0%/,
      );
    }
    const checkFree = explainPostflop(input({}), VALUE_THRESHOLD_PCT);
    expect(checkFree).toContain('60.0% against all their hands and 45.0% against the hands');
    expect(checkFree).toContain('Your equity against the hands that would call is not above 50.0%');
  });
});
