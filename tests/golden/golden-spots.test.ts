import { describe, expect, it } from 'vitest';
import {
  GOLDEN_FORMAT,
  GoldenSpotValidationError,
  namedConcepts,
  parseGoldenSpots,
  sentencesOf,
  type GoldenSpot,
} from '../../src/advice/golden';
import { positionOf } from '../../src/advice/preflop';
import { parseCards } from '../../src/engine/cards';

type RawSpot = Record<string, unknown>;

const JUSTIFICATION =
  'Ace-king suited is far ahead of a single early raise, so re-raise to take the initiative and build the pot.';

const base = (extra: RawSpot = {}): RawSpot => ({
  id: 'six-max-probe',
  seats: 6,
  position: 'BTN',
  situation: 'raise',
  holeCards: 'As Ks',
  before: ['raise', 'fold', 'fold'],
  action: 'raise',
  alternative: null,
  justification: JUSTIFICATION,
  ...extra,
});

const file = (...spots: unknown[]) => ({ format: GOLDEN_FORMAT, version: 1, spots });

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseGoldenSpots(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(GoldenSpotValidationError);
    return (error as GoldenSpotValidationError).problems;
  }
  return [];
}

const P = 'Golden spot six-max-probe';

describe('golden spot validator', () => {
  it('accepts a valid spot', () => {
    expect(problemsOf(file(base()))).toEqual([]);
  });

  it('rejects a wrong header or a non-object with the header message only', () => {
    const header = 'Golden spot file: expected format "tlh-golden-spots" version 1';
    expect(problemsOf({ ...file(base({ id: '' })), format: 'other' })).toEqual([header]);
    expect(problemsOf({ ...file(base()), version: 2 })).toEqual([header]);
    expect(problemsOf(null)).toEqual([header]);
    expect(problemsOf([file(base())])).toEqual([header]);
    expect(() => parseGoldenSpots(null)).toThrow(`Invalid golden spots:\n- ${header}`);
  });

  it('reports a missing id by position and a duplicate id by name', () => {
    expect(problemsOf(file(base(), base({ id: undefined })))).toEqual([
      'Golden spot #2: missing id',
    ]);
    expect(problemsOf(file(base({ id: 'x'.repeat(61) })))).toEqual(['Golden spot #1: missing id']);
    expect(problemsOf(file(base(), base()))).toEqual([`${P}: duplicate id`]);
    expect(problemsOf(file('not a spot'))).toContain('Golden spot #1: missing id');
  });

  it('rejects seat counts outside 2 to 10', () => {
    for (const seats of [1, 11, 2.5, '6']) {
      expect(problemsOf(file(base({ seats })))).toContain(
        `${P}: missing player view (seats must be 2 to 10)`,
      );
    }
  });

  it('rejects hole cards that are not two different cards', () => {
    for (const holeCards of ['As As', 'Zz', 'As Ks Qs', 7]) {
      expect(problemsOf(file(base({ holeCards })))).toContain(
        `${P}: missing player view (holeCards must be two different cards)`,
      );
    }
  });

  it('rejects an illegal step and steps that leave the preflop decision', () => {
    expect(problemsOf(file(base({ before: ['raise', 'check'] })))).toContain(
      `${P}: missing player view (step 2 "check" is not legal)`,
    );
    expect(problemsOf(file(base({ before: ['a very long made-up step name'] })))).toContain(
      `${P}: missing player view (step 1 "a very long made-up ..." is not legal)`,
    );
    const ended = `${P}: missing player view (the steps do not reach a preflop decision)`;
    expect(problemsOf(file(base({ seats: 3, before: ['call', 'call', 'check'] })))).toContain(
      ended,
    );
    expect(problemsOf(file(base({ seats: 2, before: ['fold'] })))).toContain(ended);
    expect(problemsOf(file(base({ before: 'raise' })))).toContain(ended);
    expect(
      problemsOf(file(base({ seats: 2, before: ['fold', 'check'] }))).some((p) =>
        p.endsWith('(step 2 "check" is not legal)'),
      ),
    ).toBe(true);
  });

  it('rejects a position or situation that does not match the view', () => {
    expect(problemsOf(file(base({ position: 'CO' })))).toEqual([
      `${P}: position CO does not match the view (BTN)`,
    ]);
    expect(problemsOf(file(base({ situation: 'unopened' })))).toEqual([
      `${P}: situation unopened does not match the view (raise)`,
    ]);
  });

  it('rejects a missing or illegal recommended action', () => {
    expect(problemsOf(file(base({ action: undefined })))).toEqual([
      `${P}: missing recommended action`,
    ]);
    expect(problemsOf(file(base({ action: 'check' })))).toEqual([
      `${P}: recommended action "check" is not legal in the view`,
    ]);
    expect(problemsOf(file(base({ action: 'shove' })))).toEqual([
      `${P}: recommended action "shove" is not legal in the view`,
    ]);
  });

  it('rejects an invalid, repeated or multiple alternative', () => {
    expect(problemsOf(file(base({ alternative: 'shove' })))).toEqual([
      `${P}: invalid alternative "shove"`,
    ]);
    expect(problemsOf(file(base({ alternative: 'check' })))).toEqual([
      `${P}: invalid alternative "check"`,
    ]);
    expect(problemsOf(file(base({ alternative: 'raise' })))).toEqual([
      `${P}: alternative repeats the recommended action`,
    ]);
    expect(problemsOf(file(base({ alternative: ['call'] })))).toEqual([
      `${P}: more than one acceptable alternative`,
    ]);
    const [spot] = parseGoldenSpots(file(base({ alternative: 'call' })));
    expect(spot?.alternative).toBe('call');
    const [absent] = parseGoldenSpots(file(base({ alternative: undefined })));
    expect(absent?.alternative).toBeNull();
  });

  it('rejects a short, long or concept-free justification', () => {
    expect(problemsOf(file(base({ justification: 'Raise with position.' })))).toEqual([
      `${P}: missing written justification (at least 15 words)`,
    ]);
    expect(problemsOf(file(base({ justification: 42 })))).toEqual([
      `${P}: missing written justification (at least 15 words)`,
    ]);
    const four =
      'Ace-king suited is strong here. Raise now for value. The raiser is weaker. Position helps you.';
    expect(problemsOf(file(base({ justification: four })))).toEqual([
      `${P}: justification has more than three sentences`,
    ]);
    const none =
      'Ace-king suited is far ahead of a single early raise, so re-raise now and build a bigger pot.';
    expect(problemsOf(file(base({ justification: none })))).toEqual([
      `${P}: justification names no listed concept`,
    ]);
  });

  it('validates opponent stats and carries valid ones through', () => {
    for (const opponentStats of [{ 2: { vpip: 'x' } }, { 2: 5 }, { 0: { vpip: 1 } }, []]) {
      expect(problemsOf(file(base({ opponentStats })))).toEqual([`${P}: invalid opponent stats`]);
    }
    const [spot] = parseGoldenSpots(file(base({ opponentStats: { 2: { vpip: 31 } } })));
    expect(spot?.opponentStats).toEqual({ 2: { vpip: 31 } });
    const [plain] = parseGoldenSpots(file(base()));
    expect(plain?.opponentStats).toEqual({});
  });

  it('lists every problem in a file', () => {
    const problems = problemsOf(
      file(base({ action: undefined }), base({ id: 'second', seats: 1, justification: '' })),
    );
    expect(problems).toEqual([
      `${P}: missing recommended action`,
      'Golden spot second: missing player view (seats must be 2 to 10)',
      'Golden spot second: missing written justification (at least 15 words)',
    ]);
  });

  it('splits sentences and finds named concepts', () => {
    expect(sentencesOf('')).toEqual([]);
    expect(sentencesOf('  ')).toEqual([]);
    expect(sentencesOf('A b. C d? E!')).toHaveLength(3);
    expect(namedConcepts('Good position and pot odds.')).toEqual(['pot-odds', 'position']);
    expect(namedConcepts('Raise.')).toEqual([]);
    expect(namedConcepts('Positions differ.')).toEqual([]);
  });
});

