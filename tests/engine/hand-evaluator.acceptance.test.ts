import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import {
  HAND_CATEGORIES,
  HAND_RANK_COUNT,
  compareHands,
  evaluate,
  handCategory,
} from '../../src/engine/hand-evaluator';
import {
  REFERENCE_CLASSES,
  bestReferenceRank,
  fiveCardSubsets,
  referenceClass,
} from './reference-ranking';

const STRONGEST_FIRST = [
  'straight-flush',
  'four-of-a-kind',
  'full-house',
  'flush',
  'straight',
  'three-of-a-kind',
  'two-pair',
  'one-pair',
  'high-card',
];

const ev = (text: string) => evaluate(parseCards(text));

describe('hand evaluator acceptance', () => {
  it('AC#1 every five-card hand matches the 7,462-class reference ranking', () => {
    expect(REFERENCE_CLASSES).toHaveLength(7462);
    const classCounts = STRONGEST_FIRST.map(
      (cat) => REFERENCE_CLASSES.filter((cls) => cls.category === cat).length,
    );
    expect(classCounts).toEqual([10, 156, 156, 1277, 10, 858, 858, 2860, 1277]);
    const blockOrder = REFERENCE_CLASSES.map((cls) => cls.category).filter(
      (cat, i, all) => cat !== all[i - 1],
    );
    expect(blockOrder).toEqual([...STRONGEST_FIRST].reverse());

    const handCounts = new Map<string, number>();
    const seen = new Uint8Array(HAND_RANK_COUNT + 2);
    const hand = [0, 0, 0, 0, 0];
    let total = 0;
    let mismatches = 0;
    let firstMismatch = '';
    for (let a = 0; a < 52; a++)
      for (let b = a + 1; b < 52; b++)
        for (let c = b + 1; c < 52; c++)
          for (let d = c + 1; d < 52; d++)
            for (let e = d + 1; e < 52; e++) {
              hand[0] = a;
              hand[1] = b;
              hand[2] = c;
              hand[3] = d;
              hand[4] = e;
              const rank = evaluate(hand);
              const expected = referenceClass(hand);
              if (rank !== expected.rank || handCategory(rank) !== expected.category) {
                mismatches++;
                firstMismatch ||= `${hand.join(',')}: got ${rank}, expected ${expected.rank}`;
              }
              seen[rank] = 1;
              handCounts.set(expected.category, (handCounts.get(expected.category) ?? 0) + 1);
              total++;
            }
    expect(firstMismatch).toBe('');
    expect(mismatches).toBe(0);
    expect(total).toBe(2_598_960);
    expect(seen[0]).toBe(0);
    expect(seen.subarray(1, HAND_RANK_COUNT + 1).every((s) => s === 1)).toBe(true);
    expect(seen[HAND_RANK_COUNT + 1]).toBe(0);
    expect(STRONGEST_FIRST.map((cat) => handCounts.get(cat))).toEqual([
      40, 624, 3744, 5108, 10200, 54912, 123552, 1098240, 1302540,
    ]);
  }, 60_000);

  it('AC#1 worked examples and category boundaries', () => {
    const examples: [string, number][] = [
      ['7c 5d 4h 3s 2c', 1],
      ['Ac Kd Qh Js 9c', 1277],
      ['2c 2d 3h 4s 5c', 1278],
      ['Ac Ad Kh Qs Jc', 4137],
      ['Ac Ad Ah Ks Qc', 5853],
      ['Ac 2d 3h 4s 5c', 5854],
      ['2c 3d 4h 5s 6c', 5855],
      ['Tc Jd Qh Ks Ac', 5863],
      ['7h 5h 4h 3h 2h', 5864],
      ['Ah Kh Qh Jh 9h', 7140],
      ['2c 2d 2h 3s 3c', 7141],
      ['Ac Ad Ah Ks Kc', 7296],
      ['2c 2d 2h 2s 3c', 7297],
      ['Ac Ad Ah As Kc', 7452],
      ['Ah 2h 3h 4h 5h', 7453],
      ['Ts Js Qs Ks As', 7462],
    ];
    for (const [text, rank] of examples) expect(ev(text), text).toBe(rank);
    const boundaries: [number, string][] = [
      [1, 'high-card'],
      [1277, 'high-card'],
      [1278, 'one-pair'],
      [4137, 'one-pair'],
      [4138, 'two-pair'],
      [4995, 'two-pair'],
      [4996, 'three-of-a-kind'],
      [5853, 'three-of-a-kind'],
      [5854, 'straight'],
      [5863, 'straight'],
      [5864, 'flush'],
      [7140, 'flush'],
      [7141, 'full-house'],
      [7296, 'full-house'],
      [7297, 'four-of-a-kind'],
      [7452, 'four-of-a-kind'],
      [7453, 'straight-flush'],
      [7462, 'straight-flush'],
    ];
    for (const [rank, category] of boundaries)
      expect(handCategory(rank), String(rank)).toBe(category);
    expect(HAND_RANK_COUNT).toBe(7462);
    expect(HAND_CATEGORIES).toEqual(STRONGEST_FIRST);
  });

  it('AC#2 A-2-3-4-5 is the lowest straight', () => {
    const wheel = ev('Ac 2d 3h 4s 5c');
    const sixHigh = ev('2c 3d 4h 5s 6c');
    const bestTrips = ev('Ac Ad Ah Ks Qc');
    expect(compareHands(wheel, sixHigh)).toBe(-1);
    expect(compareHands(wheel, bestTrips)).toBe(1);
    expect(handCategory(wheel)).toBe('straight');
    expect(wheel).toBe(5854);
    const steelWheel = ev('Ah 2h 3h 4h 5h');
    expect(steelWheel).toBe(7453);
    expect(compareHands(steelWheel, ev('Ac Ad Ah As Kc'))).toBe(1);
    expect(handCategory(ev('Qc Kd Ah 2s 3c'))).toBe('high-card');
    expect(ev('Ac 2d 3h 4s 5c 6d 9h')).toBe(5855);
  });

  it('AC#3 seven-card examples equal the best five-card subset', () => {
    const cases: [string, string, number | string][] = [
      ['2c 3d', 'Ts Js Qs Ks As', 7462],
      ['9s 9h', '9d 4c 4s 4h Kc', '9s 9h 9d 4c 4s'],
      ['Kc Qd', 'Ks Qh 2c 2d 7s', 'Kc Ks Qd Qh 7s'],
      ['Ah 2h', '9h 7h 5h 3h Kd', 'Ah 9h 7h 5h 3h'],
      ['Ah 2h', '3h 4h 5h Kh 9c', 7453],
      ['8h 9h', '5h 6h 7h 9s 9c', 7457],
      ['Ac Kd', 'Qc Qd Qh Qs 2c', 'Qc Qd Qh Qs Ac'],
    ];
    for (const [hole, board, best] of cases) {
      const seven = parseCards(`${hole} ${board}`);
      const rank = evaluate(seven);
      const label = `${hole} | ${board}`;
      expect(rank, label).toBe(typeof best === 'number' ? best : ev(best));
      expect(rank, label).toBe(Math.max(...fiveCardSubsets(seven).map((h) => evaluate(h))));
      expect(rank, label).toBe(bestReferenceRank(seven));
    }
    expect(handCategory(ev('9s 9h 9d 4c 4s'))).toBe('full-house');
    expect(handCategory(ev('Kc Ks Qd Qh 7s'))).toBe('two-pair');
    expect(handCategory(ev('Ah 9h 7h 5h 3h'))).toBe('flush');
    expect(handCategory(ev('Qc Qd Qh Qs Ac'))).toBe('four-of-a-kind');
  });

  it('AC#4 a higher kicker breaks the tie', () => {
    const first = ev('Kc Kd As 9h 4c');
    const second = ev('Ks Kh Qd 9c 4d');
    expect(compareHands(first, second)).toBe(1);
    expect(compareHands(second, first)).toBe(-1);
    expect(handCategory(first)).toBe('one-pair');
    expect(handCategory(second)).toBe('one-pair');
    const board = 'Kc Kd 9h 4c 2s';
    expect(compareHands(ev(`As 3d ${board}`), ev(`Qd 3h ${board}`))).toBe(1);
    expect(compareHands(ev('Kc Kd As Jh 4c'), ev('Ks Kh Ad 9c 4d'))).toBe(1);
  });

  it('AC#5 hands that differ only in suits tie', () => {
    expect(compareHands(ev('Kc Kd As 9h 4c'), ev('Ks Kh Ad 9c 4d'))).toBe(0);
    expect(compareHands(ev('Ah Kh 9h 7h 3h'), ev('As Ks 9s 7s 3s'))).toBe(0);
    const board = 'Qh Js 2c 7d 9s';
    expect(compareHands(ev(`Ac Kd ${board}`), ev(`Ad Kc ${board}`))).toBe(0);
  });
});
