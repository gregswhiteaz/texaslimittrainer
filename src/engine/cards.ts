/** 0..51. card = rank * 4 + suit. 0 = 2c, 1 = 2d, 2 = 2h, 3 = 2s, ..., 48 = Ac, 51 = As. */
export type Card = number;
/** 0..12 for 2,3,...,9,T,J,Q,K,A. */
export type Rank = number;
/** 0..3 for clubs, diamonds, hearts, spades. */
export type Suit = number;

export const RANK_CHARS = '23456789TJQKA';
export const SUIT_CHARS = 'cdhs';

function isIntInRange(value: number, max: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= max;
}

export function makeCard(rank: Rank, suit: Suit): Card {
  if (!isIntInRange(rank, 12) || !isIntInRange(suit, 3)) {
    throw new RangeError(`Invalid rank or suit: ${String(rank)}, ${String(suit)}`);
  }
  return rank * 4 + suit;
}

export function cardRank(card: Card): Rank {
  return card >> 2;
}

export function cardSuit(card: Card): Suit {
  return card & 3;
}

export function parseCard(text: string): Card {
  if (typeof text !== 'string') {
    throw new RangeError(`Invalid card: expected a string, got ${typeof text}`);
  }
  const rank = RANK_CHARS.indexOf(text.charAt(0));
  const suit = SUIT_CHARS.indexOf(text.charAt(1));
  if (text.length !== 2 || rank < 0 || suit < 0) {
    const echo = text.length <= 10 ? text : `${text.slice(0, 10)}...`;
    throw new RangeError(`Invalid card: "${echo}"`);
  }
  return rank * 4 + suit;
}

export function parseCards(text: string): Card[] {
  const trimmed = text.trim();
  return trimmed === '' ? [] : trimmed.split(/\s+/).map(parseCard);
}

export function formatCard(card: Card): string {
  if (!isIntInRange(card, 51)) {
    throw new RangeError(`Invalid card: ${String(card)}`);
  }
  return RANK_CHARS.charAt(card >> 2) + SUIT_CHARS.charAt(card & 3);
}
