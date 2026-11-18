import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canonicalise,
  canonicalKey,
  computeEquity,
  EXACT_EVALUATION_LIMIT,
  estimateEvaluations,
  sampledEquity,
  type EquityInput,
  type HoleCards,
  type Range,
} from '../../src/advice/equity';
import { parseCards, type Card } from '../../src/engine/cards';
import { evaluate } from '../../src/engine/hand-evaluator';
import { enumerateExact } from '../../tools/equity/generate-reference.js';
import { REPO_ROOT } from '../support/sandbox';
import { speedLimitsEnforced } from '../support/speed';

function hole(text: string): HoleCards {
  const [a = -1, b = -1] = parseCards(text);
  return [a, b];
}

function range(...hands: string[]): Range {
  return hands.map(hole);
}

function input(hero: string, board: string, ...opponents: Range[]): EquityInput {
  return { hero: hole(hero), board: parseCards(board), opponents };
}

/** Every two-card combo that avoids the given cards, in (low, high) order. */
function everyCombo(dead: readonly Card[]): HoleCards[] {
  const combos: HoleCards[] = [];
  for (let a = 0; a < 52; a++) {
    for (let b = a + 1; b < 52; b++) {
      if (!dead.includes(a) && !dead.includes(b)) combos.push([a, b]);
    }
  }
  return combos;
}

