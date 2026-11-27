import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APPLICABLE_SPOTS,
  ChartValidationError,
  chartCell,
  parseChart,
} from '../../src/advice/preflop-chart';
import { REPO_ROOT } from '../support/sandbox';

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
const NON_WORDS = Array.from({ length: 60 }, (_, i) => (i % 2 ? '--;' : String(i))).join(' ');

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
    return (error as ChartValidationError).problems;
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

function withExtraSpot(position: string) {
  const chart = minimalChart();
  chart.spots.push({ ...spot(chart, 'CO', 'unopened'), position });
  return chart;
}

describe('preflop chart validator edge cases', () => {
  it('rejects a justification of 60 numeric or punctuation tokens', () => {
    expect(problemsOf({ ...minimalChart(), justification: NON_WORDS })).toEqual([
      '6-max chart: missing plain-English justification (at least 50 words)',
    ]);
    const chart = minimalChart();
    spot(chart, 'CO', 'raise').justification = NON_WORDS;
    expect(problemsOf(chart)).toEqual([
      '6-max chart: spot CO raise is missing its plain-English justification (at least 15 words)',
    ]);
  });

  it('the shipped six-max chart still validates', () => {
    const raw: unknown = JSON.parse(
      readFileSync(join(REPO_ROOT, 'src/advice/charts/six-max.json'), 'utf8'),
    );
    expect(parseChart(raw).spots).toHaveLength(32);
  });

  it('chartCell throws a documented RangeError for an unknown hand class', () => {
    const chart = parseChart(minimalChart());
    for (const hc of ['ZZ', 'constructor']) {
      let thrown: unknown;
      try {
        chartCell(chart, 'CO', 'unopened', hc);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(RangeError);
      expect((thrown as RangeError).message).toBe(`Unknown hand class ${hc}`);
    }
    const source = readFileSync(join(REPO_ROOT, 'src/advice/preflop-chart.ts'), 'utf8');
    expect(source).toContain("RangeError('Unknown hand class <hc>')");
  });

  it('cuts an echoed bad token to 20 characters', () => {
    expect(problemsOf(withToken('CO', 'unopened', 0, 5, 'X' + 'Y'.repeat(30)))).toEqual([
      '6-max chart: CO unopened A9s has invalid action "X' +
        'Y'.repeat(19) +
        '..." (use F, C or R)',
    ]);
    expect(problemsOf(withToken('CO', 'unopened', 0, 5, 'R/' + 'Q'.repeat(30)))).toEqual([
      '6-max chart: CO unopened A9s has invalid alternative "R/' + 'Q'.repeat(18) + '..."',
    ]);
    expect(problemsOf(withToken('CO', 'unopened', 0, 5, 'X' + 'Y'.repeat(19)))).toEqual([
      '6-max chart: CO unopened A9s has invalid action "X' + 'Y'.repeat(19) + '" (use F, C or R)',
    ]);
  });

  it('cuts an echoed bad spot name to 20 characters', () => {
    expect(problemsOf(withExtraSpot('P'.repeat(25)))).toEqual([
      '6-max chart: spot ' + 'P'.repeat(20) + '... does not apply at 6-max',
    ]);
    expect(problemsOf(withExtraSpot('P'.repeat(11)))).toEqual([
      '6-max chart: spot ' + 'P'.repeat(11) + ' unopened does not apply at 6-max',
    ]);
  });
});
