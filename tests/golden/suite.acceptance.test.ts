import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkGradedExample,
  goldenPostflopAdvice,
  parseGoldenSpots,
  parseGradedExamples,
  type GoldenSpot,
  type GradedExample,
} from '../../src/advice/golden';
import { HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import { FULL_RING_CHART } from '../../src/advice/preflop';
import { chartCell } from '../../src/advice/preflop-chart';
import { REPO_ROOT } from '../support/sandbox';

const read = (name: string): unknown =>
  JSON.parse(readFileSync(join(REPO_ROOT, 'tests/golden', name), 'utf8'));
const EXAMPLES: readonly GradedExample[] = parseGradedExamples(read('graded-examples.json'));
const PREFLOP: readonly GoldenSpot[] = parseGoldenSpots(read('preflop-spots.json'));
const spotById = (id: string) => PREFLOP.find((s) => s.id === id) as GoldenSpot;

const RANKS = 'AKQJT98765432';

/** A-8 neighbours: adjacent pairs for a pair; grid-adjacent cells of the same suitedness otherwise. */
function neighbours(hc: HandClass): HandClass[] {
  const [hi, lo] = [RANKS.indexOf(hc[0] as string), RANKS.indexOf(hc[1] as string)];
  const pair = (i: number) => `${RANKS[i]}${RANKS[i]}`;
  const candidates =
    hi === lo
      ? [pair(hi - 1), pair(hi + 1)]
      : [
          [hi - 1, lo],
          [hi + 1, lo],
          [hi, lo - 1],
          [hi, lo + 1],
        ]
          .filter(([a, b]) => (a as number) < (b as number))
          .map(([a, b]) => `${RANKS[a as number]}${RANKS[b as number]}${hc[2]}`);
  return candidates.filter((c): c is HandClass => HAND_CLASSES.includes(c as HandClass));
}

describe('golden suite: graded examples and preflop follow-ups', () => {
  it('AC#3 AC#6 graded examples at each grade, preflop and postflop, match grade, rule id and margin', () => {
    for (const example of EXAMPLES) {
      expect(checkGradedExample(example), example.id).toBeNull();
    }
    const postflop = (e: GradedExample) => e.view.street !== 'preflop';
    for (const grade of ['correct', 'minor', 'major']) {
      expect(
        EXAMPLES.some((e) => !postflop(e) && e.grade === grade),
        `preflop ${grade}`,
      ).toBe(true);
      expect(
        EXAMPLES.some((e) => postflop(e) && e.grade === grade),
        `postflop ${grade}`,
      ).toBe(true);
    }
    for (const example of EXAMPLES) {
      if (!postflop(example)) {
        expect(example.marginPts, example.id).toBeNull();
        continue;
      }
      if (example.grade !== 'correct') expect(typeof example.marginPts, example.id).toBe('number');
      expect(goldenPostflopAdvice(example.view, example.observed).equityMethod, example.id).toBe(
        'exact',
      );
    }
    const numeric = EXAMPLES.find((e) => typeof e.marginPts === 'number') as GradedExample;
    const shifted = Math.round(((numeric.marginPts as number) + 0.1) * 10) / 10;
    const message = checkGradedExample({ ...numeric, marginPts: shifted });
    expect(message).toBe(
      `Graded example ${numeric.id}: expected ${numeric.grade} by ${numeric.ruleId} at ${shifted}, ` +
        `got ${numeric.grade} by ${numeric.ruleId} at ${numeric.marginPts}`,
    );
  });

  it('AC#7 fr-btn-raise-88 and its full-ring chart cell agree', () => {
    const spot = spotById('fr-btn-raise-88');
    expect(spot).toBeDefined();
    expect(spot).toMatchObject({ referenceSize: 'full-ring', position: 'BTN', situation: 'raise' });
    const cell = chartCell(FULL_RING_CHART, 'BTN', 'raise', '88');
    expect(cell.borderline).toBe(false);
    expect(spot.action).toBe('raise');
    expect(cell.action).toBe(spot.action);
    expect(chartCell(FULL_RING_CHART, 'BTN', 'raise', '99').action).toBe('raise');
    expect(chartCell(FULL_RING_CHART, 'BTN', 'raise', '77').action).toBe('call');
    expect(spot.justification).toMatch(/isolat/i);
    expect(spot.justification).toMatch(/position/i);
    expect(spot.justification).not.toMatch(/implied/i);
  });

  it('AC#8 the AJs justification places the domination claim on the caller', () => {
    const spot = spotById('fr-hj-raise-and-calls-ajs');
    expect(spot).toBeDefined();
    expect(spot.justification).not.toMatch(/dominat[^.]*opener/i);
    expect(spot.justification).toMatch(/caller/i);
    expect(spot.action).toBe('call');
  });

  it('AC#9 the two call islands are replaced by spots whose chart neighbours share their action', () => {
    const ids = PREFLOP.map((s) => s.id);
    expect(ids).not.toContain('fr-co-limpers-87s');
    expect(ids).not.toContain('fr-sb-unopened-65s');
    expect(neighbours('88')).toEqual(['99', '77']);
    expect(neighbours('87s')).toEqual(['97s', '86s']);
    for (const [id, action] of [
      ['fr-co-limpers-44', 'call'],
      ['fr-sb-unopened-kjs', 'raise'],
    ] as const) {
      const spot = spotById(id);
      expect(spot, id).toBeDefined();
      expect(spot.action, id).toBe(action);
      const cell = chartCell(FULL_RING_CHART, spot.position, spot.situation, spot.handClass);
      expect(cell.action, id).toBe(action);
      for (const near of neighbours(spot.handClass)) {
        expect(
          chartCell(FULL_RING_CHART, spot.position, spot.situation, near).action,
          `${id} ${near}`,
        ).toBe(action);
      }
    }
    expect(PREFLOP.length).toBeGreaterThanOrEqual(100);
  });
});
