import { describe, expect, it } from 'vitest';
import { comboCount, HAND_CLASSES, handClassAt, handClassOf } from '../../src/advice/hand-class';
import { parseCards, type Card } from '../../src/engine/cards';

const hole = (text: string) => parseCards(text) as [Card, Card];

describe('hand classes', () => {
  it('names and orders the 169 hand classes', () => {
    expect(HAND_CLASSES).toHaveLength(169);
    expect(new Set(HAND_CLASSES).size).toBe(169);
    expect(HAND_CLASSES.filter((hc) => hc.length === 2)).toHaveLength(13);
    expect(HAND_CLASSES.filter((hc) => hc.endsWith('s'))).toHaveLength(78);
    expect(HAND_CLASSES.filter((hc) => hc.endsWith('o'))).toHaveLength(78);
    expect([HAND_CLASSES[0], HAND_CLASSES[1], HAND_CLASSES[13], HAND_CLASSES[168]]).toEqual([
      'AA',
      'AKs',
      'AKo',
      '22',
    ]);
    expect(HAND_CLASSES.reduce((sum, hc) => sum + comboCount(hc), 0)).toBe(1326);
    expect([comboCount('77'), comboCount('T9s'), comboCount('T9o')]).toEqual([6, 4, 12]);

    expect(handClassOf(hole('As 9h'))).toBe('A9o');
    expect(handClassOf(hole('9h As'))).toBe('A9o');
    expect(handClassOf(hole('9s As'))).toBe('A9s');
    expect(handClassOf(hole('Td Tc'))).toBe('TT');
    expect(handClassOf(hole('2c 7d'))).toBe('72o');
    expect(() => handClassOf(hole('Kd Kd'))).toThrow(
      new RangeError('Hole cards must be two different cards'),
    );

    expect(handClassAt(0, 5)).toBe('A9s');
    expect(handClassAt(5, 0)).toBe('A9o');
    expect(handClassAt(4, 4)).toBe('TT');
    HAND_CLASSES.forEach((hc, i) => expect(handClassAt(Math.floor(i / 13), i % 13)).toBe(hc));
  });
});
