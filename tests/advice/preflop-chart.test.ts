import { describe, expect, it } from 'vitest';
import {
  APPLICABLE_SPOTS,
  ChartValidationError,
  chartCell,
  parseChart,
} from '../../src/advice/preflop-chart';

interface RawSpot {
  position: unknown;
  situation: unknown;
  justification?: unknown;
  grid?: unknown;
}
interface RawChart {
  format: unknown;
  version: unknown;
  referenceSize: unknown;
  justification?: unknown;
  spots: RawSpot[];
}

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
const row = (token: string) => Array.from({ length: 13 }, () => token).join(' ');

/** All cells F except BB limpers C. */
function minimalChart(): RawChart {
  return {
    format: 'tlh-preflop-chart',
    version: 1,
    referenceSize: '6-max',
    justification: words(50),
    spots: APPLICABLE_SPOTS['6-max'].map(({ position, situation }) => ({
      position,
      situation,
      justification: words(15),
      grid: Array.from({ length: 13 }, () =>
        row(position === 'BB' && situation === 'limpers' ? 'C' : 'F'),
      ),
    })),
  };
}

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseChart(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(ChartValidationError);
    const { problems, message } = error as ChartValidationError;
    expect(message).toBe('Invalid preflop chart:\n- ' + problems.join('\n- '));
    return problems;
  }
  return [];
}

function spot(chart: RawChart, position: string, situation: string): RawSpot {
  return chart.spots.find((s) => s.position === position && s.situation === situation) as RawSpot;
}

/** Sets one token of a spot's grid (row, col in grid order). */
function withToken(position: string, situation: string, r: number, c: number, token: string) {
  const chart = minimalChart();
  const grid = spot(chart, position, situation).grid as string[];
  const tokens = (grid[r] as string).split(' ');
  tokens[c] = token;
  grid[r] = tokens.join(' ');
  return chart;
}