function expectRangeError(run: () => unknown, message: string): void {
  let error: unknown;
  try {
    run();
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(RangeError);
  expect((error as RangeError).message).toBe(message);
}

describe('computeEquity', () => {
  it('exact enumeration matches hand-checked cases', () => {
    const flop = computeEquity(input('Ah As', 'Kh 7c 2d', range('Kd Kc')));
    expect(flop.method).toBe('exact');
    expect(flop.trials).toBe(990);
    expect(flop.hero).toEqual({ win: 85 / 990, tie: 0, equity: 85 / 990 });
    expect(flop.opponents[0]?.equity).toBe(905 / 990);

    const river = computeEquity(input('Qs Qh', 'Ah Kd 7c 7s 2h', range('Qd Qc')));
    expect(river.trials).toBe(1);
    for (const player of [river.hero, ...river.opponents]) {
      expect(player).toEqual({ win: 0, tie: 1, equity: 0.5 });
    }

    const drawing = computeEquity(input('As Ks', 'Js Ts 2c', range('Qh Qd')));
    const counts = enumerateExact(
      evaluate,
      [parseCards('As Ks'), parseCards('Qh Qd')],
      parseCards('Js Ts 2c'),
    );
    expect(drawing.method).toBe('exact');
    expect(drawing.trials).toBe(counts.trials);
    [drawing.hero, drawing.opponents[0]].forEach((player, j) => {
      expect(player?.win).toBe((counts.win[j] ?? NaN) / counts.trials);
      expect(player?.tie).toBe((counts.tie[j] ?? NaN) / counts.trials);
      expect(player?.equity).toBe((counts.shareUnits[j] ?? NaN) / (2520 * counts.trials));
    });

    const royal = computeEquity(input('2c 3d', 'Ts Js Qs Ks As', range('4h 5h'), range('6c 7d')));
    for (const player of [royal.hero, ...royal.opponents]) {
      expect(player).toEqual({ win: 0, tie: 1, equity: 1 / 3 });
    }
  });

  it('chooses exact or sampled from the estimated work', () => {
    const flopDead = parseCards('Ah Kh Qh 7h 2c');
    const turnDead = parseCards('Ah Kh Qh 7h 2c 9s');
    const riverDead = parseCards('Ah Kh Qh 7h 2c 9s 3d');
    const examples: [EquityInput, number, 'exact' | 'sampled'][] = [
      [input('As Ks', '', range('Qh Qd')), 3_424_608, 'sampled'],
      [input('Ah As', 'Kh 7c 2d', range('Kd Kc')), 1_980, 'exact'],
      [input('Ah Kh', 'Qh 7h 2c', everyCombo(flopDead)), 2_140_380, 'sampled'],
      [input('Ah Kh', 'Qh 7h 2c 9s', everyCombo(turnDead)), 91_080, 'exact'],
      // 45 unseen cards on the river leave 990 live combos: 990 × C(43, 0) × 2.
      [input('Ah Kh', 'Qh 7h 2c 9s 3d', everyCombo(riverDead)), 1_980, 'exact'],
      [input('Ah As', '', range('Kd Kc'), range('Qh Qc')), 4_112_262, 'sampled'],
    ];
    for (const [equityInput, estimate, method] of examples) {
      expect(estimateEvaluations(canonicalise(equityInput))).toBe(estimate);
      expect(computeEquity(equityInput).method).toBe(method);
    }

    // Opponent 1's combos all share the lowest live card, so opponent 2 avoids it.
    const turnLive = everyCombo(turnDead);
    const lowest = turnLive[0]?.[0];
    const otherLive = turnLive.filter((combo) => combo[0] !== lowest);
    const threeWayTurn = (size: number) =>
      input('Ah Kh', 'Qh 7h 2c 9s', turnLive.slice(0, size), otherLive.slice(0, size));
    expect(estimateEvaluations(canonicalise(threeWayTurn(39)))).toBe(191_646);
    expect(computeEquity(threeWayTurn(39)).method).toBe('exact');
    expect(estimateEvaluations(canonicalise(threeWayTurn(40)))).toBe(201_600);
    expect(computeEquity(threeWayTurn(40)).method).toBe('sampled');
    expect(191_646).toBeLessThanOrEqual(EXACT_EVALUATION_LIMIT);
  });

  it('canonicalises cards, combos and opponents', () => {
    const clean = input('Ah Kh', 'Qh 7h 2c 9s 3d', range('Qd Qc', 'Js Ts'), range('8s 8d'));
    const noisy = input(
      'Ah Kh',
      'Qh 7h 2c 9s 3d',
      range('Ts Js', 'Ah Qd', 'Qd Qc', 'Qc Qd', '2c 2d', 'Js Ts'),
      range('8d 8s', 'Kh 8c'),
    );
    expect(computeEquity(noisy)).toEqual(computeEquity(clean));

    const handVsHand = computeEquity(input('As Ks', 'Qs 7h 2c 9s', range('Jh Jd')));
    const oneLiveCombo = computeEquity(input('As Ks', 'Qs 7h 2c 9s', range('As Jc', 'Jd Jh')));
    expect(oneLiveCombo).toEqual(handVsHand);

    expect(canonicalKey(canonicalise(input('As Ks', '', range('Qh Qd'))))).toBe(
      'equity-v1|h:47,51|b:|o:41,42',
    );

    const cardsArb = fc.shuffledSubarray(
      Array.from({ length: 52 }, (_, i) => i),
      { minLength: 13, maxLength: 13 },
    );
    const pairArb = fc
      .tuple(fc.integer({ min: 0, max: 51 }), fc.integer({ min: 0, max: 51 }))
      .filter(([a, b]) => a !== b);
    const caseArb = fc.record({
      cards: cardsArb,
      opponents: fc.integer({ min: 1, max: 3 }),
      extras: fc.array(fc.array(pairArb, { maxLength: 4 }), { minLength: 3, maxLength: 3 }),
      shuffle: fc.array(fc.nat(), { minLength: 40, maxLength: 40 }),
    });
    fc.assert(
      fc.property(caseArb, ({ cards, opponents, extras, shuffle }) => {
        let cursor = 0;
        const next = (n: number) => (shuffle[cursor++ % shuffle.length] ?? 0) % n;
        const permute = <T>(items: readonly T[]): T[] => {
          const out = [...items];
          for (let i = out.length - 1; i > 0; i--) {
            const j = next(i + 1);
            [out[i], out[j]] = [out[j] as T, out[i] as T];
          }
          return out;
        };
        const [h1 = 0, h2 = 0, ...rest] = cards;
        const original: EquityInput = {
          hero: [h1, h2],
          board: rest.slice(0, 5),
          opponents: Array.from({ length: opponents }, (_, i): Range => [
            [rest[5 + 2 * i] ?? 0, rest[6 + 2 * i] ?? 0],
            ...(extras[i] ?? []),
          ]),
        };
        const opponentOrder = permute(original.opponents.map((_, i) => i));
        const permuted: EquityInput = {
          hero: [h2, h1],
          board: permute(original.board),
          opponents: opponentOrder.map((i) =>
            permute(original.opponents[i] ?? []).map(([a, b]): HoleCards =>
              next(2) === 0 ? [a, b] : [b, a],
            ),
          ),
        };
        const expected = computeEquity(original);
        const actual = computeEquity(permuted);
        expect(actual.method).toBe('exact');
        expect(actual.hero).toEqual(expected.hero);
        expect(actual.trials).toBe(expected.trials);
        opponentOrder.forEach((inputIndex, j) => {
          expect(actual.opponents[j]).toEqual(expected.opponents[inputIndex]);
        });
      }),
      { numRuns: 50 },
    );
  });

  it('rejects invalid input with exact messages', () => {
    const kk = range('Kd Kc');
    const cases: [EquityInput, string][] = [
      [
        { hero: [51] as unknown as HoleCards, board: [], opponents: [kk] },
        'Hero must have 2 cards, got 1',
      ],
      [input('As Ah', 'Qh Qd', kk), 'Board must have 0, 3, 4 or 5 cards, got 2'],
      [input('As Ah', ''), 'Expected 1 to 9 opponents, got 0'],
      [input('As Ah', '', ...new Array<Range>(10).fill(kk)), 'Expected 1 to 9 opponents, got 10'],
      [{ hero: [52, 1], board: [], opponents: [kk] }, 'Invalid card: 52'],
      [input('As Ah', 'As 7c 2d', kk), 'Duplicate card: As'],
      [input('As Ah', '', kk, [[51, 51]]), 'Opponent 2 has an invalid combo: 51,51'],
      [input('As Ah', 'Kd 7c 2d', kk), 'Opponent 1 has no possible hand'],
      [input('As Ah', 'Qh 7c 2d 3s 4s', kk, kk), "Opponents' hands cannot all be dealt together"],
      [input('As Ah', '', kk, kk), "Opponents' hands cannot all be dealt together"],
    ];
    for (const [equityInput, message] of cases) {
      expectRangeError(() => computeEquity(equityInput), message);
    }
    expectRangeError(
      () => computeEquity(input('As Ah', '', [[48, 3, 7] as unknown as HoleCards])),
      'Opponent 1 has an invalid combo: 48,3',
    );

    const overlapping = canonicalise(input('As Ah', '', range('Kd Kc', 'Qh Qc'), kk));
    expectRangeError(
      () => sampledEquity(overlapping, 30_000, 0),
      'Sampling rejected too many deals',
    );

    // Opponent 1 can only be dealt Qh Qc, so this is AA vs QQ vs KK with fixed suits (mw-001).
    const reference = JSON.parse(
      readFileSync(join(REPO_ROOT, 'tests/advice/fixtures/equity-reference.json'), 'utf8'),
    ) as { cases: { id: string; trials: number; shareUnits: number[] }[] };
    const mw = reference.cases.find((c) => c.id === 'mw-001');
    const [aa = NaN, kings = NaN, queens = NaN] =
      mw?.shareUnits.map((units) => units / (2520 * mw.trials)) ?? [];
    const result = sampledEquity(overlapping, 30_000);
    expect(overlapping.order).toEqual([0, 1]);
    expect(result.trials).toBe(30_000);
    expect(Math.abs(result.hero.equity - aa)).toBeLessThanOrEqual(0.015);
    expect(Math.abs((result.opponents[0]?.equity ?? NaN) - queens)).toBeLessThanOrEqual(0.015);
    expect(Math.abs((result.opponents[1]?.equity ?? NaN) - kings)).toBeLessThanOrEqual(0.015);
  });

  it('bounds the work when range sets cannot all be dealt', () => {
    const known = parseCards('Ah Kh Qh Jh Th');
    const broadway = everyCombo(known).filter(([a, b]) => a >= 32 && b >= 32);
    const low = everyCombo(known).filter(([a, b]) => a < 32 && b < 32);
    expect(broadway).toHaveLength(105);
    // The error messages prove the rejection cap or feasibility budget ended each call; the ceiling
    // catches a much larger budget. CI uses 10 s because shared runners are slow.
    const BOUNDED_WORK_MS = speedLimitsEnforced() ? 2000 : 10_000;
    const timed = (opponents: Range[], message: string): void => {
      const start = performance.now();
      expectRangeError(
        () => computeEquity({ hero: hole('Ah Kh'), board: parseCards('Qh Jh Th'), opponents }),
        message,
      );
      expect(performance.now() - start).toBeLessThan(BOUNDED_WORK_MS);
    };
    // 8 opponents need 16 cards from the 15 left in T-A.
    timed(new Array<Range>(8).fill(broadway), "Opponents' hands cannot all be dealt together");
    // Enough cards in total, but the 8 broadway ranges still cannot be dealt: the search budget
    // runs out and the rejection cap ends the call.
    timed([low, ...new Array<Range>(8).fill(broadway)], 'Sampling rejected too many deals');
    // 7 opponents can be dealt; the sampler's rejection cap still applies as before.
    timed(new Array<Range>(7).fill(broadway), 'Sampling rejected too many deals');
  });
});
