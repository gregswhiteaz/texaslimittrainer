import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  computeEquity,
  type EquityInput,
  type EquityResult,
  type HoleCards,
  type Range,
} from '../../src/advice/equity';
import { expandRange, parseHandRange, unseenCombos } from '../../src/advice/ranges';
import { parseCards, type Card } from '../../src/engine/cards';
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
  shareUnits: number[];
}

interface HeadsUpCase {
  id: string;
  method: string;
  trials: number;
}

function readFixture<T>(name: string): { cases: T[] } {
  return JSON.parse(readFileSync(join(REPO_ROOT, 'tests/advice/fixtures', name), 'utf8')) as {
    cases: T[];
  };
}

const multiway = readFixture<MultiwayCase>('equity-multiway-reference.json');
const headsUp = readFixture<HeadsUpCase>('equity-reference.json');

const TOLERANCE = 0.015;
const KNOWN_HAND = /^[2-9TJQKA][cdhs] [2-9TJQKA][cdhs]$/;

function hole(text: string): HoleCards {
  const [a = -1, b = -1] = parseCards(text);
  return [a, b];
}

/** The opponent's live combos, as the generator resolves them (A-3). */
function resolve(text: string, dead: readonly Card[]): Range {
  if (KNOWN_HAND.test(text)) return [hole(text)];
  return text === 'any' ? unseenCombos(dead) : expandRange(parseHandRange(text), dead);
}

function caseInput(c: MultiwayCase): EquityInput {
  const hero = hole(c.hero);
  const board = parseCards(c.board);
  return { hero, board, opponents: c.opponents.map((text) => resolve(text, [...hero, ...board])) };
}

/** Rule 7: same hero, method and trials; opponent j of the permuted input matches original π(j). */
function expectSameUnderPermutation(
  original: EquityResult,
  permuted: EquityResult,
  permutation: readonly number[],
): void {
  expect(permuted.hero).toStrictEqual(original.hero);
  expect(permuted.method).toBe(original.method);
  expect(permuted.trials).toBe(original.trials);
  permutation.forEach((from, j) => {
    expect(permuted.opponents[j]).toStrictEqual(original.opponents[from]);
  });
}

function permutations(items: readonly number[]): number[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

describe('multiway and range-versus-range equity (TASK-7.7)', () => {
  it('AC#1 every multiway and range case is within 1.5 points of its reference', () => {
    const cases = multiway.cases;
    expect(cases.length).toBeGreaterThanOrEqual(100);
    for (const size of [0, 3, 4, 5]) {
      const sized = cases.filter((c) => parseCards(c.board).length === size);
      expect(sized, `board ${size}`).toHaveLength(30);
      const ranged = sized.filter((c) => c.opponents.some((o) => !KNOWN_HAND.test(o)));
      expect(ranged.length, `board ${size}`).toBeGreaterThanOrEqual(20);
      expect(
        sized.some((c) => c.opponents.filter((o) => !KNOWN_HAND.test(o)).length >= 2),
        `board ${size}`,
      ).toBe(true);
    }

    let largest = { error: 0, id: '' };
    for (const c of cases) {
      expect(c.opponents.length >= 2 || c.opponents.some((o) => !KNOWN_HAND.test(o)), c.id).toBe(
        true,
      );
      const equityInput = caseInput(c);
      expect(
        equityInput.opponents.map((range) => range.length),
        c.id,
      ).toEqual(c.combos);
      const result = computeEquity(equityInput);
      const computed = [result.hero.equity, ...result.opponents.map((o) => o.equity)];
      c.shareUnits.forEach((units, p) => {
        const reference = units / (2520 * c.trials);
        const error = Math.abs((computed[p] ?? NaN) - reference);
        expect(error, `${c.id} player ${p}`).toBeLessThanOrEqual(TOLERANCE);
        if (error > largest.error) largest = { error, id: c.id };
      });
    }
    console.log(
      `AC#1: ${cases.length} cases, largest error ${(largest.error * 100).toFixed(3)} pp (${largest.id})`,
    );
  });

  it('AC#2 at least 200 matchups and each records exhaustive or high-sample', () => {
    const all: HeadsUpCase[] = [...headsUp.cases, ...multiway.cases];
    expect(all.length).toBeGreaterThanOrEqual(200);
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    for (const c of all) expect(['exhaustive', 'high-sample'], c.id).toContain(c.method);
    for (const c of multiway.cases.filter((c) => c.method === 'high-sample')) {
      expect(c.trials, c.id).toBeGreaterThanOrEqual(2_000_000);
      expect(Number.isInteger(c.seed), c.id).toBe(true);
    }
    const methods = new Set(multiway.cases.map((c) => c.method));
    expect(methods).toEqual(new Set(['exhaustive', 'high-sample']));
  });

  it('AC#3 the same ranges in a different order give an identical result', () => {
    const texts = ['TT+ AQs+ AKo', 'any', '77-99 A2s-A5s'];
    for (const boardText of ['', 'Qh 7h 2c']) {
      const hero = hole('Ah Kh');
      const board = parseCards(boardText);
      const ranges = texts.map((text) => resolve(text, [...hero, ...board]));
      const original = computeEquity({ hero, board, opponents: ranges });
      expect(original.method, boardText).toBe('sampled');
      for (const order of permutations([0, 1, 2])) {
        const permuted = computeEquity({
          hero,
          board,
          opponents: order.map((i) => ranges[i] ?? []),
        });
        expect(permuted.method).toBe('sampled');
        expectSameUnderPermutation(original, permuted, order);
      }
    }

    for (const c of multiway.cases.filter((c) => c.opponents.length >= 2)) {
      const equityInput = caseInput(c);
      const order = equityInput.opponents.map((_, i) => i).reverse();
      const reversed = { ...equityInput, opponents: [...equityInput.opponents].reverse() };
      expectSameUnderPermutation(computeEquity(equityInput), computeEquity(reversed), order);
    }
  }, 60_000);

  it('AC#3 opponents holding the same range can be swapped', () => {
    const hero = hole('Ah Kh');
    const board = parseCards('Qh 7h 2c');
    const dead = [...hero, ...board];
    const x = resolve('TT+ AQs+ AKo', dead);
    const xPrime = [...x].reverse().map(([a, b]): HoleCards => [b, a]);
    const y = resolve('any', dead);
    const first = computeEquity({ hero, board, opponents: [x, y, xPrime] });
    const second = computeEquity({ hero, board, opponents: [xPrime, y, x] });
    expect(first.method).toBe('sampled');
    expect(second.method).toBe('sampled');
    expect(second).toStrictEqual(first);
  });
});
