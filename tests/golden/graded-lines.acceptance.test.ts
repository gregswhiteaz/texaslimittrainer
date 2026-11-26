import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkGradedExample,
  GOLDEN_STACK,
  GOLDEN_STAKES,
  goldenPostflopAdvice,
  GoldenSpotValidationError,
  parseGradedExamples,
  type GradedExample,
} from '../../src/advice/golden';
import { gradeDecision, type ActionType } from '../../src/advice/grade';
import { recommend } from '../../src/advice/recommend';
import { parseCards, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { REPO_ROOT } from '../support/sandbox';

type RawExample = Record<string, unknown>;
type RawFile = { examples: RawExample[] } & Record<string, unknown>;

const RAW = JSON.parse(
  readFileSync(join(REPO_ROOT, 'tests/golden/graded-examples.json'), 'utf8'),
) as RawFile;
const EXAMPLES: readonly GradedExample[] = parseGradedExamples(RAW);

function problemsOf(raw: unknown) {
  try {
    parseGradedExamples(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(GoldenSpotValidationError);
    return (error as GoldenSpotValidationError).problems;
  }
  return [];
}

const fileWith = (...examples: RawExample[]) => ({ ...RAW, examples });

/**
 * Seats 1..n, button 1, the hero dealt `cards` at its hole-card indexes (seat 2 is dealt first, the button last).
 * The board is not needed preflop.
 */
function preflopHand(n: number, hero: number, cards: readonly Card[]): HandState {
  const index = hero === 1 ? n - 1 : hero - 2;
  const rest = Array.from({ length: 52 }, (_, i) => i).filter((c) => !cards.includes(c));
  const deck = Array.from({ length: 52 }, (_, slot) =>
    slot === index ? cards[0] : slot === index + n ? cards[1] : rest.shift(),
  ) as Card[];
  return createHand({
    stakes: GOLDEN_STAKES,
    seats: Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: GOLDEN_STACK })),
    button: 1,
    deck,
  });
}

const JUSTIFICATION =
  'A probe example for the validator that talks about equity and a thin value bet in enough words to pass.';
// The pre-TASK-7.36 top-pair example: the cutoff opens, the button re-raises and the cutoff calls.
const topPair: RawExample = {
  id: 'probe',
  seats: 6,
  holeCards: 'Kh 6h',
  board: '9s Jh 5c Kc 8h',
  street: 'river',
  before: [
    'fold',
    'fold',
    'raise',
    'raise',
    'fold',
    'fold',
    'call',
    'check',
    'check',
    'check',
    'check',
  ],
  userAction: 'check',
  grade: 'minor',
  ruleId: 'aggression-margin',
  marginPts: 6.9,
  justification: JUSTIFICATION,
};
// The pre-TASK-7.36 gutshot example: the cutoff opens and the button calls.
const gutshot: RawExample = {
  id: 'probe',
  seats: 6,
  holeCards: '5d 2h',
  board: '7s 3c 6h',
  street: 'flop',
  before: ['fold', 'fold', 'raise', 'call', 'fold', 'fold', 'bet'],
  userAction: 'fold',
  grade: 'minor',
  ruleId: 'call-fold-margin',
  marginPts: 4.6,
  justification: JUSTIFICATION,
};

