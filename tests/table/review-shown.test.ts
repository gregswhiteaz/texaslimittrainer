import { describe, expect, it } from 'vitest';
import { formatCard, parseCard } from '../../src/engine/cards';
import { shownOpponents, type ShownOpponent } from '../../src/table/review';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import {
  RAISE_TAKES_BLINDS,
  REVIEW_DEE_MUCKS,
  REVIEW_LOST_48,
  SHOWN_HANDS,
  TEN_SEAT_SHOWDOWN,
} from '../support/table-scenarios';

function done(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

/** Each opponent as [seat, name, 'Xx Yy', hand name]. */
const plain = (shown: readonly ShownOpponent[]): [number, string, string, string][] =>
  shown.map((o) => [o.seat, o.name, o.holeCards.map(formatCard).join(' '), o.handName]);

describe('TASK-9.5 shownOpponents', () => {
  it('shownOpponents lists opponents who showed, in showdown order', () => {
    const ben: [number, string, string, string] = [2, 'Ben', 'Kd 7c', 'Pair of kings'];
    expect(plain(shownOpponents(done(REVIEW_DEE_MUCKS)))).toEqual([ben]);
    expect(plain(shownOpponents(done(REVIEW_LOST_48)))).toEqual([ben]);

    const shownHands = done(SHOWN_HANDS);
    expect(shownHands.shown?.shown.map((s) => s.seat)).toEqual([4, 5, 2]);
    expect(plain(shownOpponents(shownHands))).toEqual([
      [4, 'Dee', '4h 4s', 'Pair of fours'],
      [2, 'Ben', 'Kh Ks', 'Pair of kings'],
    ]);

    const fullHouse = 'Full house, kings over jacks';
    expect(plain(shownOpponents(done(TEN_SEAT_SHOWDOWN)))).toEqual([
      [7, 'Fay', 'Js Qd', fullHouse],
      [10, 'Ivy', 'Qh Jd', fullHouse],
    ]);

    const hand = done(REVIEW_DEE_MUCKS);
    const [first] = shownOpponents(hand);
    (first?.holeCards as unknown as number[])[0] = parseCard('2c');
    expect(hand.shown?.shown[0]?.holeCards.map(formatCard)).toEqual(['Kd', '7c']);
  });

  it('shownOpponents is empty for a fold-out and rejects an unknown seat', () => {
    const foldOut = done(RAISE_TAKES_BLINDS);
    expect(foldOut.shown).toBeNull();
    expect(shownOpponents(foldOut)).toEqual([]);

    const hand = done(REVIEW_DEE_MUCKS);
    const unknown: CompletedHand = {
      ...hand,
      shown: { shown: [{ seat: 9, holeCards: [parseCard('Qh'), parseCard('Qs')] }] },
    };
    expect(() => shownOpponents(unknown)).toThrow(new RangeError('Seat 9 is not at the table'));
  });
});
