import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkGoldenSpot,
  checkGradedExample,
  goldenPostflopAdvice,
  GOLDEN_FORMAT,
  GoldenSpotValidationError,
  GRADED_FORMAT,
  parseGoldenSpots,
  parseGradedExamples,
  parsePostflopGoldenSpots,
  type GoldenNumbers,
  type GradedExample,
  type PostflopGoldenSpot,
} from '../../src/advice/golden';
import type { GradeInput } from '../../src/advice/grade';
import { parseCards } from '../../src/engine/cards';
import { REPO_ROOT } from '../support/sandbox';

type RawSpot = Record<string, unknown>;
type Advise = Parameters<typeof parsePostflopGoldenSpots>[1];

const JUSTIFICATION =
  'Top pair with the best kicker is ahead of most hands that checked, so make a value bet in position now.';
const FLOP = ['fold', 'fold', 'fold', 'raise', 'fold', 'call'];

// 6-max: the button opens, the big blind calls and checks the flop to the button (the hero).
const base = (extra: RawSpot = {}): RawSpot => ({
  id: 'probe',
  seats: 6,
  position: 'BTN',
  street: 'flop',
  holeCards: 'As Qd',
  board: 'Ah 8c 3d',
  before: [...FLOP, 'check'],
  action: 'bet',
  justification: JUSTIFICATION,
  ...extra,
});
// The same flop with the big blind betting into the button.
const facing = (extra: RawSpot = {}) =>
  base({ before: [...FLOP, 'bet'], action: 'call', ...extra });

const file = (...spots: unknown[]) => ({ format: GOLDEN_FORMAT, version: 1, spots });
const numbers =
  (equityPct: number, requiredEquityPct: number, equityVsCallingRangePct: number): Advise =>
  () => ({ action: 'call', equityPct, requiredEquityPct, equityVsCallingRangePct });
/** Clear for a recorded bet (V 80) and a recorded call (E − R 40, V 30). */
const CLEAR = numbers(60, 20, 80);
const CLEAR_CALL = numbers(60, 20, 30);

function problemsOf(raw: unknown, advise: Advise = CLEAR): readonly string[] {
  try {
    parsePostflopGoldenSpots(raw, advise);
  } catch (error) {
    expect(error).toBeInstanceOf(GoldenSpotValidationError);
    return (error as GoldenSpotValidationError).problems;
  }
  return [];
}

const P = 'Golden spot probe';
const one = (spot: RawSpot, advise: Advise = CLEAR) =>
  parsePostflopGoldenSpots(file(spot), advise)[0] as PostflopGoldenSpot;

