import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canonicalise,
  computeEquity,
  deriveSeed,
  type EquityInput,
  type HoleCards,
  type Range,
} from '../../src/advice/equity';
import { parseCards, type Card } from '../../src/engine/cards';
import { REPO_ROOT } from '../support/sandbox';

interface ReferenceCase {
  id: string;
  players: string[];
  board: string;
  method: string;
  trials: number;
  shareUnits: number[];
}

const FIXTURE = join(REPO_ROOT, 'tests/advice/fixtures/equity-reference.json');
const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as { cases: ReferenceCase[] };

const TOLERANCE = 0.015;

function hole(text: string): HoleCards {
  const [a = -1, b = -1] = parseCards(text);
  return [a, b];
}

function input(hero: string, board: string, ...opponents: string[]): EquityInput {
  return { hero: hole(hero), board: parseCards(board), opponents: opponents.map((h) => [hole(h)]) };
}

function everyCombo(dead: readonly Card[]): HoleCards[] {
  const combos: HoleCards[] = [];
  for (let a = 0; a < 52; a++) {
    for (let b = a + 1; b < 52; b++) {
      if (!dead.includes(a) && !dead.includes(b)) combos.push([a, b]);
    }
  }
  return combos;
}

function referenceEquity(c: ReferenceCase): number[] {
  return c.shareUnits.map((units) => units / (2520 * c.trials));
}

function fixtureCase(id: string): ReferenceCase {
  const found = fixture.cases.find((c) => c.id === id);
  if (!found) throw new Error(`missing fixture case ${id}`);
  return found;
}

// SPEC-05 inputs.
const INPUT_A = input('As Ks', '', 'Qh Qd');
const B_DEAD = parseCards('Ah Kh Qh 7h 2c');
const INPUT_B: EquityInput = {
  hero: hole('Ah Kh'),
  board: parseCards('Qh 7h 2c'),
  opponents: [everyCombo(B_DEAD), everyCombo(B_DEAD)],
};
/** INPUT_B with every order changed: board, hero cards, combos, cards in combos and opponents. */
const INPUT_B_REORDERED: EquityInput = {
  hero: hole('Kh Ah'),
  board: parseCards('2c Qh 7h'),
  opponents: [INPUT_B.opponents[1] ?? [], INPUT_B.opponents[0] ?? []].map((range): Range =>
    [...range].reverse().map(([a, b]): HoleCards => [b, a]),
  ),
};

