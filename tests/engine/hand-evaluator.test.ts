import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import {
  buildEvaluatorTables,
  compareHands,
  evaluate,
  handCategory,
} from '../../src/engine/hand-evaluator';

const popcount = (mask: number) => mask.toString(2).replaceAll('0', '').length;

describe('hand evaluator', () => {
  it('rejects invalid hands and ranks', () => {
    const cards = parseCards('As Kd 7h 2c 9s Td 3c');
    expect(() => evaluate(cards.slice(0, 4))).toThrow(
      new RangeError('Hand must have 5 to 7 cards, got 4'),
    );
    expect(() => evaluate([...cards, 0])).toThrow(
      new RangeError('Hand must have 5 to 7 cards, got 8'),
    );
    expect(() => evaluate([])).toThrow(new RangeError('Hand must have 5 to 7 cards, got 0'));
    for (const bad of [52, -1, 1.5, NaN]) {
      expect(() => evaluate([...cards.slice(0, 4), bad])).toThrow(
        new RangeError(`Invalid card: ${bad}`),
      );
    }
    expect(() => evaluate(parseCards('As Kd 7h 2c As'))).toThrow(
      new RangeError('Duplicate card: As'),
    );
    expect(() => evaluate(parseCards('2c Kd 7h 2c As 9s'))).toThrow(
      new RangeError('Duplicate card: 2c'),
    );
    // A rejected call leaves no state behind.
    expect(evaluate(parseCards('As Ks Qs Js Ts'))).toBe(7462);
    for (const bad of [0, 7463, 2.5, NaN]) {
      expect(() => handCategory(bad)).toThrow(new RangeError(`Invalid hand rank: ${bad}`));
    }
    expect(compareHands(5, 5)).toBe(0);
    expect(compareHands(4, 5)).toBe(-1);
    expect(compareHands(5, 4)).toBe(1);
  });

  it('builds the lookup tables within 512 KiB', () => {
    const tables = buildEvaluatorTables();
    expect(tables.flush).toHaveLength(8192);
    for (let mask = 0; mask < 8192; mask++) {
      if (popcount(mask) < 5) expect(tables.flush[mask]).toBe(0);
    }
    const straightMasks = [0x100f, ...Array.from({ length: 9 }, (_, i) => 0x1f << i)];
    expect(straightMasks.map((mask) => tables.flush[mask])).toEqual(
      Array.from({ length: 10 }, (_, i) => 7453 + i),
    );
    const arrays = Object.values(tables);
    expect(arrays.every((a) => a instanceof Uint16Array || a instanceof Uint32Array)).toBe(true);
    const bytes = arrays.reduce((sum, a) => sum + a.byteLength, 0);
    expect(bytes).toBeLessThanOrEqual(524_288);
    expect(buildEvaluatorTables()).toEqual(tables);
  });

  it('ranks six and seven card hands that contain several made hands', () => {
    // Two sets of trips make a full house with the higher trips.
    expect(evaluate(parseCards('9s 9h 9d 4c 4s 4h Kc'))).toBe(
      evaluate(parseCards('9s 9h 9d 4c 4s')),
    );
    // Three pairs play the top two with the best remaining kicker.
    expect(evaluate(parseCards('Kc Kd Qh Qs 7c 7d 2h'))).toBe(
      evaluate(parseCards('Kc Kd Qh Qs 7c')),
    );
    // Quads beat a straight that is also present.
    expect(handCategory(evaluate(parseCards('5c 5d 5h 5s 6c 7d 8h')))).toBe('four-of-a-kind');
    // A six-card flush hides a straight flush.
    expect(evaluate(parseCards('2h 3h 4h 5h 6h Kh'))).toBe(7454);
  });
});