describe('golden spot views', () => {
  const one = (spot: RawSpot) => parseGoldenSpots(file(spot))[0] as GoldenSpot;

  it('builds the 6-max button view facing one raise', () => {
    const spot = one(base());
    const { view } = spot;
    expect(view.seat).toBe(1);
    expect(view.toAct).toBe(1);
    expect(view.holeCards).toEqual(parseCards('As Ks'));
    expect(view.button).toBe(1);
    expect(view.currentBet).toBe(8);
    expect(view.betCount).toBe(2);
    expect(view.legalActions.map((a) => a.type)).toEqual(['fold', 'call', 'raise']);
    expect(spot).toMatchObject({ referenceSize: '6-max', handClass: 'AKs' });
  });

  it('puts the heads-up hero on the button with no steps', () => {
    const spot = one(base({ seats: 2, position: 'BTN', situation: 'unopened', before: [] }));
    expect(spot.view.seat).toBe(1);
    expect(spot.view.holeCards).toEqual(parseCards('As Ks'));
    expect(spot.referenceSize).toBe('heads-up');
  });

  it('puts the full-ring hero on the button after six folds', () => {
    const before = Array.from({ length: 6 }, () => 'fold');
    const spot = one(base({ seats: 9, position: 'BTN', situation: 'unopened', before }));
    expect(spot.view.seat).toBe(1);
    expect(positionOf(spot.view)).toBe('BTN');
    expect(spot.referenceSize).toBe('full-ring');
  });

  it('deals the hole cards to a hero who is not the button', () => {
    const spot = one(
      base({
        holeCards: 'Kd Kc',
        position: 'BB',
        situation: 'blind-defence',
        before: ['fold', 'fold', 'raise', 'fold', 'fold'],
      }),
    );
    expect(spot.view.seat).toBe(3);
    expect(spot.view.holeCards).toEqual(parseCards('Kd Kc'));
  });
});
