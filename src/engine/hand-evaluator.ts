import { formatCard, type Card } from './cards';

/** 1..7462. Higher is stronger. Equal values tie. */
export type HandRank = number;
export type HandCategory =
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'one-pair'
  | 'high-card';

/** Ordered strongest first. */
export const HAND_CATEGORIES: readonly HandCategory[] = [
  'straight-flush',
  'four-of-a-kind',
  'full-house',
  'flush',
  'straight',
  'three-of-a-kind',
  'two-pair',
  'one-pair',
  'high-card',
];
/** Lowest dense rank of each entry in HAND_CATEGORIES. */
const CATEGORY_STARTS = [7453, 7297, 7141, 5864, 5854, 4996, 4138, 1278, 1];
export const HAND_RANK_COUNT = 7462;

export interface EvaluatorTables {
  /** Dense rank of the best flush for each 13-bit suit mask with 5-7 bits set; 0 otherwise. */
  flush: Uint16Array;
  /** Dense rank of the best non-flush hand, indexed by sumOffsets[n] + quinary index of the rank counts. */
  noFlush: Uint16Array;
  /** quinary[(rank * 8 + remaining) * 5 + count]: index contribution of one rank count. */
  quinary: Uint32Array;
  /** Start of each card count's block in noFlush. */
  sumOffsets: Uint32Array;
}

// Category strengths used for raw build-time scores (0 = high card ... 8 = straight flush).
const HIGH_CARD = 0;
const ONE_PAIR = 1;
const TWO_PAIR = 2;
const TRIPS = 3;
const STRAIGHT = 4;
const FLUSH = 5;
const FULL_HOUSE = 6;
const QUADS = 7;
const STRAIGHT_FLUSH = 8;

/** Top rank of the highest straight in a 13-bit rank mask, or -1. The wheel's top is 3 (the five). */
function straightTop(mask: number): number {
  for (let top = 12; top >= 4; top--) {
    if (((mask >> (top - 4)) & 31) === 31) return top;
  }
  return (mask & 0x100f) === 0x100f ? 3 : -1;
}

/** Up to `take` ranks, highest first, with at least `min` copies and not in `skip`. */
function pick(counts: ArrayLike<number>, min: number, take: number, skip: number[]): number[] {
  const out: number[] = [];
  for (let r = 12; r >= 0 && out.length < take; r--) {
    if ((counts[r] ?? 0) >= min && !skip.includes(r)) out.push(r);
  }
  return out;
}

/** Category followed by up to five base-13 tie-break digits, so larger means stronger. */
function packScore(category: number, ranks: number[]): number {
  return ranks.reduce((acc, r) => acc * 13 + r, category) * 13 ** (5 - ranks.length);
}

function flushScore(mask: number): number {
  const top = straightTop(mask);
  if (top >= 0) return packScore(STRAIGHT_FLUSH, [top]);
  const counts = Array.from({ length: 13 }, (_, r) => (mask >> r) & 1);
  return packScore(FLUSH, pick(counts, 1, 5, []));
}

function nonFlushScore(counts: Uint8Array): number {
  const quads = pick(counts, 4, 1, []);
  if (quads.length > 0) return packScore(QUADS, [...quads, ...pick(counts, 1, 1, quads)]);
  const trips = pick(counts, 3, 1, []);
  const tripsPair = pick(counts, 2, 1, trips);
  if (trips.length > 0 && tripsPair.length > 0) {
    return packScore(FULL_HOUSE, [...trips, ...tripsPair]);
  }
  const mask = counts.reduce((m, c, r) => (c > 0 ? m | (1 << r) : m), 0);
  const top = straightTop(mask);
  if (top >= 0) return packScore(STRAIGHT, [top]);
  if (trips.length > 0) return packScore(TRIPS, [...trips, ...pick(counts, 1, 2, trips)]);
  const pairs = pick(counts, 2, 2, []);
  if (pairs.length === 2) return packScore(TWO_PAIR, [...pairs, ...pick(counts, 1, 1, pairs)]);
  if (pairs.length === 1) return packScore(ONE_PAIR, [...pairs, ...pick(counts, 1, 3, pairs)]);
  return packScore(HIGH_CARD, pick(counts, 1, 5, []));
}

