import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { spotWidths } from '../../src/advice/chart-print';
import { comboCount, HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import type { ChartSpot, Position, PreflopChart, Situation } from '../../src/advice/preflop-chart';
import { FULL_RING_CHART, HEADS_UP_CHART, SIX_MAX_CHART } from '../../src/advice/preflop';
import { REPO_ROOT } from '../support/sandbox';

type Band = readonly [number, number];
interface Bands {
  /** Continue % (raise + call) band. */
  continue?: Band;
  /** Raise % band. */
  raise?: Band;
  /** Largest call % allowed. */
  maxCall?: number;
}

const HU: Record<string, Bands> = {
  'BTN unopened': { continue: [70, 95], raise: [55, 100], maxCall: 15 },
  'BB limpers': { raise: [25, 55] },
  'BTN raise': { continue: [35, 75] },
  'BTN re-raise': { continue: [35, 80] },
  'BB re-raise': { continue: [35, 80] },
  'BB blind-defence': { continue: [65, 95], raise: [15, 40] },
};
const OPENERS: readonly Position[] = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN'];
const FR_UNOPENED: Record<string, Band> = {
  UTG: [7, 11],
  'UTG+1': [8, 12],
  MP: [9, 14],
  LJ: [11, 16],
  HJ: [13, 19],
  CO: [17, 26],
  BTN: [25, 40],
  SB: [22, 38],
};
const FR: Record<string, Bands> = {
  ...Object.fromEntries(
    Object.entries(FR_UNOPENED).map(([p, band]) => [
      `${p} unopened`,
      { continue: band, maxCall: p === 'SB' ? 10 : 0 },
    ]),
  ),
  ...Object.fromEntries(
    ['UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB'].map((p) => [
      `${p} limpers`,
      { continue: [8, 25] },
    ]),
  ),
  'BB limpers': { raise: [6, 20] },
  ...Object.fromEntries(OPENERS.map((p) => [`${p} raise`, { continue: [4, 12], maxCall: 4 }])),
  ...Object.fromEntries(OPENERS.map((p) => [`${p} raise-and-calls`, { continue: [5, 16] }])),
  ...Object.fromEntries(
    [...OPENERS, 'SB', 'BB'].map((p) => [
      `${p} re-raise`,
      { continue: p === 'BTN' ? [25, 35] : [5, 28] },
    ]),
  ),
  ...Object.fromEntries(
    [...OPENERS, 'SB', 'BB'].map((p) => [
      `${p} re-raise-not-mine`,
      { continue: p === 'BB' ? [4, 16] : [2, 8] },
    ]),
  ),
  'SB blind-defence': { continue: [8, 22] },
  'BB blind-defence': { continue: [30, 55] },
};

const keyOf = (spot: { position: Position; situation: Situation }) =>
  `${spot.position} ${spot.situation}`;
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const raiseSet = (spot: ChartSpot) =>
  new Set(HAND_CLASSES.filter((hc) => spot.cells[hc]?.action === 'raise'));
const spotAt = (chart: PreflopChart, position: Position, situation: Situation) =>
  chart.spots.find((s) => s.position === position && s.situation === situation) as ChartSpot;

function callPct(spot: ChartSpot): number {
  const combos = HAND_CLASSES.filter((hc) => spot.cells[hc]?.action === 'call').reduce(
    (sum, hc) => sum + comboCount(hc),
    0,
  );
  return (combos / 1326) * 100;
}

const inBand = (value: number, [low, high]: Band) => value >= low && value <= high;

describe('reference charts', () => {
  it('heads-up and full-ring charts hold the authoring bands', () => {
    const sixMaxText = JSON.parse(
      readFileSync(join(REPO_ROOT, 'src/advice/charts/six-max.json'), 'utf8'),
    ) as { justification: string; spots: { justification: string }[] };
    const copied = new Set([
      sixMaxText.justification,
      ...sixMaxText.spots.map((s) => s.justification),
    ]);

    for (const [chart, bands] of [
      [HEADS_UP_CHART, HU],
      [FULL_RING_CHART, FR],
    ] as const) {
      const size = chart.referenceSize;
      expect(words(chart.justification), size).toBeGreaterThanOrEqual(50);
      expect(copied.has(chart.justification)).toBe(false);
      expect(Object.keys(bands).sort()).toEqual(chart.spots.map(keyOf).sort());

      for (const spot of chart.spots) {
        const key = `${size} ${keyOf(spot)}`;
        const cell = (hc: HandClass) => spot.cells[hc] as ChartSpot['cells'][HandClass];
        const { raisePct, continuePct } = spotWidths(spot);
        const call = callPct(spot);
        console.log(
          `${key.padEnd(30)} raise ${raisePct.toFixed(1).padStart(5)}%  continue ${continuePct.toFixed(1).padStart(5)}%`,
        );

        for (const hc of ['AA', 'KK', 'QQ'] as HandClass[]) {
          expect(cell(hc).action, `${key} ${hc}`).toBe('raise');
        }
        const isBbLimpers = spot.position === 'BB' && spot.situation === 'limpers';
        const anyTrash =
          size === 'heads-up' &&
          ((spot.position === 'BTN' && spot.situation === 'unopened') ||
            (spot.position === 'BB' && spot.situation === 'blind-defence'));
        if (isBbLimpers) expect(cell('72o').action, key).toBe('call');
        else if (!anyTrash) expect(cell('72o').action, key).toBe('fold');
        if (isBbLimpers) {
          // Every cell is a raise or a free check.
          expect(
            HAND_CLASSES.every((hc) => cell(hc).action !== 'fold'),
            key,
          ).toBe(true);
        }

        const band = bands[keyOf(spot)] as Bands;
        if (band.continue) expect(inBand(continuePct, band.continue), key).toBe(true);
        if (band.raise) expect(inBand(raisePct, band.raise), key).toBe(true);
        if (band.maxCall !== undefined) expect(call, key).toBeLessThanOrEqual(band.maxCall);

        const plain = HAND_CLASSES.filter((hc) => !cell(hc).borderline);
        expect(
          plain.some((hc) => cell(hc).action === 'raise'),
          key,
        ).toBe(true);
        if (!isBbLimpers)
          expect(
            plain.some((hc) => cell(hc).action === 'fold'),
            key,
          ).toBe(true);
        expect(
          HAND_CLASSES.every((hc) => cell(hc).alternative === null || cell(hc).borderline),
          key,
        ).toBe(true);

        expect(words(spot.justification), key).toBeGreaterThanOrEqual(15);
        expect(copied.has(spot.justification), key).toBe(false);
      }
    }

    // Unopened raising ranges widen position by position.
    for (let i = 1; i < OPENERS.length; i++) {
      const earlier = raiseSet(spotAt(FULL_RING_CHART, OPENERS[i - 1] as Position, 'unopened'));
      const later = raiseSet(spotAt(FULL_RING_CHART, OPENERS[i] as Position, 'unopened'));
      expect(
        [...earlier].filter((hc) => !later.has(hc)),
        `${OPENERS[i - 1]} ⊆ ${OPENERS[i]}`,
      ).toEqual([]);
    }
    const huButton = raiseSet(spotAt(HEADS_UP_CHART, 'BTN', 'unopened'));
    const sixMaxButton = raiseSet(spotAt(SIX_MAX_CHART, 'BTN', 'unopened'));
    expect([...sixMaxButton].filter((hc) => !huButton.has(hc))).toEqual([]);

    // The full-ring UTG range is written to hold at 9 and 10 seats (D-2).
    expect(FULL_RING_CHART.justification).toMatch(/nine and ten seats/);
  });
});
