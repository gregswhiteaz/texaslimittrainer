import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cellToken, formatChart, spotWidths } from '../../src/advice/chart-print';
import { APPLICABLE_SPOTS } from '../../src/advice/preflop-chart';
import { SIX_MAX_CHART } from '../../src/advice/preflop';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

interface RawSpot {
  position: string;
  situation: string;
  grid: string[];
}

const RANKS = 'AKQJT98765432';
const raw = JSON.parse(readFileSync(join(REPO_ROOT, 'src/advice/charts/six-max.json'), 'utf8')) as {
  spots: RawSpot[];
};

/** Combos of the class at row r, column c: pairs 6, suited (r < c) 4, offsuit 12. */
const combosAt = (r: number, c: number) => (r === c ? 6 : r < c ? 4 : 12);

function chartPrint() {
  const result = spawnSync('npm', ['run', 'chart:print'], {
    cwd: REPO_ROOT,
    env: sandboxEnv(),
    encoding: 'utf8',
  });
  const lines = result.stdout.split('\n');
  const start = lines.findIndex((line) => line !== '' && !line.startsWith('>'));
  return {
    status: result.status,
    stdout: start < 0 ? '' : lines.slice(start).join('\n'),
    stderr: result.stderr,
  };
}

describe('chart:print', () => {
  it('chart:print prints every spot as a 13x13 grid with raise and continue percentages', () => {
    const run = chartPrint();
    expect(run.status).toBe(0);
    expect(run.stderr).toBe('');
    expect(run.stdout.endsWith('\n')).toBe(true);

    const blocks = run.stdout.slice(0, -1).split('\n\n');
    const spots = APPLICABLE_SPOTS['6-max'];
    expect(blocks).toHaveLength(26);
    expect(spots).toHaveLength(26);

    blocks.forEach((block, i) => {
      const spot = spots[i] as (typeof spots)[number];
      const name = `${spot.position} ${spot.situation}`;
      const source = raw.spots.find((s) => `${s.position} ${s.situation}` === name) as RawSpot;
      const lines = block.split('\n');
      expect(lines, name).toHaveLength(15);

      const tokens = source.grid.map((row) => row.trim().split(/\s+/));
      let raise = 0;
      let cont = 0;
      tokens.forEach((row, r) =>
        row.forEach((token, c) => {
          if (token.startsWith('R')) raise += combosAt(r, c);
          if (token.startsWith('R') || token.startsWith('C')) cont += combosAt(r, c);
        }),
      );
      const pct = (combos: number) => ((combos / 1326) * 100).toFixed(1);
      expect(lines[0], name).toBe(`${name}: raise ${pct(raise)}%, continue ${pct(cont)}%`);

      expect(lines[1]?.trim().split(/\s+/), name).toEqual([...RANKS]);
      tokens.forEach((row, r) => {
        const printed = (lines[r + 2] as string).trim().split(/\s+/);
        expect(printed[0], name).toBe(RANKS[r]);
        expect(printed.slice(1), `${name} row ${RANKS[r]}`).toEqual(row);
      });
    });

    const all = run.stdout.split('\n');
    expect(all).toContain('UTG unopened: raise 16.0%, continue 16.0%');
    expect(all).toContain('BB limpers: raise 9.4%, continue 100.0%');

    const inProcess = formatChart(SIX_MAX_CHART);
    expect(inProcess).toBe(run.stdout);
    expect(inProcess.split('\n').slice(0, 3)).toEqual([
      'UTG unopened: raise 16.0%, continue 16.0%',
      '     A    K    Q    J    T    9    8    7    6    5    4    3    2',
      'A    R    R    R    R    R    R    R    R    R    R    R    R    R',
    ]);
  });

  it('prints a token without a borderline mark exactly as authored', () => {
    expect(cellToken({ action: 'call', borderline: false, alternative: 'raise' })).toBe('C/R');
    expect(cellToken({ action: 'fold', borderline: true, alternative: null })).toBe('F*');
    expect(cellToken({ action: 'raise', borderline: true, alternative: 'fold' })).toBe('R*/F');
  });

  it('reports unrounded widths', () => {
    const utg = SIX_MAX_CHART.spots[0];
    if (utg === undefined) throw new Error('chart has no spots');
    const { raisePct, continuePct } = spotWidths(utg);
    expect(raisePct).toBeCloseTo((212 / 1326) * 100, 10);
    expect(continuePct).toBe(raisePct);
  });
});
