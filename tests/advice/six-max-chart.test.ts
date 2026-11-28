import { describe, expect, it } from 'vitest';
import { comboCount, HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import type { ChartAction, ChartCell, ChartSpot } from '../../src/advice/preflop-chart';
import { SIX_MAX_CHART } from '../../src/advice/preflop';

/** Continue bands (% of 1,326 combos) from the spec's authoring guide; BB limpers is a raise band. */
const BANDS: Record<string, [number, number]> = {
  'UTG unopened': [13, 18],
  'HJ unopened': [16, 22],
  'CO unopened': [22, 30],
  'BTN unopened': [33, 45],
  'SB unopened': [28, 42],
  'HJ limpers': [12, 28],
  'CO limpers': [12, 28],
  'BTN limpers': [12, 28],
  'SB limpers': [12, 28],
  'BB limpers': [8, 25],
  'UTG raise': [5, 14],
  'HJ raise': [5, 14],
  'CO raise': [5, 14],
  'BTN raise': [5, 14],
  'UTG raise-and-calls': [6, 18],
  'HJ raise-and-calls': [6, 18],
  'CO raise-and-calls': [6, 18],
  'BTN raise-and-calls': [6, 18],
  'UTG re-raise': [6, 30],
  'HJ re-raise': [6, 30],
  'CO re-raise': [6, 30],
  // TASK-7.19 Q-1: BTN keeps 80–90% of its 33–45% opening band against a re-raise
  'BTN re-raise': [6, 41],
  'SB re-raise': [6, 30],
  'BB re-raise': [6, 30],
  // TASK-7.40 Q-3: two raises, none of them ours
  'UTG re-raise-not-mine': [2, 8],
  'HJ re-raise-not-mine': [2, 8],
  'CO re-raise-not-mine': [2, 8],
  'BTN re-raise-not-mine': [2, 8],
  'SB re-raise-not-mine': [2, 8],
  'BB re-raise-not-mine': [4, 16],
  // TASK-7.42 Q-4: against an early raiser
  'SB blind-defence-early': [5, 9],
  'BB blind-defence-early': [28, 40],
  'SB blind-defence': [10, 25],
  'BB blind-defence': [35, 60],
};

const wordCount = (text: string) => (text.match(/\p{L}+/gu) ?? []).length;
const nameOf = (spot: ChartSpot) => `${spot.position} ${spot.situation}`;
const spotNamed = (name: string) =>
  SIX_MAX_CHART.spots.find((s) => nameOf(s) === name) as ChartSpot;
const classesWith = (spot: ChartSpot, actions: ChartAction[]): HandClass[] =>
  HAND_CLASSES.filter((hc) => actions.includes((spot.cells[hc] as ChartCell).action));
const percent = (classes: HandClass[]) =>
  (classes.reduce((sum, hc) => sum + comboCount(hc), 0) / 1326) * 100;

describe('authored 6-max chart', () => {
  it('authored chart follows the TAG authoring guide', () => {
    const report: string[] = [];
    for (const spot of SIX_MAX_CHART.spots) {
      const name = nameOf(spot);
      const raise = percent(classesWith(spot, ['raise']));
      const call = percent(classesWith(spot, ['call']));
      report.push(
        `${name.padEnd(20)} raise ${raise.toFixed(1)}%  continue ${(raise + call).toFixed(1)}%`,
      );

      for (const hc of ['AA', 'KK', 'QQ'])
        expect(spot.cells[hc]?.action, `${name} ${hc}`).toBe('raise');
      expect(spot.cells['72o']?.action, name).toBe(name === 'BB limpers' ? 'call' : 'fold');

      const [low, high] = BANDS[name] as [number, number];
      const width = name === 'BB limpers' ? raise : raise + call;
      expect(width, name).toBeGreaterThanOrEqual(low);
      expect(width, name).toBeLessThanOrEqual(high);

      const cells = Object.values(spot.cells);
      expect(
        cells.some((c) => c.action === 'raise' && !c.borderline),
        name,
      ).toBe(true);
      if (name !== 'BB limpers') {
        expect(
          cells.some((c) => c.action === 'fold' && !c.borderline),
          name,
        ).toBe(true);
      }
      for (const c of cells) {
        if (c.alternative !== null) expect(c.borderline, name).toBe(true);
      }
      expect(wordCount(spot.justification), name).toBeGreaterThanOrEqual(15);
    }
    console.log(report.join('\n'));

    for (const name of ['UTG unopened', 'HJ unopened', 'CO unopened', 'BTN unopened']) {
      expect(classesWith(spotNamed(name), ['call']), name).toEqual([]);
    }
    expect(percent(classesWith(spotNamed('SB unopened'), ['call']))).toBeLessThanOrEqual(10);
    for (const name of ['UTG raise', 'HJ raise', 'CO raise', 'BTN raise']) {
      expect(percent(classesWith(spotNamed(name), ['call'])), name).toBeLessThanOrEqual(4);
    }
    const bbRaise = percent(classesWith(spotNamed('BB blind-defence'), ['raise']));
    expect(bbRaise).toBeGreaterThanOrEqual(5);
    expect(bbRaise).toBeLessThanOrEqual(15);

    const opens = ['UTG', 'HJ', 'CO', 'BTN'].map((p) =>
      classesWith(spotNamed(`${p} unopened`), ['raise']),
    );
    for (let i = 1; i < opens.length; i++) {
      expect(opens[i - 1]?.filter((hc) => !opens[i]?.includes(hc))).toEqual([]);
    }

    expect(wordCount(SIX_MAX_CHART.justification)).toBeGreaterThanOrEqual(50);
  });
});
