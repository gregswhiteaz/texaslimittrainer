import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APPLICABLE_SPOTS, type ReferenceSize } from '../../src/advice/preflop-chart';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

interface RawSpot {
  position: string;
  situation: string;
  justification: string;
  grid: string[];
}

interface RawChart {
  justification: string;
  spots: RawSpot[];
}

const RANKS = 'AKQJT98765432';
const FILES: Record<ReferenceSize, string> = {
  'heads-up': 'heads-up.json',
  '6-max': 'six-max.json',
  'full-ring': 'full-ring.json',
};

/** Combos of the class at row r, column c: pairs 6, suited (r < c) 4, offsuit 12. */
const combosAt = (r: number, c: number) => (r === c ? 6 : r < c ? 4 : 12);

function chartPrint(args: readonly string[]) {
  const result = spawnSync('npm', ['run', 'chart:print', '--', ...args], {
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

/** Runs the size and checks the header, chart justification and every spot block; returns the block line 0s. */
function checkReview(size: ReferenceSize, spotCount: number): string[] {
  const raw = JSON.parse(
    readFileSync(join(REPO_ROOT, 'src/advice/charts', FILES[size]), 'utf8'),
  ) as RawChart;
  const run = chartPrint([size]);
  expect(run.status).toBe(0);
  expect(run.stderr).toBe('');
  expect(run.stdout.endsWith('\n')).toBe(true);

  const all = run.stdout.slice(0, -1).split('\n');
  expect(all[0]).toBe(`${size} chart: ${spotCount} spots`);
  expect(all[1]).toBe(raw.justification);
  expect(all[2]).toBe('');

  const blocks = all.slice(3).join('\n').split('\n\n');
  const spots = APPLICABLE_SPOTS[size];
  expect(spots).toHaveLength(spotCount);
  expect(blocks).toHaveLength(spotCount);

  return blocks.map((block, i) => {
    const spot = spots[i] as (typeof spots)[number];
    const name = `${spot.position} ${spot.situation}`;
    const source = raw.spots.find((s) => `${s.position} ${s.situation}` === name) as RawSpot;
    expect(source, name).toBeDefined();
    const lines = block.split('\n');
    expect(lines, name).toHaveLength(16);

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
    expect(lines[15], name).toBe('Why: ' + source.justification);
    return lines[0] as string;
  });
}

describe('chart:print with a size', () => {
  it("chart:print heads-up prints each spot's grid and justification", () => {
    checkReview('heads-up', 6);
  });

  it("chart:print full-ring prints each spot's grid and justification", () => {
    const headers = checkReview('full-ring', 41);
    expect(headers[0]?.startsWith('UTG unopened: ')).toBe(true);
    expect(headers.some((h) => h.startsWith('UTG+1 unopened: '))).toBe(true);
  });

  it("chart:print 6-max prints each spot's grid and justification", () => {
    const headers = checkReview('6-max', 32);
    expect(headers[0]).toBe('UTG unopened: raise 16.0%, continue 16.0%');
  });

  it('chart:print rejects an unknown size', () => {
    const run = chartPrint(['9max']);
    expect(run.status).toBe(2);
    expect(run.stdout).toBe('');
    const lines = run.stderr.split('\n');
    expect(lines).toContain('Unknown chart size "9max". Use heads-up, 6-max or full-ring.');
    expect(lines).toContain('Usage: npm run chart:print -- [heads-up | 6-max | full-ring]');
  });
});