describe('equity calculator (TASK-7.1)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('AC#1 AA vs KK and AKs vs QQ match published values', () => {
    const cases: [EquityInput, number][] = [
      [input('Ah As', '', 'Kd Kc'), 0.819],
      [input('As Ks', '', 'Qh Qd'), 0.462],
      [input('As Ah', '', 'Ks Kd'), 0.8195],
    ];
    for (const [equityInput, expected] of cases) {
      const result = computeEquity(equityInput);
      const villain = result.opponents[0]?.equity ?? NaN;
      expect(result.method).toBe('sampled');
      expect(result.trials).toBe(30_000);
      expect(Math.abs(result.hero.equity - expected)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(villain - (1 - expected))).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(result.hero.equity + villain - 1)).toBeLessThanOrEqual(1e-12);
    }
  });

  it('AC#2 every stored heads-up preflop matchup is within 1.5 points', () => {
    const headsUp = fixture.cases.filter(
      (c) => c.players.length === 2 && c.board === '' && c.method === 'exhaustive',
    );
    expect(headsUp.length).toBeGreaterThanOrEqual(100);
    const pairs = headsUp.map((c) =>
      c.players
        .map((p) =>
          parseCards(p)
            .sort((x, y) => x - y)
            .join(','),
        )
        .sort()
        .join('|'),
    );
    expect(new Set(pairs).size).toBe(headsUp.length);

    let worst = { error: 0, id: '' };
    for (const c of headsUp) {
      const [hero = '', villain = ''] = c.players;
      const result = computeEquity(input(hero, '', villain));
      const computed = [result.hero.equity, result.opponents[0]?.equity ?? NaN];
      referenceEquity(c).forEach((expected, j) => {
        const error = Math.abs((computed[j] ?? NaN) - expected);
        expect(error, `${c.id} player ${j + 1}`).toBeLessThanOrEqual(TOLERANCE);
        if (error > worst.error) worst = { error, id: c.id };
      });
    }
    console.log(
      `AC#2: ${headsUp.length} matchups, largest error ${(worst.error * 100).toFixed(3)} pp (${worst.id})`,
    );
  });

  it('AC#3 AA vs KK vs QQ is within 1.5 points of exhaustive enumeration', () => {
    const expected = referenceEquity(fixtureCase('mw-001'));
    const result = computeEquity(input('Ah As', '', 'Kd Kc', 'Qh Qc'));
    const computed = [result.hero.equity, ...result.opponents.map((o) => o.equity)];
    expect(result.method).toBe('sampled');
    expect(computed).toHaveLength(3);
    expected.forEach((value, j) => {
      expect(Math.abs((computed[j] ?? NaN) - value)).toBeLessThanOrEqual(TOLERANCE);
    });
    expect(Math.abs(computed.reduce((sum, e) => sum + e, 0) - 1)).toBeLessThanOrEqual(1e-12);
  });

  it('AC#4 identical results twice in one process and once in a fresh process', () => {
    const inputs = [INPUT_A, INPUT_B];
    const first = inputs.map((x) => JSON.stringify(computeEquity(x)));
    const second = inputs.map((x) => JSON.stringify(computeEquity(x)));
    expect(computeEquity(INPUT_A).method).toBe('sampled');
    expect(computeEquity(INPUT_B).method).toBe('sampled');

    const script = `
      import { runnerImport } from 'vite';
      let text = '';
      for await (const chunk of process.stdin) text += chunk;
      const { module } = await runnerImport(${JSON.stringify(join(REPO_ROOT, 'src/advice/equity.ts'))}, {
        configFile: false,
        logLevel: 'silent',
      });
      const results = JSON.parse(text).map((x) => JSON.stringify(module.computeEquity(x)));
      process.stdout.write(JSON.stringify(results));
    `;
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: REPO_ROOT,
      input: JSON.stringify(inputs),
      encoding: 'utf8',
      timeout: 50_000,
    });
    expect(child.status, child.stderr).toBe(0);
    const fresh = JSON.parse(child.stdout) as string[];

    expect(second).toEqual(first);
    expect(fresh).toEqual(first);

    // Both opponents hold the same range, so swapping them gives the same canonical input and
    // input position i maps to the same result as before: the swap-back is the identity here.
    expect(JSON.stringify(computeEquity(INPUT_B_REORDERED))).toBe(first[1]);
  }, 60_000);

  it('AC#5 sampler seed depends only on the input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-06-01T00:00:00Z'));
    const reference = computeEquity(INPUT_A);

    vi.setSystemTime(new Date('2001-01-01T00:00:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(computeEquity(INPUT_A)).toEqual(reference);
    vi.restoreAllMocks();
    vi.useRealTimers();

    expect(deriveSeed(canonicalise(INPUT_B_REORDERED))).toBe(deriveSeed(canonicalise(INPUT_B)));
    expect(deriveSeed(canonicalise(input('Ks As', '', 'Qd Qh')))).toBe(
      deriveSeed(canonicalise(INPUT_A)),
    );
    expect(deriveSeed(canonicalise(input('As Ks', '', 'Qh Qc')))).not.toBe(
      deriveSeed(canonicalise(INPUT_A)),
    );

    const adviceDir = join(REPO_ROOT, 'src/advice');
    const sources = readdirSync(adviceDir, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.ts'))
      .map((file) => join(adviceDir, file));
    sources.push(join(REPO_ROOT, 'src/engine/seeded-random.ts'));
    expect(sources.length).toBeGreaterThanOrEqual(2);
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      for (const banned of ['Math.random', 'Date', 'performance', 'crypto', 'process']) {
        expect(text.includes(banned), `${file} contains ${banned}`).toBe(false);
      }
    }
  });
});