describe('graded example preflop lines', () => {
  it('AC#1 no postflop graded example reaches its decision through a hero preflop action the chart grades as a Major error', () => {
    const majors: string[] = [];
    const empty: string[] = [];
    let postflop = 0;
    EXAMPLES.forEach((example, i) => {
      const raw = RAW.examples[i] as RawExample;
      if (raw.board === undefined) return;
      postflop++;
      const hero = example.view.seat;
      let state = preflopHand(raw.seats as number, hero, parseCards(raw.holeCards as string));
      let decisions = 0;
      for (const [k, step] of (raw.before as ActionType[]).entries()) {
        if (state.street !== 'preflop') break;
        const view = playerView(state, state.toAct as number);
        if (state.toAct === hero) {
          decisions++;
          const rec = recommend(view);
          if (gradeDecision(rec, step).grade === 'major') {
            const cell =
              rec.basis === 'chart'
                ? `${rec.referenceSize} ${rec.position} ${rec.situation} ${rec.handClass}: ${rec.action}`
                : rec.action;
            majors.push(`${example.id} step ${k + 1} "${step}" (${cell})`);
          }
        }
        const action = view.legalActions.find((a) => a.type === step);
        expect(action, `${example.id} step ${k + 1}`).toBeDefined();
        const result = applyAction(state, action as NonNullable<typeof action>);
        expect(result.ok, `${example.id} step ${k + 1}`).toBe(true);
        if (result.ok) state = result.state;
      }
      if (decisions === 0) empty.push(example.id);
    });
    expect(postflop).toBe(5);
    expect(empty).toEqual([]);
    expect(majors).toEqual([]);
  });

  it('AC#1 a graded example whose hero preflop line is a Major error is rejected by the validator', () => {
    expect(problemsOf(fileWith(topPair))).toEqual([
      'Graded example probe: hero preflop step 3 "raise" is a Major error on the chart (6-max CO unopened K6s: fold)',
      'Graded example probe: hero preflop step 7 "call" is a Major error on the chart (6-max CO re-raise K6s: fold)',
    ]);
    expect(problemsOf(fileWith(gutshot))).toEqual([
      'Graded example probe: hero preflop step 4 "call" is a Major error on the chart (6-max BTN raise 52o: fold)',
    ]);
    expect(parseGradedExamples(fileWith({ ...topPair, holeCards: 'Kh 7h' }))).toHaveLength(1);
  });

  it('AC#2 re-authored graded examples keep grade, rule id and margin like-for-like', () => {
    expect(EXAMPLES).toHaveLength(9);
    const expected = [
      [
        'graded-postflop-fold-minor-6max-flop-gutshot',
        'Kd 4h',
        'flop',
        'fold',
        'minor',
        'call-fold-margin',
        4.6,
      ],
      [
        'graded-postflop-check-minor-6max-river-top-pair',
        'Kh 7h',
        'river',
        'check',
        'minor',
        'aggression-margin',
        6.9,
      ],
      [
        'graded-postflop-check-major-6max-turn-trips',
        'Ah 3c',
        'turn',
        'check',
        'major',
        'aggression-margin',
        29,
      ],
    ] as const;
    const sorted = (cards: readonly Card[]) => [...cards].sort((a, b) => a - b);
    for (const [id, holeCards, street, userAction, grade, ruleId, marginPts] of expected) {
      const example = EXAMPLES.find((e) => e.id === id);
      expect(example, id).toBeDefined();
      const e = example as GradedExample;
      expect(e.view.players, id).toHaveLength(6);
      expect(sorted(e.view.holeCards), id).toEqual(sorted(parseCards(holeCards)));
      expect(
        {
          street: e.view.street,
          userAction: e.userAction,
          grade: e.grade,
          ruleId: e.ruleId,
          marginPts: e.marginPts,
        },
        id,
      ).toEqual({ street, userAction, grade, ruleId, marginPts });
      expect(checkGradedExample(e), id).toBeNull();
      expect(goldenPostflopAdvice(e.view, e.observed).equityMethod, id).toBe('exact');
    }
  });

  it('AC#2 the golden-spots change log lists each re-authored graded example', () => {
    const doc = readFileSync(join(REPO_ROOT, 'docs/advice/golden-spots.md'), 'utf8');
    const heading = '## Changes from TASK-7.36 (chart-consistent graded example lines)';
    const start = doc.indexOf(heading);
    expect(start).toBeGreaterThanOrEqual(0);
    const next = doc.indexOf('\n## ', start + heading.length);
    const section = doc.slice(start, next === -1 ? undefined : next);
    for (const id of [
      'graded-postflop-fold-minor-6max-flop-gutshot',
      'graded-postflop-check-minor-6max-river-top-pair',
      'graded-postflop-check-major-6max-turn-trips',
    ]) {
      expect(section).toContain(`\`${id}\``);
    }
    for (const margin of ['4.6', '6.9', '29']) expect(section).toContain(margin);
    expect(doc).not.toContain('Graded examples are not checked by this rule.');
  });
});
