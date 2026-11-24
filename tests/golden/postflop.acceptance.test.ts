import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatPct } from '../../src/advice/explain';
import {
  checkGoldenSpot,
  goldenPostflopAdvice,
  GoldenSpotValidationError,
  namedConcepts,
  parseGoldenSpots,
  parsePostflopGoldenSpots,
  sentencesOf,
  type GoldenNumbers,
  type PostflopGoldenSpot,
} from '../../src/advice/golden';
import { REPO_ROOT } from '../support/sandbox';

type RawSpot = Record<string, unknown>;
type RawFile = { spots: RawSpot[] } & Record<string, unknown>;

const readJson = (name: string) =>
  JSON.parse(readFileSync(join(REPO_ROOT, 'tests/golden', name), 'utf8')) as RawFile;
const readRaw = () => readJson('postflop-spots.json');
const SPOTS: readonly PostflopGoldenSpot[] = parsePostflopGoldenSpots(readRaw());
const PREFLOP = parseGoldenSpots(readJson('preflop-spots.json'));

function problemsOf(raw: unknown, advise?: Parameters<typeof parsePostflopGoldenSpots>[1]) {
  try {
    parsePostflopGoldenSpots(raw, advise);
  } catch (error) {
    expect(error).toBeInstanceOf(GoldenSpotValidationError);
    return (error as GoldenSpotValidationError).problems;
  }
  return [];
}

const fileWith = (...spots: RawSpot[]) => ({ ...readRaw(), spots });
const probeOf = (): RawSpot => ({ ...(readRaw().spots[0] as RawSpot), id: 'probe' });
const stub = (numbers: Omit<GoldenNumbers, 'action'>) => (): GoldenNumbers => ({
  action: 'call',
  ...numbers,
});

const JUSTIFICATION =
  'A probe spot for the validator that talks about equity and pot odds in enough words to pass.';
// 6-max: the button opens, the big blind calls; on the flop the big blind bets into the button.
const facingBet: RawSpot = {
  id: 'probe',
  seats: 6,
  position: 'BTN',
  street: 'flop',
  holeCards: 'Kh Qh',
  board: 'Ks 7d 2c',
  before: ['fold', 'fold', 'fold', 'raise', 'fold', 'call', 'bet'],
  action: 'call',
  justification: JUSTIFICATION,
};
const nothingOwed: RawSpot = {
  ...facingBet,
  before: ['fold', 'fold', 'fold', 'raise', 'fold', 'call', 'check'],
  action: 'bet',
};

