import { beforeAll, describe, expect, it } from 'vitest';
import { formatPct } from '../../src/advice/explain';
import { CONCEPTS } from '../../src/advice/explanations';
import { POSTFLOP_RULE_IDS } from '../../src/advice/postflop';
import { APPLICABLE_SPOTS } from '../../src/advice/preflop-chart';
import { recommend, type Recommendation, type RecommendOptions } from '../../src/advice/recommend';
import { BOT_EQUITY } from '../../src/bots/tag';
import type { PlayerView } from '../../src/engine/player-view';
import { handReplayCode, playHand } from '../../src/playtest/runner';
import { lineUpPolicyFactory } from '../../src/playtest/policy';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const TIMEOUT = 120_000;
const OPTIONS: RecommendOptions = { opponentRanges: 'actions', equity: BOT_EQUITY };

/** Every seat's decision views from Mixed line-up hands 1, 2, … (seed 7310), until `count` are captured. */
function sampleViews(count: number): PlayerView[] {
  const views: PlayerView[] = [];
  for (let k = 1; views.length < count; k++) {
    const size = 2 + (k % 9);
    const lineUp = lineUpPolicyFactory('Mixed', size);
    playHand(handReplayCode(7310, k), size, (k % size) + 1, k, {
      makePolicy: (code, seat) => {
        const policy = lineUp(code, seat);
        return (view) => {
          views.push(view);
          return policy(view);
        };
      },
    });
  }
  return views.slice(0, count);
}

const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+/);
const namesConcept = (sentence: string, terms: readonly string[]) =>
  new RegExp('\\b(' + terms.join('|') + ')\\b', 'i').test(sentence);

// D-6 split: every push checks the first 2,000 decisions of the A-3 sample; the full 10,000 is opt-in
// (TLH_SLOW_TESTS=1, npm run test:slow). Both run the same assertions.
function sampleChecks(sampleSize: number) {
  let views: PlayerView[] = [];
  let advice: Recommendation[] = [];

  beforeAll(() => {
    views = sampleViews(sampleSize);
    advice = views.map((view) => recommend(view, OPTIONS));
  }, TIMEOUT);

  it(
    'AC#1 every explanation in a 10,000-decision playtest sample has at most three sentences',
    () => {
      expect(advice).toHaveLength(sampleSize);
      const rules = new Set<string>();
      const spots = new Set<string>();
      for (const rec of advice) {
        expect(typeof rec.explanation).toBe('string');
        expect(rec.explanation.length).toBeGreaterThan(0);
        const sentences = sentencesOf(rec.explanation);
        expect(sentences.length).toBeGreaterThanOrEqual(1);
        expect(sentences.length).toBeLessThanOrEqual(3);
        for (const sentence of sentences) expect(sentence).toMatch(/[.!?]$/);
        if (rec.basis === 'equity') rules.add(rec.ruleId);
        else spots.add(`${rec.referenceSize} ${rec.situation}`);
      }
      expect(rules).toEqual(new Set(POSTFLOP_RULE_IDS));
      const applicable = Object.entries(APPLICABLE_SPOTS).flatMap(([size, list]) =>
        list.map((spot) => `${size} ${spot.situation}`),
      );
      expect(spots).toEqual(new Set(applicable));
    },
    TIMEOUT,
  );

  it(
    'AC#2 every explanation names a concept from the list',
    () => {
      expect(CONCEPTS.map((c) => c.name)).toEqual([
        'pot odds',
        'equity',
        'position',
        'hand strength',
        'outs and draws',
        'implied odds',
        'value bet',
        'bluff',
        'opponent type',
        'initiative',
      ]);
      for (const rec of advice) {
        const named = CONCEPTS.some((c) => namesConcept(rec.explanation, c.terms));
        if (!named) expect(rec.explanation).toBe('an explanation naming a concept');
      }
    },
    TIMEOUT,
  );

  it(
    'AC#3 the first sentence naming a concept contains its definition',
    () => {
      for (const rec of advice) {
        const sentences = sentencesOf(rec.explanation);
        for (const concept of CONCEPTS) {
          const first = sentences.find((s) => namesConcept(s, concept.terms));
          if (first !== undefined) expect(first).toContain(concept.definition);
        }
      }
    },
    TIMEOUT,
  );

  it(
    'AC#4 postflop explanations quote the equity and required equity the advice returns',
    () => {
      for (const rec of advice) {
        const text = rec.explanation;
        if (rec.basis === 'chart') {
          expect(text).not.toContain('%');
          continue;
        }
        expect(text).toContain(formatPct(rec.equityPct));
        expect(text).toContain(formatPct(rec.requiredEquityPct));
        if (
          rec.ruleId === 'value-bet' ||
          rec.ruleId === 'check-free' ||
          rec.ruleId === 'value-raise'
        ) {
          expect(text).toContain(formatPct(rec.equityVsCallingRangePct));
          expect(text).toContain('50.0%');
        }
        if (rec.ruleId === 'implied-odds-call') {
          expect(rec.impliedRequiredEquityPct).not.toBeNull();
          expect(text).toContain(formatPct(rec.impliedRequiredEquityPct as number));
          expect(text).toContain(`${rec.outs.length} outs`);
        }
      }
    },
    TIMEOUT,
  );

  it(
    'AC#5 the same decision always gets the same explanation',
    () => {
      for (let i = 0; i < 500; i++) {
        const again = recommend(structuredClone(views[i] as PlayerView), OPTIONS);
        const first = advice[i] as Recommendation;
        expect(again.explanation).toBe(first.explanation);
        expect(again).toEqual(first);
      }
    },
    TIMEOUT,
  );
}

describe('explanations on the first 2,000 decisions of the playtest sample', () =>
  sampleChecks(2_000));

describe.runIf(SLOW)('explanations on a 10,000-decision playtest sample', () =>
  sampleChecks(10_000),
);
