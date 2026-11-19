import { comboCount, HAND_CLASSES, handClassAt } from './hand-class';
import type { ChartCell, ChartSpot, PreflopChart } from './preflop-chart';

const LETTER = { fold: 'F', call: 'C', raise: 'R' } as const;
const WIDTH = 5;

/** 'R' | 'C' | 'F', then '*' if borderline, then '/R' | '/C' | '/F' if an alternative exists. */
export function cellToken(cell: ChartCell): string {
  return (
    LETTER[cell.action] +
    (cell.borderline ? '*' : '') +
    (cell.alternative === null ? '' : '/' + LETTER[cell.alternative])
  );
}

/** Unrounded percentages of 1,326 combos: raise = action 'raise'; continue = 'raise' + 'call'. */
export function spotWidths(spot: ChartSpot): {
  readonly raisePct: number;
  readonly continuePct: number;
} {
  let raise = 0;
  let call = 0;
  for (const hc of HAND_CLASSES) {
    const action = (spot.cells[hc] as ChartCell).action;
    if (action === 'raise') raise += comboCount(hc);
    if (action === 'call') call += comboCount(hc);
  }
  return { raisePct: (raise / 1326) * 100, continuePct: ((raise + call) / 1326) * 100 };
}

const line = (label: string, items: readonly string[]) =>
  [label, ...items]
    .map((item) => item.padEnd(WIDTH))
    .join('')
    .trimEnd() + '\n';

const rankAt = (index: number) => handClassAt(index, index).charAt(0);
const indices = Array.from({ length: 13 }, (_, i) => i);

/** Header line + column header + 13 grid rows, each line ending '\n'. */
export function formatSpot(spot: ChartSpot): string {
  const { raisePct, continuePct } = spotWidths(spot);
  let text =
    `${spot.position} ${spot.situation}: raise ${raisePct.toFixed(1)}%, continue ${continuePct.toFixed(1)}%\n` +
    line('', indices.map(rankAt));
  for (const r of indices) {
    text += line(
      rankAt(r),
      indices.map((c) => cellToken(spot.cells[handClassAt(r, c)] as ChartCell)),
    );
  }
  return text;
}

/** formatSpot for every spot in chart order, joined by one empty line. */
export function formatChart(chart: PreflopChart): string {
  return chart.spots.map(formatSpot).join('\n');
}
