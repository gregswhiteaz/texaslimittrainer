import { cardRank, cardSuit, formatCard, type Card } from '../../engine/cards';

export type DeckColours = 'two-colour' | 'four-colour';

/** CSS px = SVG user units (viewBox 0 0 60 84). */
export const CARD_WIDTH = 60;
export const CARD_HEIGHT = 84;
export const CARD_RADIUS = 5;
export const FACE_FILL = '#FAFAF7';
export const FACE_BORDER = '#A7AEB8';
export const BACK_FILL = '#000000';
export const BACK_FRAME = '#D7262E';

/** Rank glyphs are drawn in a 28-unit-tall box whose top-left corner sits here. */
export const RANK_ORIGIN = { x: 6, y: 6 } as const;
export const RANK_STROKE_WIDTH = 4.5;
/** Suit symbols are 30 units tall; their box ends at this bottom-right corner. */
export const SUIT_END = { x: 54, y: 78 } as const;
export const SUIT_HEIGHT = 30;

export const SUIT_NAMES = ['clubs', 'diamonds', 'hearts', 'spades'] as const;
export const RANK_NAMES = [
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Jack',
  'Queen',
  'King',
  'Ace',
] as const;
export const RANK_LABELS = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const;

export type SuitName = (typeof SUIT_NAMES)[number];
export type RankLabel = (typeof RANK_LABELS)[number];

const RED = '#B42318';
const BLACK = '#111111';

/** Index = Suit (clubs, diamonds, hearts, spades). */
export const SUIT_COLOURS: Record<DeckColours, readonly [string, string, string, string]> = {
  'two-colour': [BLACK, RED, RED, BLACK],
  'four-colour': ['#1D6B35', '#1D4ED8', RED, BLACK],
};

export function cardLabel(card: Card): string {
  formatCard(card);
  return `${RANK_NAMES[cardRank(card)]} of ${SUIT_NAMES[cardSuit(card)]}`;
}

interface Glyph {
  width: number;
  d: string;
}

/** Monoline centreline paths, 28 units tall, drawn with a round-capped stroke and no fill. */
export const RANK_GLYPHS: Readonly<Record<RankLabel, Glyph>> = {
  '2': { width: 17, d: 'M1.5 7A6.5 7 0 0 1 14.5 7C14.5 11.5 11 14 8 17L1.5 28H15.5' },
  '3': {
    width: 17,
    d: 'M2 0H14L7.5 11C12 11 15.5 14 15.5 19C15.5 24.5 12 28 7.5 28C4.5 28 2 26.5 1 24',
  },
  '4': { width: 17, d: 'M11 28V0L1 19H16' },
  '5': {
    width: 17,
    d: 'M14.5 0H3L2 12C3.5 10.5 5.5 10 8 10C12.5 10 15.5 13.5 15.5 19C15.5 24.5 12 28 8 28C5 28 2.5 26.5 1.5 24',
  },
  '6': {
    width: 17,
    d: 'M13.5 2.5C12 0.8 10.5 0 8.5 0C4 0 1.5 5 1.5 13V19.5M1.5 19.5A7 8.5 0 0 0 15.5 19.5A7 8.5 0 0 0 1.5 19.5',
  },
  '7': { width: 17, d: 'M1.5 0H15.5L6 28' },
  '8': {
    width: 17,
    d: 'M2.5 6.25A6 6.25 0 0 0 14.5 6.25A6 6.25 0 0 0 2.5 6.25M1.5 20.25A7 7.75 0 0 0 15.5 20.25A7 7.75 0 0 0 1.5 20.25',
  },
  '9': {
    width: 17,
    d: 'M15.5 8.5A7 8.5 0 0 0 1.5 8.5A7 8.5 0 0 0 15.5 8.5V15C15.5 23 13 28 8.5 28C6.5 28 5 27.2 3.5 25.5',
  },
  '10': { width: 27, d: 'M1 5L6 0V28M12.5 14A6.5 14 0 0 0 25.5 14A6.5 14 0 0 0 12.5 14' },
  J: { width: 16, d: 'M14 0V19.5C14 24.5 11.5 28 7.75 28C4 28 1.5 25.5 1.5 21.5' },
  Q: { width: 18, d: 'M1.5 14A7.5 14 0 0 0 16.5 14A7.5 14 0 0 0 1.5 14M11 20L17.5 28' },
  K: { width: 17, d: 'M2 0V28M15 0L2 17M7 10.5L15.5 28' },
  A: { width: 17, d: 'M1 28L8.5 0L16 28M3.7 18H13.3' },
};

/** Filled paths, 30 units tall, all subpaths wound clockwise so overlaps stay filled. */
export const SUIT_SYMBOLS: Readonly<Record<SuitName, Glyph>> = {
  clubs: {
    width: 30,
    d:
      'M15 0A7.5 7.5 0 1 1 15 15A7.5 7.5 0 1 1 15 0Z' +
      'M7.5 9.5A7.5 7.5 0 1 1 7.5 24.5A7.5 7.5 0 1 1 7.5 9.5Z' +
      'M22.5 9.5A7.5 7.5 0 1 1 22.5 24.5A7.5 7.5 0 1 1 22.5 9.5Z' +
      'M16.5 16C16.5 23 18.5 27.5 22 30H8C11.5 27.5 13.5 23 13.5 16Z',
  },
  diamonds: { width: 24, d: 'M12 0Q17 8 24 15Q17 22 12 30Q7 22 0 15Q7 8 12 0Z' },
  hearts: {
    width: 30,
    d: 'M15 30C10 25 0 18 0 9C0 3.5 3.8 0 8 0C11 0 13.6 1.8 15 4.5C16.4 1.8 19 0 22 0C26.2 0 30 3.5 30 9C30 18 20 25 15 30Z',
  },
  spades: {
    width: 28,
    d:
      'M14 0C19 5 28 11 28 17.5C28 21.5 25 24 21.5 24C19 24 17 23 15.5 21' +
      'C16 25 17.5 28 20 30H8C10.5 28 12 25 12.5 21C11 23 9 24 6.5 24' +
      'C3 24 0 21.5 0 17.5C0 11 9 5 14 0Z',
  },
};
