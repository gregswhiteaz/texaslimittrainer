import { describe, expect, it } from 'vitest';
import {
  CHART_PRINT_USAGE,
  chartPrintMain,
  formatChart,
  formatChartForReview,
  formatSpot,
} from '../../src/advice/chart-print';
import { HEADS_UP_CHART, PREFLOP_CHARTS, SIX_MAX_CHART } from '../../src/advice/preflop';
import type { ReferenceSize } from '../../src/advice/preflop-chart';

function run(argv: readonly string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = chartPrintMain(argv, { out: (t) => out.push(t), err: (t) => err.push(t) });
  return { code, out, err };
}

describe('chartPrintMain', () => {
  it('no argument prints the 6-max chart exactly as before', () => {
    expect(run([])).toEqual({ code: 0, out: [formatChart(SIX_MAX_CHART)], err: [] });
  });

  it('chartPrintMain validates the size argument and prints the review layout', () => {
    for (const size of [
      'heads-up',
      '6-max',
      'full-ring',
    ] as const satisfies readonly ReferenceSize[]) {
      expect(run([size]), size).toEqual({
        code: 0,
        out: [formatChartForReview(PREFLOP_CHARTS[size])],
        err: [],
      });
    }

    for (const arg of ['9max', '', 'toString', 'HEADS-UP', 'six-max']) {
      expect(run([arg]), arg).toEqual({
        code: 2,
        out: [],
        err: [
          `Unknown chart size "${arg}". Use heads-up, 6-max or full-ring.\n` + CHART_PRINT_USAGE,
        ],
      });
    }

    expect(run(['heads-up', 'full-ring'])).toEqual({
      code: 2,
      out: [],
      err: ['Expected one chart size, got 2 arguments.\n' + CHART_PRINT_USAGE],
    });

    const text = formatChartForReview(HEADS_UP_CHART);
    const first = HEADS_UP_CHART.spots[0];
    if (first === undefined) throw new Error('chart has no spots');
    expect(
      text.startsWith(
        'heads-up chart: 6 spots\n' +
          HEADS_UP_CHART.justification +
          '\n\n' +
          formatSpot(first) +
          'Why: ' +
          first.justification +
          '\n\n',
      ),
    ).toBe(true);
    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
    expect(text.split('\n').filter((l) => l.startsWith('Why: '))).toHaveLength(6);
  });
});