describe('postflop golden spots', () => {
  it('AC#1 at least 100 postflop spots across flop, turn and river and at least 200 in total', () => {
    expect(SPOTS.length).toBe(readRaw().spots.length);
    expect(SPOTS.length).toBeGreaterThanOrEqual(100);
    for (const street of ['flop', 'turn', 'river']) {
      expect(
        SPOTS.some((s) => s.street === street),
        street,
      ).toBe(true);
    }
    for (const action of ['bet', 'check', 'call', 'fold', 'raise']) {
      expect(
        SPOTS.some((s) => s.action === action),
        action,
      ).toBe(true);
    }
    expect(SPOTS.length + PREFLOP.length).toBeGreaterThanOrEqual(200);
  });

  it('AC#1 every postflop spot has a view on its street, an action and a justification', () => {
    const boardSize = { flop: 3, turn: 4, river: 5 };
    for (const spot of SPOTS) {
      expect(spot.view.street, spot.id).toBe(spot.street);
      expect(spot.view.board.length, spot.id).toBe(boardSize[spot.street]);
      expect(spot.view.toAct, spot.id).toBe(spot.view.seat);
      expect(
        spot.view.legalActions.some((a) => a.type === spot.action),
        spot.id,
      ).toBe(true);
      expect(spot.justification.match(/\p{L}+/gu)?.length ?? 0, spot.id).toBeGreaterThanOrEqual(15);
    }
    const probe = probeOf();
    const hole = String(probe.holeCards).split(' ')[0];
    const board = String(probe.board).split(' ');
    const cases: [RawSpot, string][] = [
      [
        { ...probe, board: [hole, ...board.slice(1)].join(' ') },
        'Golden spot probe: missing player view',
      ],
      [{ ...probe, action: undefined }, 'Golden spot probe: missing recommended action'],
      [
        { ...probe, justification: undefined },
        'Golden spot probe: missing written justification (at least 15 words)',
      ],
    ];
    for (const [spot, start] of cases) {
      const problems = problemsOf(fileWith(spot));
      expect(
        problems.some((p) => p.startsWith(start)),
        `${start}\n${problems.join('\n')}`,
      ).toBe(true);
    }
  });

  it('AC#2 a spot within 10 points of required equity or 15 points of 50% is rejected as not clear-cut', () => {
    const numbers = (equityPct: number, equityVsCallingRangePct: number, requiredEquityPct = 31) =>
      stub({ equityPct, requiredEquityPct, equityVsCallingRangePct });
    expect(problemsOf(fileWith(facingBet), numbers(40.9, 30))).toEqual([
      'Golden spot probe: not clear-cut, fold would be a Minor error (call-fold-margin 9.9 points; clear-cut needs 10)',
    ]);
    expect(problemsOf(fileWith(facingBet), numbers(41, 30))).toEqual([]);
    expect(problemsOf(fileWith(nothingOwed), numbers(70, 64.9, 0))).toEqual([
      'Golden spot probe: not clear-cut, check would be a Minor error (aggression-margin 14.9 points; clear-cut needs 15)',
    ]);
    expect(problemsOf(fileWith(nothingOwed), numbers(70, 65, 0))).toEqual([]);
    const check = { ...nothingOwed, action: 'check' };
    expect(problemsOf(fileWith(check), numbers(40, 35.1, 0))).toEqual([
      'Golden spot probe: not clear-cut, bet would be a Minor error (aggression-margin 14.9 points; clear-cut needs 15)',
    ]);
    expect(problemsOf(fileWith(check), numbers(40, 35, 0))).toEqual([]);
  });

  for (const spot of SPOTS) {
    it(`AC#5 the advice engine agrees with golden spot ${spot.id}`, () => {
      expect(checkGoldenSpot(spot)).toBeNull();
    });
  }

  it('AC#5 a disagreement names the spot, the expected and the actual action', () => {
    const spot = SPOTS.find(
      (s) => goldenPostflopAdvice(s.view, s.observed).action === 'bet',
    ) as PostflopGoldenSpot;
    expect(spot).toBeDefined();
    const wrong: PostflopGoldenSpot = { ...spot, action: 'check', alternative: null };
    expect(checkGoldenSpot(wrong)).toBe(`Golden spot ${spot.id}: expected check, got bet`);
  });

  it('AC#4 every postflop explanation quotes the equity and required equity it returns', () => {
    for (const spot of SPOTS) {
      const rec = goldenPostflopAdvice(spot.view, spot.observed);
      expect(rec.explanation, spot.id).toContain(formatPct(rec.equityPct));
      expect(rec.explanation, spot.id).toContain(formatPct(rec.requiredEquityPct));
      for (const text of [rec.explanation, spot.justification]) {
        const sentences = sentencesOf(text);
        expect(sentences.length, `${spot.id}: ${text}`).toBeGreaterThanOrEqual(1);
        expect(sentences.length, `${spot.id}: ${text}`).toBeLessThanOrEqual(3);
        for (const sentence of sentences) expect(sentence, spot.id).toMatch(/[.!?]$/);
        expect(namedConcepts(text).length, `${spot.id}: ${text}`).toBeGreaterThan(0);
      }
    }
  });

  it('DoD#1 golden ids and justifications are distinct across files', () => {
    const examples = (
      JSON.parse(readFileSync(join(REPO_ROOT, 'tests/golden/graded-examples.json'), 'utf8')) as {
        examples: RawSpot[];
      }
    ).examples;
    const all = [...PREFLOP, ...SPOTS, ...examples];
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length);
    expect(new Set(all.map((s) => s.justification)).size).toBe(all.length);
  });
});