describe('postflop golden spot validator', () => {
  it('accepts a valid spot and rejects a wrong header or a missing or repeated id', () => {
    expect(problemsOf(file(base()))).toEqual([]);
    const header = 'Golden spot file: expected format "tlh-golden-spots" version 1';
    expect(problemsOf({ ...file(base()), version: 2 })).toEqual([header]);
    expect(problemsOf(null)).toEqual([header]);
    expect(problemsOf(file(base(), base({ id: undefined })))).toEqual([
      'Golden spot #2: missing id',
    ]);
    expect(problemsOf(file(base(), base()))).toEqual([`${P}: duplicate id`]);
    expect(problemsOf({ format: GOLDEN_FORMAT, version: 1 })).toEqual([]);
  });

  it('rejects a board of the wrong size, with a repeated card or with a hole card', () => {
    const bad = `${P}: missing player view (board must be 3 to 5 different cards not in holeCards)`;
    for (const board of ['Ah 8c', 'Ah 8c 3d 4s 5s 6s', 'Ah 8c 8c', 'As 8c 3d', 'Zz Yy Xx', 7]) {
      expect(problemsOf(file(base({ board }))), String(board)).toEqual([bad]);
    }
  });

  it('rejects steps that do not reach the board street and a street that does not match the board', () => {
    expect(problemsOf(file(base({ board: 'Ah 8c 3d 4s', street: 'turn' })))).toEqual([
      `${P}: missing player view (the steps do not reach a turn decision)`,
    ]);
    expect(problemsOf(file(base({ before: 'check' })))).toEqual([
      `${P}: missing player view (the steps do not reach a flop decision)`,
    ]);
    expect(problemsOf(file(base({ before: [...FLOP, 'check', 'shove'] })))).toEqual([
      `${P}: missing player view (step 8 "shove" is not legal)`,
    ]);
    expect(problemsOf(file(base({ street: 'turn' })))).toEqual([
      `${P}: street turn does not match the board (flop)`,
    ]);
    expect(problemsOf(file(base({ street: undefined })))).toEqual([
      `${P}: street <undefined> does not match the board (flop)`,
    ]);
  });

  it('rejects a preflop situation, a wrong position and illegal actions', () => {
    expect(problemsOf(file(base({ situation: 'raise' })))).toEqual([
      `${P}: situation is a preflop field`,
    ]);
    expect(problemsOf(file(base({ position: 'CO' })))).toEqual([
      `${P}: position CO does not match the view (BTN)`,
    ]);
    expect(problemsOf(file(base({ action: 'shove' })))).toEqual([
      `${P}: recommended action "shove" is not legal in the view`,
    ]);
    expect(problemsOf(file(facing({ action: 'bet' })))).toEqual([
      `${P}: recommended action "bet" is not legal in the view`,
    ]);
    expect(problemsOf(file(base({ action: null })))).toEqual([`${P}: missing recommended action`]);
    expect(problemsOf(file(base({ alternative: 'call' })))).toEqual([
      `${P}: invalid alternative "call"`,
    ]);
    expect(problemsOf(file(base({ alternative: ['check'] })))).toEqual([
      `${P}: more than one acceptable alternative`,
    ]);
    expect(problemsOf(file(base({ alternative: 'bet' })))).toEqual([
      `${P}: alternative repeats the recommended action`,
    ]);
  });

  it('validates opponent stats and carries valid ones through as observed', () => {
    for (const opponentStats of [
      { 4: { hands: 40, vpip: 120, pfr: 10 } },
      { 4: { hands: 40 } },
      { 4: { hands: 40.5, vpip: 30, pfr: 20 } },
      { 4: { hands: 40, vpip: 30, pfr: 20, af: 2 } },
      { 11: { hands: 40, vpip: 30, pfr: 20 } },
      { 4: 5 },
      [],
    ]) {
      expect(problemsOf(file(base({ opponentStats }))), JSON.stringify(opponentStats)).toEqual([
        `${P}: invalid opponent stats`,
      ]);
    }
    const seen: unknown[] = [];
    const spot = one(
      base({ opponentStats: { 4: { hands: 40, vpip: 30, pfr: 20 } } }),
      (_view, observed): GoldenNumbers => {
        seen.push(observed);
        return { action: 'bet', equityPct: 60, requiredEquityPct: 0, equityVsCallingRangePct: 80 };
      },
    );
    expect(spot.observed).toEqual([{ seat: 4, hands: 40, vpip: 30, pfr: 20 }]);
    expect(seen[0]).toBe(spot.observed);
    expect(one(base()).observed).toEqual([]);
  });

  it('reports advice that throws', () => {
    const boom: Advise = () => {
      throw new RangeError('boom');
    };
    expect(problemsOf(file(base()), boom)).toEqual([`${P}: advice failed (boom)`]);
  });

  it('applies the clear-cut rule to every other legal action', () => {
    const fold = facing({ action: 'fold' });
    expect(problemsOf(file(fold), numbers(20, 29.9, 20))).toEqual([
      `${P}: not clear-cut, call would be a Minor error (call-fold-margin 9.9 points; clear-cut needs 10)`,
      `${P}: not clear-cut, raise would be a Minor error (call-fold-margin 9.9 points; clear-cut needs 10)`,
    ]);
    expect(problemsOf(file(fold), numbers(20, 30, 20))).toEqual([]);
    expect(problemsOf(file(facing({ action: 'raise' })), numbers(70, 20, 64.9))).toEqual([
      `${P}: not clear-cut, call would be a Minor error (aggression-margin 14.9 points; clear-cut needs 15)`,
    ]);
    expect(problemsOf(file(facing()), numbers(22, 25, 20))).toEqual([
      `${P}: not clear-cut, fold would be a Minor error (call-fold-margin -3 points; clear-cut needs 10)`,
    ]);
    expect(problemsOf(file(facing({ alternative: 'raise' })), numbers(60, 20, 50))).toEqual([]);
    expect(problemsOf(file(facing()), CLEAR_CALL)).toEqual([]);
  });

  it('lists every problem in a file', () => {
    expect(
      problemsOf(
        file(
          base({ action: undefined, situation: 'raise' }),
          base({ id: 'second', board: 'Ah', justification: '' }),
        ),
      ),
    ).toEqual([
      `${P}: situation is a preflop field`,
      `${P}: missing recommended action`,
      'Golden spot second: missing player view (board must be 3 to 5 different cards not in holeCards)',
      'Golden spot second: missing written justification (at least 15 words)',
    ]);
  });

  it('leaves the preflop parser unchanged on the preflop file', () => {
    const raw = JSON.parse(
      readFileSync(join(REPO_ROOT, 'tests/golden/preflop-spots.json'), 'utf8'),
    ) as { spots: RawSpot[] };
    const spots = parseGoldenSpots(raw);
    expect(spots.map((s) => s.id)).toEqual(raw.spots.map((s) => s.id));
    expect(spots.every((s) => s.view.street === 'preflop' && s.view.board.length === 0)).toBe(true);
    expect(checkGoldenSpot(spots[0] as (typeof spots)[number])).toBeNull();
  });

  it('memoises the real advice per view and observed array (heads-up river)', () => {
    const river = {
      id: 'hu-river',
      seats: 2,
      position: 'BTN',
      street: 'river',
      holeCards: 'Ad Ac',
      board: 'Ah 7c 2d 9s 4h',
      before: ['raise', 'call', 'check', 'check', 'check', 'check', 'check'],
      action: 'bet',
      justification: JUSTIFICATION,
    };
    const spot = one(river, goldenPostflopAdvice);
    expect(spot.view.street).toBe('river');
    const first = goldenPostflopAdvice(spot.view, spot.observed);
    expect(first.equityMethod).toBe('exact');
    expect(goldenPostflopAdvice(spot.view, spot.observed)).toBe(first);
    const other = goldenPostflopAdvice(spot.view, []);
    expect(other).not.toBe(first);
    expect(other).toEqual(first);
    expect(checkGoldenSpot(spot)).toBeNull();
    expect(checkGoldenSpot({ ...spot, action: 'check' })).toBe(
      'Golden spot hu-river: expected check, got bet',
    );
    expect(checkGoldenSpot(spot, () => ({ action: 'check' }))).toBe(
      'Golden spot hu-river: expected bet, got check',
    );
    expect(parsePostflopGoldenSpots(file(river))).toHaveLength(1);
  });
});

