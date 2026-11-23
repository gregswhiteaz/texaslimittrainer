import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { expandRange, parseHandRange, unseenCombos } from '../../src/advice/ranges';
import { parseCards } from '../../src/engine/cards';
import { evaluate } from '../../src/engine/hand-evaluator';
import {
  computeReference,
  estimateEvaluations,
  EXHAUSTIVE_LIMIT,
  MULTIWAY_CASES,
  MULTIWAY_SEED,
  RANGE_PALETTE,
  resolveOpponent,
  SAMPLE_TRIALS,
} from '../../tools/equity/generate-multiway-reference.js';
import { REPO_ROOT } from '../support/sandbox';

interface MultiwayCase {
  id: string;
  hero: string;
  board: string;
  opponents: string[];
  combos: number[];
  method: string;
  seed: number | null;
  trials: number;
  win: number[];
  tie: number[];
  shareUnits: number[];
  equity: number[];
}

const fixture = JSON.parse(
  readFileSync(join(REPO_ROOT, 'tests/advice/fixtures/equity-multiway-reference.json'), 'utf8'),
) as {
  generator: string;
  shareUnits: number;
  seed: number;
  exhaustiveLimit: number;
  sampleTrials: number;
  cases: MultiwayCase[];
};

const lib = { parseCards, parseHandRange, expandRange, unseenCombos };

function rerun(c: MultiwayCase) {
  const hero = parseCards(c.hero);
  const board = parseCards(c.board);
  const ranges = c.opponents.map((text) => resolveOpponent(text, [...hero, ...board], lib));
  return computeReference(evaluate, hero, board, ranges, {
    limit: EXHAUSTIVE_LIMIT,
    trials: SAMPLE_TRIALS,
    seed: c.seed ?? 0,
  });
}

describe('multiway equity reference set', () => {
  it('multiway reference set is consistent and matches the generator', () => {
    expect(fixture).toMatchObject({
      generator: 'tools/equity/generate-multiway-reference.js',
      shareUnits: 2520,
      seed: 20261122,
      exhaustiveLimit: 100_000_000,
      sampleTrials: 2_000_000,
    });
    expect(MULTIWAY_SEED).toBe(fixture.seed);
    expect(
      fixture.cases.map((c) => ({
        id: c.id,
        hero: c.hero,
        board: c.board,
        opponents: c.opponents,
      })),
    ).toEqual(MULTIWAY_CASES);

    for (const c of fixture.cases) {
      const total = 2520 * c.trials;
      expect(
        c.shareUnits.reduce((sum, units) => sum + units, 0),
        c.id,
      ).toBe(total);
      c.shareUnits.forEach((units, p) => {
        expect((c.win[p] ?? NaN) + (c.tie[p] ?? NaN), c.id).toBeLessThanOrEqual(c.trials);
        expect(c.equity[p], c.id).toBe(Math.round((units / total) * 1e6) / 1e6);
      });
      expect(c.seed === null, c.id).toBe(c.method === 'exhaustive');
      if (c.id.startsWith('mw-')) expect(c.method, c.id).toBe('exhaustive');
    }

    const exhaustiveRanges = fixture.cases.filter(
      (c) => c.id.startsWith('rr-') && c.method === 'exhaustive',
    );
    const estimate = (c: MultiwayCase) => estimateEvaluations(c.combos, parseCards(c.board).length);
    const smallest = exhaustiveRanges.reduce((a, b) => (estimate(b) < estimate(a) ? b : a));
    for (const c of [fixture.cases.find((f) => f.id === 'mw-b5-01'), smallest]) {
      if (!c) throw new Error('missing fixture case');
      expect(rerun(c), c.id).toEqual({
        method: c.method,
        trials: c.trials,
        win: c.win,
        tie: c.tie,
        shareUnits: c.shareUnits,
      });
    }

    expect(resolveOpponent('Jd Jc', parseCards('Ah Kh'), lib)).toHaveLength(1);
    expect(resolveOpponent('any', parseCards('Ah Kh Qh 7h 2c 3d 4s'), lib)).toHaveLength(990);
    expect(RANGE_PALETTE).toEqual([
      'TT+ AQs+ AKo',
      'any',
      '77-99 A2s-A5s',
      '22+ A2s+ K9s+ QTs+ JTs ATo+ KJo+',
      'KQs QJs JTs T9s 98s 87s',
      'AA KK AKs',
    ]);
  }, 60_000);

  it('a high-sample reference is reproducible from its seed and rejects clashing deals', () => {
    const hero = parseCards('Ah Kh');
    const board = parseCards('Qh 7h 2c');
    const ranges = ['AA KK AKs', 'AA KK AKs'].map((text) =>
      resolveOpponent(text, [...hero, ...board], lib),
    );
    const options = { limit: 0, trials: 2000, seed: 7 };
    const first = computeReference(evaluate, hero, board, ranges, options);
    expect(first.method).toBe('high-sample');
    expect(first.trials).toBe(2000);
    expect(first.shareUnits.reduce((sum, units) => sum + units, 0)).toBe(2520 * 2000);
    expect(computeReference(evaluate, hero, board, ranges, options)).toEqual(first);
  });

  it('throws when the opponents cannot all be dealt', () => {
    const hero = parseCards('2c 3c');
    const ranges = [[[48, 49]], [[49, 50]]];
    expect(() =>
      computeReference(evaluate, hero, [], ranges, { limit: 0, trials: 10, seed: 1 }),
    ).toThrow('Opponents cannot all be dealt');
  });
});
