import { readFileSync } from 'node:fs';
import { join, matchesGlob } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handClassName } from '../../src/advice/explain';
import {
  checkGoldenSpot,
  GoldenSpotValidationError,
  namedConcepts,
  parseGoldenSpots,
  sentencesOf,
  type GoldenSpot,
} from '../../src/advice/golden';
import { HAND_CLASSES } from '../../src/advice/hand-class';
import { HEADS_UP_CHART } from '../../src/advice/preflop';
import { APPLICABLE_SPOTS, chartCell, type ReferenceSize } from '../../src/advice/preflop-chart';
import { recommend } from '../../src/advice/recommend';
import { REPO_ROOT } from '../support/sandbox';

const SPOTS_PATH = join(REPO_ROOT, 'tests/golden/preflop-spots.json');
const GOLDEN_FILE = 'tests/golden/preflop.acceptance.test.ts';
const ACTIONS = ['fold', 'check', 'call', 'raise'];

type RawSpot = Record<string, unknown>;
const readRaw = () =>
  JSON.parse(readFileSync(SPOTS_PATH, 'utf8')) as { spots: RawSpot[] } & Record<string, unknown>;
const SPOTS: readonly GoldenSpot[] = parseGoldenSpots(readRaw());

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseGoldenSpots(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(GoldenSpotValidationError);
    return (error as GoldenSpotValidationError).problems;
  }
  return [];
}

const fileWith = (...spots: RawSpot[]) => ({ ...readRaw(), spots });
const probeOf = (): RawSpot => ({ ...(readRaw().spots[0] as RawSpot), id: 'probe' });