/** @internal Builds the lookup tables. Called once at module load; exported for the perf test only. */
export function buildEvaluatorTables(): EvaluatorTables {
  // ways[m][r]: number of count vectors over m ranks (each 0..4) summing to r.
  const ways = [[1, 0, 0, 0, 0, 0, 0, 0]];
  for (let m = 1; m <= 13; m++) {
    const prev = ways[m - 1] ?? [];
    ways.push(prev.map((_, r) => prev.slice(Math.max(0, r - 4), r + 1).reduce((a, b) => a + b)));
  }
  const quinary = new Uint32Array(13 * 8 * 5);
  for (let rank = 0; rank < 13; rank++) {
    const rest = ways[12 - rank] ?? [];
    for (let rem = 0; rem < 8; rem++) {
      let below = 0;
      for (let c = 0; c <= 4; c++) {
        quinary[(rank * 8 + rem) * 5 + c] = below;
        below += rest[rem - c] ?? 0;
      }
    }
  }
  const all = ways[13] ?? [];
  const sumOffsets = new Uint32Array(8);
  sumOffsets[6] = all[5] ?? 0;
  sumOffsets[7] = sumOffsets[6] + (all[6] ?? 0);
  const rawNoFlush = new Uint32Array(sumOffsets[7] + (all[7] ?? 0));
  const counts = new Uint8Array(13);
  const visit = (rank: number, sum: number): void => {
    if (rank === 13) {
      if (sum < 5) return;
      let idx = sumOffsets[sum] ?? 0;
      let rem = sum;
      for (let r = 0; r < 13; r++) {
        const c = counts[r] ?? 0;
        idx += quinary[(r * 8 + rem) * 5 + c] ?? 0;
        rem -= c;
      }
      rawNoFlush[idx] = nonFlushScore(counts);
      return;
    }
    for (let c = 0; c <= 4 && sum + c <= 7; c++) {
      counts[rank] = c;
      visit(rank + 1, sum + c);
    }
    counts[rank] = 0;
  };
  visit(0, 0);

  const rawFlush = new Uint32Array(8192);
  for (let mask = 0; mask < 8192; mask++) {
    let bits = 0;
    for (let m = mask; m > 0; m &= m - 1) bits++;
    if (bits >= 5 && bits <= 7) rawFlush[mask] = flushScore(mask);
  }

  const scores = [...new Set([...rawFlush, ...rawNoFlush])].filter((s) => s > 0);
  scores.sort((a, b) => a - b);
  const dense = new Map(scores.map((s, i) => [s, i + 1]));
  const toDense = (raw: Uint32Array) => Uint16Array.from(raw, (s) => dense.get(s) ?? 0);
  return { flush: toDense(rawFlush), noFlush: toDense(rawNoFlush), quinary, sumOffsets };
}

const { flush, noFlush, quinary, sumOffsets } = buildEvaluatorTables();
// Per-call scratch, reset at the start of every evaluate call.
const rankCounts = new Uint8Array(13);
const suitMasks = new Uint16Array(4);
const suitCounts = new Uint8Array(4);

/** Best five-card rank among 5, 6 or 7 distinct cards. Throws RangeError on invalid input. */
export function evaluate(cards: readonly Card[]): HandRank {
  const n = cards.length;
  if (n < 5 || n > 7) throw new RangeError(`Hand must have 5 to 7 cards, got ${n}`);
  rankCounts.fill(0);
  suitMasks.fill(0);
  suitCounts.fill(0);
  for (let i = 0; i < n; i++) {
    const card = cards[i];
    if (card === undefined || !Number.isInteger(card) || card < 0 || card > 51) {
      throw new RangeError(`Invalid card: ${String(card)}`);
    }
    const rank = card >> 2;
    const suit = card & 3;
    const mask = suitMasks[suit] ?? 0;
    if ((mask >> rank) & 1) throw new RangeError(`Duplicate card: ${formatCard(card)}`);
    suitMasks[suit] = mask | (1 << rank);
    suitCounts[suit] = (suitCounts[suit] ?? 0) + 1;
    rankCounts[rank] = (rankCounts[rank] ?? 0) + 1;
  }
  for (let suit = 0; suit < 4; suit++) {
    if ((suitCounts[suit] ?? 0) >= 5) return flush[suitMasks[suit] ?? 0] ?? 0;
  }
  let idx = sumOffsets[n] ?? 0;
  let rem = n;
  for (let rank = 0; rank < 13; rank++) {
    const c = rankCounts[rank] ?? 0;
    idx += quinary[(rank * 8 + rem) * 5 + c] ?? 0;
    rem -= c;
  }
  return noFlush[idx] ?? 0;
}

/** -1 if a < b, 0 if equal, 1 if a > b. No validation. */
export function compareHands(a: HandRank, b: HandRank): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Category of a rank. RangeError if rank is not an integer in 1..7462. */
export function handCategory(rank: HandRank): HandCategory {
  if (!Number.isInteger(rank) || rank < 1 || rank > HAND_RANK_COUNT) {
    throw new RangeError(`Invalid hand rank: ${String(rank)}`);
  }
  let i = 0;
  while (rank < (CATEGORY_STARTS[i] ?? 0)) i++;
  return HAND_CATEGORIES[i] ?? 'high-card';
}
