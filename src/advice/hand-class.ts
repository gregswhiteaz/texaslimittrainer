import { cardRank, cardSuit, RANK_CHARS, type Card } from '../engine/cards';

/** One of the 169 starting-hand classes: a pair, or two ranks (higher first) plus s or o. */
export type HandClass = string;

/** Grid index 0 = A ... 12 = 2. */
function gridChar(index: number): string {
  return RANK_CHARS.charAt(12 - index);
}

/** r === c pair; r < c suited (rank r high); r > c offsuit (rank c high). */
export function handClassAt(row: number, col: number): HandClass {
  if (row === col) return gridChar(row) + gridChar(row);
  if (row < col) return gridChar(row) + gridChar(col) + 's';
  return gridChar(col) + gridChar(row) + 'o';
}

/** Grid order: row r, column c (0 = A ... 12 = 2), row-major. 169 entries. */
export const HAND_CLASSES: readonly HandClass[] = Array.from({ length: 169 }, (_, i) =>
  handClassAt(Math.floor(i / 13), i % 13),
);

/** Throws RangeError('Hole cards must be two different cards') when equal. */
export function handClassOf(cards: readonly [Card, Card]): HandClass {
  const [a, b] = cards;
  if (a === b) throw new RangeError('Hole cards must be two different cards');
  const high = Math.max(cardRank(a), cardRank(b));
  const low = Math.min(cardRank(a), cardRank(b));
  if (high === low) return RANK_CHARS.charAt(high).repeat(2);
  return (
    RANK_CHARS.charAt(high) + RANK_CHARS.charAt(low) + (cardSuit(a) === cardSuit(b) ? 's' : 'o')
  );
}

/** Combos of the class: pairs 6, suited 4, offsuit 12. */
export function comboCount(hc: HandClass): number {
  if (hc.length === 2) return 6;
  return hc.endsWith('s') ? 4 : 12;
}
