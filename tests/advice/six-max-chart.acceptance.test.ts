import { describe, expect, it } from 'vitest';
import { comboCount, HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import type { ChartAction, ChartCell, ChartSpot } from '../../src/advice/preflop-chart';
import { SIX_MAX_CHART } from '../../src/advice/preflop';

const RANKS = 'AKQJT98765432';
const PREMIUM = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']);
const OPENERS = ['UTG', 'HJ', 'CO', 'BTN'];

const nameOf = (spot: ChartSpot) => `${spot.position} ${spot.situation}`;
const spotNamed = (name: string) =>
  SIX_MAX_CHART.spots.find((s) => nameOf(s) === name) as ChartSpot;
const cellOf = (spot: ChartSpot, hc: HandClass) => spot.cells[hc] as ChartCell;
const classesWith = (spot: ChartSpot, actions: ChartAction[]): HandClass[] =>
  HAND_CLASSES.filter((hc) => actions.includes(cellOf(spot, hc).action));
const combos = (classes: Iterable<HandClass>) =>
  [...classes].reduce((sum, hc) => sum + comboCount(hc), 0);
const percent = (classes: HandClass[]) => (combos(classes) / 1326) * 100;

const LETTER = { fold: 'F', call: 'C', raise: 'R' } as const;
const token = (cell: ChartCell) =>
  LETTER[cell.action] +
  (cell.borderline ? '*' : '') +
  (cell.alternative === null ? '' : '/' + LETTER[cell.alternative]);

/** A-4: fold 0; borderline fold 1; borderline call/raise leaning to fold (or no alternative) 2; else 3. */
function level(cell: ChartCell): number {
  if (cell.action === 'fold') return cell.borderline ? 1 : 0;
  return cell.borderline && (cell.alternative === null || cell.alternative === 'fold') ? 2 : 3;
}

/** Pairs [Y, X] where Y dominates X under A-4. Rank index 0 = A ... 12 = 2. */
function dominancePairs(offsuitOnly: boolean): [HandClass, HandClass][] {
  const pairs: [HandClass, HandClass][] = [];
  for (let yh = 0; yh < 13; yh++) {
    for (let yl = yh + 1; yl < 13; yl++) {
      for (let xh = yh; xh < 13; xh++) {
        for (let xl = Math.max(yl, xh + 1); xl < 13; xl++) {
          if (xh === yh && xl === yl) continue;
          const y = (RANKS[yh] as string) + RANKS[yl];
          const x = (RANKS[xh] as string) + RANKS[xl];
          pairs.push([`${y}o`, `${x}o`]);
          // Suited: same high card, Y has the higher kicker, X's kicker is 6 or higher.
          if (!offsuitOnly && xh === yh && xl <= RANKS.indexOf('6')) pairs.push([`${y}s`, `${x}s`]);
        }
      }
    }
  }
  return pairs;
}

function inversions(spot: ChartSpot, offsuitOnly: boolean): string[] {
  return dominancePairs(offsuitOnly)
    .filter(([y, x]) => level(cellOf(spot, y)) < level(cellOf(spot, x)))
    .map(
      ([y, x]) =>
        `${nameOf(spot)}: ${y}:${token(cellOf(spot, y))} < ${x}:${token(cellOf(spot, x))}`,
    );
}

/** C/O of D-1 plus the continued classes that the opener does not raise first in. */
function reRaiseShare(position: string) {
  const open = classesWith(spotNamed(`${position} unopened`), ['raise']);
  const cont = classesWith(spotNamed(`${position} re-raise`), ['call', 'raise']);
  const c = combos(cont);
  const o = combos(open);
  return { c, o, share: c / o, outside: cont.filter((hc) => !open.includes(hc)) };
}

describe('revised 6-max chart', () => {
  it('openers continue against a re-raise with 80 to 90 percent of their opening range', () => {
    for (const position of OPENERS) {
      const { c, o, share, outside } = reRaiseShare(position);
      console.log(`${position}: C/O = ${c}/${o} (${share.toFixed(3)})`);
      expect(c, position).toBeGreaterThanOrEqual(Math.ceil(0.8 * o));
      expect(c, position).toBeLessThanOrEqual(Math.floor(0.9 * o));
      expect(outside, position).toEqual([]);
    }
  });

  it('re-raise spots raise only premium hands and SB and BB keep their own ranges', () => {
    for (const position of [...OPENERS, 'SB', 'BB']) {
      const spot = spotNamed(`${position} re-raise`);
      const raises = classesWith(spot, ['raise']);
      expect(
        raises.filter((hc) => !PREMIUM.has(hc)),
        nameOf(spot),
      ).toEqual([]);
      const width = percent(classesWith(spot, ['call', 'raise']));
      expect(width, nameOf(spot)).toBeLessThanOrEqual(position === 'BTN' ? 41 : 30);
    }

    const sb = reRaiseShare('SB');
    console.log(`SB: C/O = ${sb.c}/${sb.o} (${sb.share.toFixed(3)})`);
    expect(sb.c).toBeGreaterThanOrEqual(Math.ceil(0.8 * sb.o));
    expect(sb.c).toBeLessThanOrEqual(Math.floor(0.9 * sb.o));
    expect(sb.outside).toEqual([]);

    const bbRaised = new Set([
      ...classesWith(spotNamed('BB limpers'), ['raise']),
      ...classesWith(spotNamed('BB blind-defence'), ['raise']),
    ]);
    const bbCont = classesWith(spotNamed('BB re-raise'), ['call', 'raise']);
    const kept = [...bbRaised].filter((hc) => bbCont.includes(hc));
    expect(combos(kept)).toBeGreaterThanOrEqual(Math.ceil(0.8 * combos(bbRaised)));
    const defended = classesWith(spotNamed('BB blind-defence'), ['call', 'raise']);
    expect(bbCont.filter((hc) => !defended.includes(hc))).toEqual([]);
  });

  it('BB blind defence has no offsuit inversion', () => {
    const spot = spotNamed('BB blind-defence');
    expect(inversions(spot, true)).toEqual([]);
    for (const x of ['Q9o', 'J9o', 'T8o']) {
      expect(level(cellOf(spot, 'K9o')), x).toBeGreaterThanOrEqual(level(cellOf(spot, x)));
    }
  });

  it('no spot plays a weaker hand more firmly than a hand that dominates it', () => {
    expect(SIX_MAX_CHART.spots).toHaveLength(34);
    expect(SIX_MAX_CHART.spots.flatMap((spot) => inversions(spot, false))).toEqual([]);
  });

  it('HJ raise-and-calls text says we close the action and names only the suited aces it calls', () => {
    const spot = spotNamed('HJ raise-and-calls');
    expect(spot.justification).toContain('close the action');
    expect(spot.justification).not.toContain('usually close');

    const named = new Set(spot.justification.match(/\bA[KQJT2-9]s\b/g) ?? []);
    const called = HAND_CLASSES.filter(
      (hc) => /^A[KQJT2-9]s$/.test(hc) && cellOf(spot, hc).action === 'call',
    );
    expect(called.filter((hc) => !named.has(hc))).toEqual([]);
    for (const hc of named) {
      expect(['call', 'raise'], hc).toContain(cellOf(spot, hc).action);
    }
  });
});
