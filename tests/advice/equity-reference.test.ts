import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import { evaluate } from '../../src/engine/hand-evaluator';
import { enumerateExact, REFERENCE_MATCHUPS } from '../../tools/equity/generate-reference.js';
import { REPO_ROOT } from '../support/sandbox';

vi.setConfig({ testTimeout: 30_000 });

interface ReferenceCase {
  id: string;
  players: string[];
  board: string;
  method: string;
  trials: number;
  win: number[];
  tie: number[];
  shareUnits: number[];
  equity: number[];
}

const fixture = JSON.parse(
  readFileSync(join(REPO_ROOT, 'tests/advice/fixtures/equity-reference.json'), 'utf8'),
) as { generator: string; shareUnits: number; cases: ReferenceCase[] };

const TRIALS_BY_PLAYERS: Record<number, number> = { 2: 1_712_304, 3: 1_370_754 };

function byId(id: string): ReferenceCase {
  const found = fixture.cases.find((c) => c.id === id);
  if (!found) throw new Error(`missing fixture case ${id}`);
  return found;
}

/** Hero equity from the integer counts, unrounded. */
function heroEquity(id: string): number {
  const c = byId(id);
  return (c.shareUnits[0] ?? NaN) / (2520 * c.trials);
}

describe('equity reference set', () => {
  it('reference set is consistent and matches the generator', () => {
    expect(fixture.generator).toBe('tools/equity/generate-reference.js');
    expect(fixture.shareUnits).toBe(2520);
    expect(fixture.cases.map((c) => ({ id: c.id, players: c.players, board: c.board }))).toEqual(
      REFERENCE_MATCHUPS,
    );

    for (const c of fixture.cases) {
      const total = 2520 * c.trials;
      expect(c.method).toBe('exhaustive');
      expect(c.board).toBe('');
      expect(c.trials, c.id).toBe(TRIALS_BY_PLAYERS[c.players.length]);
      c.players.forEach((_, j) => {
        expect((c.win[j] ?? NaN) + (c.tie[j] ?? NaN)).toBeLessThanOrEqual(c.trials);
        expect(c.equity[j]).toBe(Math.round(((c.shareUnits[j] ?? NaN) / total) * 1e6) / 1e6);
      });
      expect(
        c.shareUnits.reduce((sum, units) => sum + units, 0),
        c.id,
      ).toBe(total);
    }

    expect(byId('hu-001')).toMatchObject({
      trials: 1_712_304,
      win: [1_388_072, 317_694],
      tie: [6538, 6538],
    });
    expect(byId('hu-004')).toMatchObject({ win: [787_966, 917_606], tie: [6732, 6732] });
    expect(byId('mw-001')).toMatchObject({
      trials: 1_370_754,
      win: [914_778, 251_982, 198_545],
    });
    expect(heroEquity('hu-001')).toBeCloseTo(0.81255, 5);
    expect(heroEquity('hu-002')).toBeCloseTo(0.81946, 5);
    expect(heroEquity('hu-003')).toBeCloseTo(0.82637, 5);
    expect(heroEquity('hu-004')).toBeCloseTo(0.46214, 5);
    expect(heroEquity('hu-005')).toBeCloseTo(0.45883, 5);
    expect(heroEquity('hu-011')).toBeCloseTo(0.69303, 5);
    expect(byId('mw-001').equity).toEqual([0.668679, 0.185152, 0.146169]);

    for (const id of ['hu-002', 'hu-004']) {
      const stored = byId(id);
      const counts = enumerateExact(
        evaluate,
        stored.players.map((p) => parseCards(p)),
        parseCards(stored.board),
      );
      expect(counts).toEqual({
        trials: stored.trials,
        win: stored.win,
        tie: stored.tie,
        shareUnits: stored.shareUnits,
      });
    }
  }, 60_000);
});
