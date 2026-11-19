import { cardRank, type Card, type Rank } from '../engine/cards';
import { evaluate, handCategory } from '../engine/hand-evaluator';
import type { SeatNumber } from '../engine/hand';
import type { TableState } from './session';

export interface WinnerView {
  readonly seat: SeatNumber;
  readonly name: string;
  readonly isUser: boolean;
  /** Sum of this seat's shares over every award (A-6, A-7). */
  readonly amount: number;
  /** "Ben wins $122" | "You win $54" (Q-2). */
  readonly text: string;
  /** Showdown only (Q-1). */
  readonly handName: string | null;
  /** Showdown winners only (Q-3). */
  readonly holeCards: readonly [Card, Card] | null;
}
export interface HandResultView {
  readonly endedBy: 'fold' | 'showdown';
  /** Award order (A-7), at least one. */
  readonly winners: readonly WinnerView[];
}

/** Rank words by Rank (0 = two … 12 = ace). */
const SINGULAR = 'Two Three Four Five Six Seven Eight Nine Ten Jack Queen King Ace'.split(' ');
const PLURAL =
  'twos threes fours fives sixes sevens eights nines tens jacks queens kings aces'.split(' ');

/** Name of the best five-card hand among 5–7 cards (Q-1). RangeError as evaluate() on bad input. */
export function handName(cards: readonly Card[]): string {
  const category = handCategory(evaluate(cards));
  const counts = new Map<Rank, number>();
  for (const card of cards) counts.set(cardRank(card), (counts.get(cardRank(card)) ?? 0) + 1);
  // Ranks holding at least `n` cards, highest first.
  const withAtLeast = (n: number): Rank[] =>
    [...counts]
      .filter(([, count]) => count >= n)
      .map(([rank]) => rank)
      .sort((a, b) => b - a);
  // The category guarantees each rank looked up below exists.
  const plural = (rank: Rank | undefined): string => PLURAL[rank as Rank] as string;
  switch (category) {
    case 'high-card':
      return `${SINGULAR[withAtLeast(1)[0] as Rank] as string} high`;
    case 'one-pair':
      return `Pair of ${plural(withAtLeast(2)[0])}`;
    case 'two-pair': {
      const [high, low] = withAtLeast(2);
      return `Two pair, ${plural(high)} and ${plural(low)}`;
    }
    case 'three-of-a-kind':
      return `Three of a kind, ${plural(withAtLeast(3)[0])}`;
    case 'straight':
      return 'Straight';
    case 'flush':
      return 'Flush';
    case 'full-house': {
      const trips = withAtLeast(3)[0];
      const pair = withAtLeast(2).find((rank) => rank !== trips);
      return `Full house, ${plural(trips)} over ${plural(pair)}`;
    }
    case 'four-of-a-kind':
      return `Four of a kind, ${plural(withAtLeast(4)[0])}`;
    case 'straight-flush':
      return 'Straight flush';
  }
}

/** Winners, amounts and (at showdown) their hand names and cards; null unless table.hand has a result. */
export function handResultView(table: TableState): HandResultView | null {
  const { hand } = table;
  if (hand === null || hand.result === null) return null;
  const { result } = hand;
  const amounts = new Map<SeatNumber, number>();
  for (const award of result.awards) {
    for (const { seat, amount } of award.winners) {
      amounts.set(seat, (amounts.get(seat) ?? 0) + amount);
    }
  }
  const winners = [...amounts].map(([seat, amount]): WinnerView => {
    const sessionSeat = table.seats.find((s) => s.seat === seat);
    if (sessionSeat === undefined) throw new RangeError(`Seat ${seat} is not at the table`);
    const isUser = seat === table.config.userSeat;
    const shown =
      result.endedBy === 'showdown' ? result.showdown.find((s) => s.seat === seat) : undefined;
    return {
      seat,
      name: sessionSeat.name,
      isUser,
      amount,
      text: isUser ? `You win $${amount}` : `${sessionSeat.name} wins $${amount}`,
      handName: shown === undefined ? null : handName([...shown.holeCards, ...hand.board]),
      holeCards: shown === undefined ? null : [shown.holeCards[0], shown.holeCards[1]],
    };
  });
  return { endedBy: result.endedBy, winners };
}