describe('postflop golden spot views', () => {
  it('builds the 6-max button view after the big blind checks the flop', () => {
    const { view, street, position } = one(base());
    expect(view.seat).toBe(1);
    expect(view.toAct).toBe(1);
    expect(position).toBe('BTN');
    expect(street).toBe('flop');
    expect(view.holeCards).toEqual(parseCards('As Qd'));
    expect(view.board).toEqual(parseCards('Ah 8c 3d'));
    expect(view.legalActions.map((a) => a.type)).toEqual(['check', 'bet']);
  });

  it('reaches the turn and the river with the board in order', () => {
    const turnSteps = [...FLOP, 'check', 'bet', 'call', 'check'];
    const turn = one(base({ board: 'Ah 8c 3d Ks', street: 'turn', before: turnSteps }));
    expect(turn.view.street).toBe('turn');
    expect(turn.view.board).toEqual(parseCards('Ah 8c 3d Ks'));
    const river = one(
      base({
        board: 'Ah 8c 3d Ks 2h',
        street: 'river',
        before: [...turnSteps, 'bet', 'call', 'check'],
      }),
    );
    expect(river.view.street).toBe('river');
    expect(river.view.seat).toBe(1);
    expect(river.view.board).toEqual(parseCards('Ah 8c 3d Ks 2h'));
    expect(river.view.holeCards).toEqual(parseCards('As Qd'));
  });

  it('finds a heads-up big blind hero on the second pass', () => {
    const spot = one(
      base({ seats: 2, position: 'BB', before: ['raise', 'call'], holeCards: '9h 9d' }),
    );
    expect(spot.view.seat).toBe(2);
    expect(spot.view.holeCards).toEqual(parseCards('9h 9d'));
    expect(spot.view.board).toEqual(parseCards('Ah 8c 3d'));
  });
});

const PRE_JUSTIFICATION =
  'Raising pocket aces first in is what the chart recommends, so this matches and is Correct by position.';
const graded = (extra: RawSpot = {}): RawSpot => ({
  id: 'g1',
  seats: 6,
  holeCards: 'Ah Ad',
  before: ['fold', 'fold', 'fold'],
  userAction: 'raise',
  grade: 'correct',
  ruleId: 'match',
  marginPts: null,
  justification: PRE_JUSTIFICATION,
  ...extra,
});
const gradedPostflop = (extra: RawSpot = {}): RawSpot =>
  graded({
    holeCards: 'As Qd',
    board: 'Ah 8c 3d',
    street: 'flop',
    before: [...FLOP, 'bet'],
    userAction: 'fold',
    grade: 'minor',
    ruleId: 'call-fold-margin',
    marginPts: 4.5,
    ...extra,
  });