describe('preflop chart validator', () => {
  it('validates charts with exact problems', () => {
    expect(problemsOf(minimalChart())).toEqual([]);

    const formatProblem = ['Chart file: expected format "tlh-preflop-chart" version 1'];
    expect(problemsOf(null)).toEqual(formatProblem);
    expect(problemsOf([])).toEqual(formatProblem);
    expect(problemsOf({ ...minimalChart(), format: 'other' })).toEqual(formatProblem);
    expect(problemsOf({ ...minimalChart(), version: 2 })).toEqual(formatProblem);
    expect(problemsOf({ ...minimalChart(), referenceSize: '9-max' })).toEqual([
      'Chart file: unknown reference size "9-max"',
    ]);
    // Every 6-max spot also applies at full ring, so a 6-max spot list misses only the full-ring-only spots.
    const sixMaxKeys = new Set(
      APPLICABLE_SPOTS['6-max'].map((s) => `${s.position} ${s.situation}`),
    );
    expect(problemsOf({ ...minimalChart(), referenceSize: 'full-ring' })).toEqual(
      APPLICABLE_SPOTS['full-ring']
        .map((s) => `${s.position} ${s.situation}`)
        .filter((key) => !sixMaxKeys.has(key))
        .map((key) => `full-ring chart: missing spot ${key}`),
    );

    expect(problemsOf({ ...minimalChart(), justification: words(49) })).toEqual([
      '6-max chart: missing plain-English justification (at least 50 words)',
    ]);
    expect(problemsOf({ ...minimalChart(), justification: 42 })).toEqual([
      '6-max chart: missing plain-English justification (at least 50 words)',
    ]);

    const missing = minimalChart();
    missing.spots = missing.spots.filter((s) => s.situation !== 'blind-defence');
    expect(problemsOf(missing)).toEqual([
      '6-max chart: missing spot SB blind-defence',
      '6-max chart: missing spot BB blind-defence',
    ]);
    expect(problemsOf({ ...minimalChart(), spots: 'none' })).toHaveLength(26);

    const extra = minimalChart();
    extra.spots.push({ ...(extra.spots[0] as RawSpot), situation: 'limpers' });
    extra.spots.push({ ...(extra.spots[0] as RawSpot), position: 'XX' });
    extra.spots.push('junk' as unknown as RawSpot);
    extra.spots.push({ ...(extra.spots[1] as RawSpot) });
    expect(problemsOf(extra)).toEqual([
      '6-max chart: spot UTG limpers does not apply at 6-max',
      '6-max chart: spot XX unopened does not apply at 6-max',
      '6-max chart: spot undefined undefined does not apply at 6-max',
      '6-max chart: duplicate spot HJ unopened',
    ]);

    const quiet = minimalChart();
    spot(quiet, 'CO', 'raise').justification = words(14);
    expect(problemsOf(quiet)).toEqual([
      '6-max chart: spot CO raise is missing its plain-English justification (at least 15 words)',
    ]);

    const rows = minimalChart();
    spot(rows, 'BTN', 'unopened').grid = [row('F')];
    spot(rows, 'SB', 'unopened').grid = 'F';
    expect(problemsOf(rows)).toEqual([
      '6-max chart: spot BTN unopened needs 13 grid rows, got 1',
      '6-max chart: spot SB unopened needs 13 grid rows, got 0',
    ]);

    const long = minimalChart();
    (spot(long, 'HJ', 'raise').grid as string[])[4] = row('F') + ' F';
    expect(problemsOf(long)).toEqual([
      '6-max chart: spot HJ raise row T has 14 cells, expected 13',
    ]);

    const short = minimalChart();
    (spot(short, 'BTN', 'raise').grid as string[])[12] = 'F F F F F F F F F F F';
    expect(problemsOf(short)).toEqual([
      '6-max chart: BTN raise 32o has no action',
      '6-max chart: BTN raise 22 has no action',
    ]);
    const notString = minimalChart();
    (spot(notString, 'BTN', 'raise').grid as unknown[])[12] = 7;
    expect(problemsOf(notString)).toHaveLength(13);

    const cellCases: [string, string][] = [
      ['-', 'has no action'],
      ['X', 'has invalid action "X" (use F, C or R)'],
      ['R+', 'has invalid action "R+" (use F, C or R)'],
      ['R/C/F', 'has more than one acceptable alternative'],
      ['R/Q', 'has invalid alternative "R/Q"'],
      ['R*/', 'has invalid alternative "R*/"'],
      ['C*/C', 'repeats its action as the alternative'],
    ];
    for (const [token, problem] of cellCases) {
      expect(problemsOf(withToken('CO', 'unopened', 0, 5, token)), token).toEqual([
        `6-max chart: CO unopened A9s ${problem}`,
      ]);
    }

    expect(problemsOf(withToken('BB', 'limpers', 5, 0, 'F'))).toEqual([
      '6-max chart: BB limpers A9o folds where checking is free',
    ]);
    expect(problemsOf(withToken('BB', 'limpers', 5, 0, 'C/F'))).toEqual([]);

    const several = withToken('UTG', 'unopened', 0, 1, 'X');
    several.justification = '';
    spot(several, 'BB', 'blind-defence').justification = '';
    expect(problemsOf(several)).toEqual([
      '6-max chart: missing plain-English justification (at least 50 words)',
      '6-max chart: UTG unopened AKs has invalid action "X" (use F, C or R)',
      '6-max chart: spot BB blind-defence is missing its plain-English justification (at least 15 words)',
    ]);
  });

  it('parses tokens and compiles spots in chart order', () => {
    const chart = withToken('CO', 'unopened', 0, 0, 'R');
    const grid = spot(chart, 'CO', 'unopened').grid as string[];
    grid[0] = 'R F* R*/C C/F' + ' F'.repeat(9);
    chart.spots.reverse();
    const parsed = parseChart(chart);
    expect(parsed.referenceSize).toBe('6-max');
    expect(parsed.justification).toBe(words(50));
    expect(parsed.spots.map(({ position, situation }) => ({ position, situation }))).toEqual(
      APPLICABLE_SPOTS['6-max'],
    );
    expect(parsed.spots[0]?.justification).toBe(words(15));
    expect(
      ['AA', 'AKs', 'AQs', 'AJs'].map((hc) => chartCell(parsed, 'CO', 'unopened', hc)),
    ).toEqual([
      { action: 'raise', borderline: false, alternative: null },
      { action: 'fold', borderline: true, alternative: null },
      { action: 'raise', borderline: true, alternative: 'call' },
      { action: 'call', borderline: false, alternative: 'fold' },
    ]);
    expect(chartCell(parsed, 'BB', 'limpers', '72o').action).toBe('call');

    const partial = { ...parsed, spots: parsed.spots.slice(1) };
    expect(() => chartCell(partial, 'UTG', 'unopened', 'AA')).toThrow(
      new RangeError('Chart 6-max has no spot UTG unopened'),
    );
    expect(() => chartCell(parsed, 'UTG', 'unopened', 'constructor')).toThrow(RangeError);
  });
});