describe('preflop golden spots', () => {
  it('AC#1 every golden spot has a view, an action, at most one alternative and a justification', () => {
    expect(SPOTS.length).toBe(readRaw().spots.length);
    for (const spot of SPOTS) {
      expect(spot.view.street, spot.id).toBe('preflop');
      expect(spot.view.toAct, spot.id).toBe(spot.view.seat);
      expect(ACTIONS, spot.id).toContain(spot.action);
      if (spot.alternative !== null) {
        expect(ACTIONS, spot.id).toContain(spot.alternative);
        expect(spot.alternative, spot.id).not.toBe(spot.action);
      }
      expect(spot.justification.match(/\p{L}+/gu)?.length ?? 0, spot.id).toBeGreaterThanOrEqual(15);
    }
  });

  it('AC#1 a spot missing a part fails validation naming the spot', () => {
    const cases: [RawSpot, string][] = [
      [{ ...probeOf(), seats: 2, before: ['check'] }, 'Golden spot probe: missing player view'],
      [{ ...probeOf(), action: undefined }, 'Golden spot probe: missing recommended action'],
      [
        { ...probeOf(), alternative: ['call', 'fold'] },
        'Golden spot probe: more than one acceptable alternative',
      ],
      [
        { ...probeOf(), justification: undefined },
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

  it('AC#2 npm test includes the golden-spot suite', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.test).toBe('vitest run --coverage');
    const config = readFileSync(join(REPO_ROOT, 'vite.config.ts'), 'utf8');
    const include = /test:\s*\{\s*include:\s*\[([^\]]*)\]/.exec(config)?.[1] ?? '';
    const globs = [...include.matchAll(/'([^']+)'/g)].map((m) => m[1] as string);
    expect(globs.some((glob) => matchesGlob(GOLDEN_FILE, glob))).toBe(true);
    const sweeps = pkg.scripts['test:sweeps'] ?? '';
    expect(sweeps).toContain('.acceptance.test.');
    const excluded = [...sweeps.matchAll(/--exclude '([^']+)'/g)].map((m) => m[1] as string);
    expect(excluded.some((glob) => matchesGlob(GOLDEN_FILE, glob))).toBe(false);
  });

  for (const spot of SPOTS) {
    it(`AC#3 the advice engine agrees with golden spot ${spot.id}`, () => {
      expect(checkGoldenSpot(spot)).toBeNull();
    });
  }

  it('AC#3 a disagreement names the spot, the expected and the actual action', () => {
    const spot = SPOTS.find((s) => recommend(s.view).action === 'raise') as GoldenSpot;
    expect(spot).toBeDefined();
    const wrong: GoldenSpot = { ...spot, action: 'fold', alternative: null };
    expect(checkGoldenSpot(wrong)).toBe(`Golden spot ${spot.id}: expected fold, got raise`);
    const withAlternative: GoldenSpot = { ...wrong, alternative: 'call' };
    expect(checkGoldenSpot(withAlternative)).toBe(
      `Golden spot ${spot.id}: expected fold or call, got raise`,
    );
    expect(checkGoldenSpot(withAlternative, () => ({ action: 'call' }))).toBeNull();
  });

  it('AC#4 at least 100 spots covering every reference size and chart situation', () => {
    expect(SPOTS.length).toBeGreaterThanOrEqual(100);
    for (const size of Object.keys(APPLICABLE_SPOTS) as ReferenceSize[]) {
      for (const situation of new Set(APPLICABLE_SPOTS[size].map((s) => s.situation))) {
        expect(
          SPOTS.some((s) => s.referenceSize === size && s.situation === situation),
          `${size} ${situation}`,
        ).toBe(true);
      }
    }
  });

  it('AC#5 a spot on a borderline chart cell is rejected as not clear-cut', () => {
    const borderline = HAND_CLASSES.find(
      (hc) => chartCell(HEADS_UP_CHART, 'BTN', 'unopened', hc).borderline,
    ) as string;
    const clear = HAND_CLASSES.find(
      (hc) => !chartCell(HEADS_UP_CHART, 'BTN', 'unopened', hc).borderline,
    ) as string;
    expect(borderline).toBeDefined();
    const cardsOf = (hc: string) =>
      hc.length === 2 ? `${hc[0]}s ${hc[1]}h` : `${hc[0]}s ${hc[1]}${hc.endsWith('s') ? 's' : 'h'}`;
    const spotOn = (hc: string): RawSpot => ({
      id: 'edge',
      seats: 2,
      position: 'BTN',
      situation: 'unopened',
      holeCards: cardsOf(hc),
      before: [],
      action: 'call',
      alternative: null,
      justification:
        'A probe spot for the validator that talks about position and hand strength in enough words to pass.',
    });
    expect(problemsOf(fileWith(spotOn(borderline)))).toContain(
      `Golden spot edge: not clear-cut, chart cell heads-up BTN unopened ${borderline} is borderline`,
    );
    expect(problemsOf(fileWith(spotOn(clear)))).toEqual([]);
  });

  it('AC#6 every golden spot explanation has at most three sentences and names a listed concept', () => {
    for (const spot of SPOTS) {
      for (const text of [recommend(spot.view).explanation, spot.justification]) {
        const sentences = sentencesOf(text);
        expect(sentences.length, `${spot.id}: ${text}`).toBeGreaterThanOrEqual(1);
        expect(sentences.length, `${spot.id}: ${text}`).toBeLessThanOrEqual(3);
        for (const sentence of sentences) expect(sentence, spot.id).toMatch(/[.!?]$/);
        expect(namedConcepts(text).length, `${spot.id}: ${text}`).toBeGreaterThan(0);
      }
    }
  });

  it('DoD#1 justifications are distinct and name their hand', () => {
    expect(new Set(SPOTS.map((s) => s.id)).size).toBe(SPOTS.length);
    expect(new Set(SPOTS.map((s) => s.justification)).size).toBe(SPOTS.length);
    for (const spot of SPOTS) {
      const text = spot.justification;
      expect(
        text.includes(spot.handClass) ||
          text.toLowerCase().includes(handClassName(spot.handClass).toLowerCase()),
        `${spot.id}: ${text}`,
      ).toBe(true);
    }
  });
});
