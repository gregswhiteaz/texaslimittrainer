import { describe, expect, it } from 'vitest';
import {
  RANK_CHARS,
  SUIT_CHARS,
  cardRank,
  cardSuit,
  formatCard,
  makeCard,
  parseCard,
  parseCards,
} from '../../src/engine/cards';

describe('cards', () => {
  it('card encoding and text helpers', () => {
    expect(parseCard('2c')).toBe(0);
    expect(parseCard('2d')).toBe(1);
    expect(parseCard('As')).toBe(51);
    expect(parseCard('Td')).toBe(33);
    for (let card = 0; card < 52; card++) {
      const text = formatCard(card);
      expect(parseCard(text)).toBe(card);
      expect(text).toBe(RANK_CHARS.charAt(cardRank(card)) + SUIT_CHARS.charAt(cardSuit(card)));
      expect(makeCard(cardRank(card), cardSuit(card))).toBe(card);
    }
    expect(cardRank(51)).toBe(12);
    expect(cardSuit(51)).toBe(3);
    expect(makeCard(12, 3)).toBe(51);
    expect(parseCards('  As Kd\t7h ')).toEqual([51, 45, 22]);
    expect(parseCards('')).toEqual([]);
    for (const text of ['as', '10s', 'Ax', '', 'A', 'Ass', ' As']) {
      expect(() => parseCard(text)).toThrow(new RangeError(`Invalid card: "${text}"`));
    }
    expect(() => parseCards('As Kx')).toThrow(new RangeError('Invalid card: "Kx"'));
    expect(() => parseCard(undefined as unknown as string)).toThrow(
      new RangeError('Invalid card: expected a string, got undefined'),
    );
    expect(() => parseCards('As KdQhJcTs9x')).toThrow(new RangeError('Invalid card: "KdQhJcTs9x"'));
    for (const value of [52, -1, 1.5, NaN]) {
      expect(() => formatCard(value)).toThrow(new RangeError(`Invalid card: ${value}`));
    }
    expect(() => makeCard(13, 0)).toThrow(new RangeError('Invalid rank or suit: 13, 0'));
    expect(() => makeCard(0, 4)).toThrow(new RangeError('Invalid rank or suit: 0, 4'));
    expect(() => makeCard(-1, 0)).toThrow(new RangeError('Invalid rank or suit: -1, 0'));
    expect(() => makeCard(0.5, 1)).toThrow(new RangeError('Invalid rank or suit: 0.5, 1'));
  });
});
