import type { Card } from '../engine/cards';
import type { ActionRecord, HandResult, SeatNumber } from '../engine/hand';

/** A completed hand, as much as the stats need. CompletedHand satisfies it. */
export interface StatHand {
  /** Seats dealt into the hand. */
  readonly seats: readonly { readonly seat: SeatNumber }[];
  /** Blinds first, then every action in order. */
  readonly actions: readonly ActionRecord[];
  /** Community cards dealt (0, 3, 4 or 5). */
  readonly board: readonly Card[];
  readonly result: HandResult;
}

export interface StyleCounts {
  /** VPIP and PFR denominator. */
  readonly handsDealt: number;
  /** VPIP numerator (hands with a preflop call or raise). */
  readonly voluntary: number;
  /** PFR numerator (hands with a preflop raise). */
  readonly preflopRaised: number;
  /** Postflop bet and raise actions. */
  readonly postflopAggressive: number;
  /** Postflop call actions. */
  readonly postflopCalls: number;
  /** WTSD denominator (hands). */
  readonly sawFlop: number;
  /** WTSD numerator and W$SD denominator (hands). */
  readonly showdowns: number;
  /** W$SD numerator (hands). */
  readonly showdownsWon: number;
}

export const EMPTY_STYLE_COUNTS: StyleCounts = Object.freeze({
  handsDealt: 0,
  voluntary: 0,
  preflopRaised: 0,
  postflopAggressive: 0,
  postflopCalls: 0,
  sawFlop: 0,
  showdowns: 0,
  showdownsWon: 0,
});

/** The REQ-045 counts for one seat in one hand; all zeros if the seat wasn't dealt in. */
export function handStyleCounts(hand: StatHand, seat: SeatNumber): StyleCounts {
  if (!hand.seats.some((s) => s.seat === seat)) return EMPTY_STYLE_COUNTS;
  const mine = hand.actions.filter((a) => a.seat === seat);
  const preflop = mine.filter((a) => a.street === 'preflop');
  let postflopAggressive = 0;
  let postflopCalls = 0;
  for (const a of mine) {
    if (a.street === 'preflop') continue;
    if (a.type === 'bet' || a.type === 'raise') postflopAggressive++;
    else if (a.type === 'call') postflopCalls++;
  }
  const folded = mine.some((a) => a.type === 'fold');
  const foldedPreflop = preflop.some((a) => a.type === 'fold');
  const showdown = hand.result.endedBy === 'showdown' && !folded;
  const won =
    showdown &&
    hand.result.awards.some((award) => award.winners.some((w) => w.seat === seat && w.amount > 0));
  return {
    handsDealt: 1,
    voluntary: preflop.some((a) => a.type === 'call' || a.type === 'raise') ? 1 : 0,
    preflopRaised: preflop.some((a) => a.type === 'raise') ? 1 : 0,
    postflopAggressive,
    postflopCalls,
    sawFlop: hand.board.length >= 3 && !foldedPreflop ? 1 : 0,
    showdowns: showdown ? 1 : 0,
    showdownsWon: won ? 1 : 0,
  };
}

export function addStyleCounts(a: StyleCounts, b: StyleCounts): StyleCounts {
  return {
    handsDealt: a.handsDealt + b.handsDealt,
    voluntary: a.voluntary + b.voluntary,
    preflopRaised: a.preflopRaised + b.preflopRaised,
    postflopAggressive: a.postflopAggressive + b.postflopAggressive,
    postflopCalls: a.postflopCalls + b.postflopCalls,
    sawFlop: a.sawFlop + b.sawFlop,
    showdowns: a.showdowns + b.showdowns,
    showdownsWon: a.showdownsWon + b.showdownsWon,
  };
}

/** Sum of handStyleCounts over hands (EMPTY_STYLE_COUNTS for none). */
export function styleCounts(hands: Iterable<StatHand>, seat: SeatNumber): StyleCounts {
  let total = EMPTY_STYLE_COUNTS;
  for (const hand of hands) total = addStyleCounts(total, handStyleCounts(hand, seat));
  return total;
}

/** Percentages 0..100, unrounded; null when the denominator is 0. */
export interface StyleStats {
  readonly vpip: number | null;
  readonly pfr: number | null;
  readonly aggression: number | null;
  readonly wtsd: number | null;
  /** W$SD. */
  readonly wsd: number | null;
}

const pct = (part: number, whole: number): number | null =>
  whole === 0 ? null : (part / whole) * 100;

export function styleStats(c: StyleCounts): StyleStats {
  return {
    vpip: pct(c.voluntary, c.handsDealt),
    pfr: pct(c.preflopRaised, c.handsDealt),
    aggression: pct(c.postflopAggressive, c.postflopAggressive + c.postflopCalls),
    wtsd: pct(c.showdowns, c.sawFlop),
    wsd: pct(c.showdownsWon, c.showdowns),
  };
}

/** Shown for a stat with a zero denominator (U+2014). */
export const NO_STAT = '—';

/** NO_STAT for null, else the whole-number percent, e.g. `33%`. */
export function formatStat(value: number | null): string {
  return value === null ? NO_STAT : `${Math.round(value)}%`;
}
