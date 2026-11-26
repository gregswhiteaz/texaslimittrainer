import { cardRank, type Card, type Rank } from '../engine/cards';
import { evaluate, handCategory } from '../engine/hand-evaluator';
import type { SeatNumber } from '../engine/hand';
import type { TableState } from './session';
import { potLabel } from './table-view';

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
export interface ShownHandView {
  readonly seat: SeatNumber;
  readonly name: string;
  readonly isUser: boolean;
  /** "Dee shows" | "You show" (Q-3). */
  readonly text: string;
  readonly handName: string;
  readonly holeCards: readonly [Card, Card];
}
export interface PotResultView {
  readonly pot: number;
  readonly label: string;
  readonly amount: number;
  /** award.winners in order. */
  readonly winners: readonly {
    readonly seat: SeatNumber;
    readonly isUser: boolean;
    /** "You win $60" | "Ben wins $80" */
    readonly text: string;
  }[];
  /** "Side pot $81" = `${label} $${amount}`. */
  readonly potText: string;
  /** "Ben wins $41, Ava wins $40" = the winners' text joined with ", ". */
  readonly winnersText: string;
  /** "Main pot $60 · You win $60"; split: "Side pot $81 · Ben wins $41, Ava wins $40" (Q-2). */
  readonly text: string;
}
export interface HandResultView {
  readonly endedBy: 'fold' | 'showdown';
  /** Award order (A-7), at least one. */
  readonly winners: readonly WinnerView[];
  /** Shown hands of seats that won nothing, in showdown order; [] after a fold-out. Never a mucked hand. */
  readonly shown: readonly ShownHandView[];
  /**
   * One per result.awards entry when there are ≥ 2 (AC#4). Absent for a single pot (A-3), so single-pot results
   * keep their exact shape.
   */
  readonly pots?: readonly PotResultView[];
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

/**
 * Winners, amounts and (at showdown) their hand names and cards, then the shown hands that won nothing;
 * null unless table.hand has a result.
 */
export function handResultView(table: TableState): HandResultView | null {
  const { hand } = table;
  if (hand === null || hand.result === null) return null;
  const { result } = hand;
  const nameOf = (seat: SeatNumber): string => {
    const sessionSeat = table.seats.find((s) => s.seat === seat);
    if (sessionSeat === undefined) throw new RangeError(`Seat ${seat} is not at the table`);
    return sessionSeat.name;
  };
  const winText = (seat: SeatNumber, amount: number): string =>
    seat === table.config.userSeat ? `You win $${amount}` : `${nameOf(seat)} wins $${amount}`;
  const amounts = new Map<SeatNumber, number>();
  for (const award of result.awards) {
    for (const { seat, amount } of award.winners) {
      amounts.set(seat, (amounts.get(seat) ?? 0) + amount);
    }
  }
  const winners = [...amounts].map(([seat, amount]): WinnerView => {
    const name = nameOf(seat);
    const isUser = seat === table.config.userSeat;
    const shown =
      result.endedBy === 'showdown' ? result.showdown.find((s) => s.seat === seat) : undefined;
    return {
      seat,
      name,
      isUser,
      amount,
      text: winText(seat, amount),
      handName: shown === undefined ? null : handName([...shown.holeCards, ...hand.board]),
      holeCards: shown === undefined ? null : [shown.holeCards[0], shown.holeCards[1]],
    };
  });
  const shown = result.showdown
    .filter((s) => !amounts.has(s.seat))
    .map((s): ShownHandView => {
      const name = nameOf(s.seat);
      const isUser = s.seat === table.config.userSeat;
      return {
        seat: s.seat,
        name,
        isUser,
        text: isUser ? 'You show' : `${name} shows`,
        handName: handName([...s.holeCards, ...hand.board]),
        holeCards: [s.holeCards[0], s.holeCards[1]],
      };
    });
  if (result.awards.length < 2) return { endedBy: result.endedBy, winners, shown };
  const pots = result.awards.map((award): PotResultView => {
    const label = potLabel(award.pot, result.awards.length);
    const potWinners = award.winners.map(({ seat, amount }) => ({
      seat,
      isUser: seat === table.config.userSeat,
      text: winText(seat, amount),
    }));
    const potText = `${label} $${award.amount}`;
    const winnersText = potWinners.map((w) => w.text).join(', ');
    return {
      pot: award.pot,
      label,
      amount: award.amount,
      winners: potWinners,
      potText,
      winnersText,
      text: `${potText} · ${winnersText}`,
    };
  });
  return { endedBy: result.endedBy, winners, shown, pots };
}