const examples = (...entries: unknown[]) => ({
  format: GRADED_FORMAT,
  version: 1,
  examples: entries,
});

function gradedProblems(raw: unknown): readonly string[] {
  try {
    parseGradedExamples(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(GoldenSpotValidationError);
    return (error as GoldenSpotValidationError).problems;
  }
  return [];
}

const G = 'Graded example g1';
const equity =
  (equityPct: number, requiredEquityPct: number): (() => GradeInput) =>
  () => ({
    basis: 'equity',
    action: 'call',
    alternative: null,
    equityPct,
    requiredEquityPct,
    equityVsCallingRangePct: 30,
  });

describe('graded examples', () => {
  it('rejects a wrong header and invalid fields', () => {
    expect(gradedProblems({ ...examples(graded()), format: GOLDEN_FORMAT })).toEqual([
      'Graded example file: expected format "tlh-graded-examples" version 1',
    ]);
    expect(gradedProblems(examples(gradedPostflop({ userAction: 'check' })))).toEqual([
      `${G}: invalid user action "check"`,
    ]);
    expect(gradedProblems(examples(graded({ userAction: 'shove' })))).toEqual([
      `${G}: invalid user action "shove"`,
    ]);
    expect(gradedProblems(examples(graded({ grade: 'ok' })))).toEqual([`${G}: invalid grade "ok"`]);
    expect(gradedProblems(examples(graded({ ruleId: 'x' })))).toEqual([
      `${G}: invalid rule id "x"`,
    ]);
    for (const marginPts of ['5', 5.55, undefined, Infinity]) {
      expect(gradedProblems(examples(graded({ marginPts })))).toEqual([
        `${G}: invalid margin "${marginPts === undefined ? '<undefined>' : String(marginPts)}"`,
      ]);
    }
    expect(gradedProblems(examples(graded({ street: 'flop' })))).toEqual([
      `${G}: street flop does not match the board (preflop)`,
    ]);
    expect(gradedProblems(examples(gradedPostflop({ street: 'turn' })))).toEqual([
      `${G}: street turn does not match the board (flop)`,
    ]);
    expect(gradedProblems(examples(graded({ seats: 1, justification: 'Too short.' })))).toEqual([
      `${G}: missing player view (seats must be 2 to 10)`,
      `${G}: missing written justification (at least 15 words)`,
    ]);
    expect(gradedProblems(examples(graded({ opponentStats: { 4: { hands: 1 } } })))).toEqual([
      `${G}: invalid opponent stats`,
    ]);
    expect(gradedProblems(examples(graded(), graded({ id: undefined })))).toEqual([
      'Graded example #2: missing id',
    ]);
  });

  it('passes a preflop and a postflop example and reports a mismatch', () => {
    const [pre, post] = parseGradedExamples(
      examples(graded(), gradedPostflop({ id: 'g2', marginPts: 4.5 })),
    ) as [GradedExample, GradedExample];
    expect(pre.view.street).toBe('preflop');
    expect(post.view.street).toBe('flop');
    expect(post.observed).toEqual([]);
    expect(checkGradedExample(pre)).toBeNull();
    expect(checkGradedExample(post, equity(24.5, 20))).toBeNull();
    expect(checkGradedExample({ ...post, id: 'g1' }, equity(32, 20))).toBe(
      'Graded example g1: expected minor by call-fold-margin at 4.5, got major by call-fold-margin at 12',
    );
    expect(
      checkGradedExample(pre, () => ({
        basis: 'chart',
        action: 'fold',
        alternative: null,
        borderline: false,
      })),
    ).toBe(
      'Graded example g1: expected correct by match at no margin, got major by preflop-chart at no margin',
    );
  });

  it('grades a postflop example with the real advice by default', () => {
    const [river] = parseGradedExamples(
      examples(
        graded({
          seats: 2,
          holeCards: 'Ad Ac',
          board: 'Ah 7c 2d 9s 4h',
          street: 'river',
          before: ['raise', 'call', 'check', 'check', 'check', 'check', 'check'],
          userAction: 'bet',
        }),
      ),
    ) as [GradedExample];
    expect(checkGradedExample(river)).toBeNull();
  });
});
