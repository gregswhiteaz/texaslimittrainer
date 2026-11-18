import { formatCard, type Card } from '../engine/cards';
import { evaluate } from '../engine/hand-evaluator';
import { fnv1a32, Xoshiro128 } from '../engine/seeded-random';

/** Two distinct cards. Order does not matter. */
export type HoleCards = readonly [Card, Card];
/** The hands an opponent might hold, all equally likely. A known hand is a one-combo range. */
export type Range = readonly HoleCards[];

export interface EquityInput {
  readonly hero: HoleCards;
  /** 0, 3, 4 or 5 cards. Order does not matter. */
  readonly board: readonly Card[];
  /** 1 to 9 opponents. */
  readonly opponents: readonly Range[];
}

export interface PlayerEquity {
  /** Fraction of trials this player wins alone. */
  readonly win: number;
  /** Fraction of trials this player ties for the best hand with one or more others. */
  readonly tie: number;
  /** Pot share: win + sum over ties of 1 / (number of tied players). 0..1. */
  readonly equity: number;
}

export interface EquityResult {
  readonly hero: PlayerEquity;
  /** Same order as input.opponents. */
  readonly opponents: readonly PlayerEquity[];
  readonly method: 'exact' | 'sampled';
  /** Exact: number of (opponent deal, runout) outcomes enumerated. Sampled: accepted trials (30,000). */
  readonly trials: number;
}

/** @internal */
export const SAMPLE_TRIALS = 30_000;
/** @internal */
export const EXACT_EVALUATION_LIMIT = 200_000;
/** @internal */
export const MAX_OPPONENTS = 9;
/** @internal Pot-share units per trial: LCM of 1..10, so every split is a whole number of units. */
export const SHARE_UNITS = 2520;

/** @internal Validated input with sorted cards, live sorted combos and opponents in canonical order. */
export interface CanonicalInput {
  hero: HoleCards;
  board: Card[];
  opponents: HoleCards[][];
  /** order[i] is the input index of canonical opponent i. */
  order: number[];
}

function isCard(value: unknown): value is Card {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 51;
}

function compareRanges(a: readonly HoleCards[], b: readonly HoleCards[]): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i] as HoleCards;
    const y = b[i] as HoleCards;
    if (x[0] !== y[0]) return x[0] - y[0];
    if (x[1] !== y[1]) return x[1] - y[1];
  }
  return a.length - b.length;
}

/** @internal Validates and canonicalises the input. Throws RangeError. */
export function canonicalise(input: EquityInput): CanonicalInput {
  const { hero, board, opponents } = input;
  if (hero.length !== 2) throw new RangeError(`Hero must have 2 cards, got ${hero.length}`);
  if (![0, 3, 4, 5].includes(board.length)) {
    throw new RangeError(`Board must have 0, 3, 4 or 5 cards, got ${board.length}`);
  }
  if (opponents.length < 1 || opponents.length > MAX_OPPONENTS) {
    throw new RangeError(`Expected 1 to ${MAX_OPPONENTS} opponents, got ${opponents.length}`);
  }
  const known = [...hero, ...board];
  for (const card of known) {
    if (!isCard(card)) throw new RangeError(`Invalid card: ${String(card)}`);
  }
  const dead = new Uint8Array(52);
  for (const card of known) {
    if (dead[card]) throw new RangeError(`Duplicate card: ${formatCard(card)}`);
    dead[card] = 1;
  }
  opponents.forEach((range, i) => {
    for (const combo of range) {
      const [a, b] = combo;
      if (combo.length !== 2 || !isCard(a) || !isCard(b) || a === b) {
        throw new RangeError(`Opponent ${i + 1} has an invalid combo: ${String(a)},${String(b)}`);
      }
    }
  });

  const ranges = opponents.map((range, i) => {
    const seen = new Set<number>();
    const live: HoleCards[] = [];
    for (const [a, b] of range) {
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      if (dead[lo] || dead[hi] || seen.has(lo * 52 + hi)) continue;
      seen.add(lo * 52 + hi);
      live.push([lo, hi]);
    }
    if (live.length === 0) throw new RangeError(`Opponent ${i + 1} has no possible hand`);
    live.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    return live;
  });
  const order = ranges.map((_, i) => i);
  order.sort((x, y) => compareRanges(ranges[x] ?? [], ranges[y] ?? []));

  const [h1, h2] = hero;
  return {
    hero: h1 < h2 ? [h1, h2] : [h2, h1],
    board: [...board].sort((x, y) => x - y),
    opponents: order.map((i) => ranges[i] ?? []),
    order,
  };
}

/** @internal */
export function canonicalKey(c: CanonicalInput): string {
  const opponents = c.opponents.map((range) => range.map((combo) => combo.join(',')).join(';'));
  return `equity-v1|h:${c.hero.join(',')}|b:${c.board.join(',')}|o:${opponents.join('/')}`;
}

/** @internal */
export function deriveSeed(c: CanonicalInput): number {
  return fnv1a32(canonicalKey(c));
}

function choose(n: number, k: number): number {
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return result;
}

/** @internal (n_1 × … × n_k) × C(unseen, need) × (k + 1). */
export function estimateEvaluations(c: CanonicalInput): number {
  const k = c.opponents.length;
  const unseen = 52 - 2 - c.board.length - 2 * k;
  const deals = c.opponents.reduce((product, range) => product * range.length, 1);
  return deals * choose(unseen, 5 - c.board.length) * (k + 1);
}

/** Per-call working state shared by the exact and sampled engines. */
class Table {
  readonly players: number;
  /** One 7-card scratch hand per player: hole cards at 0-1, board at 2-6. Player 0 is the hero. */
  readonly hands: Card[][];
  readonly dealt = new Uint8Array(52);
  readonly need: number;
  readonly win: number[];
  readonly tie: number[];
  readonly share: number[];
  trials = 0;
  private readonly ranks: number[];

  constructor(readonly c: CanonicalInput) {
    this.players = c.opponents.length + 1;
    this.need = 5 - c.board.length;
    this.hands = Array.from({ length: this.players }, () => {
      const hand = new Array<Card>(7).fill(0);
      c.board.forEach((card, i) => (hand[2 + i] = card));
      return hand;
    });
    this.setHole(0, c.hero);
    for (const card of [...c.hero, ...c.board]) this.dealt[card] = 1;
    this.win = new Array<number>(this.players).fill(0);
    this.tie = new Array<number>(this.players).fill(0);
    this.share = new Array<number>(this.players).fill(0);
    this.ranks = new Array<number>(this.players).fill(0);
  }

  setHole(player: number, combo: HoleCards): void {
    const hand = this.hands[player] as Card[];
    hand[0] = combo[0];
    hand[1] = combo[1];
  }

  setRunout(index: number, card: Card): void {
    for (const hand of this.hands) hand[7 - this.need + index] = card;
  }

  /** Backtracks over opponent deals. `visit` returns true to stop. Returns true if stopped. */
  forEachDeal(from: number, visit: () => boolean): boolean {
    if (from === this.c.opponents.length) return visit();
    for (const combo of this.c.opponents[from] ?? []) {
      const [a, b] = combo;
      if (this.dealt[a] || this.dealt[b]) continue;
      this.dealt[a] = 1;
      this.dealt[b] = 1;
      this.setHole(from + 1, combo);
      const stop = this.forEachDeal(from + 1, visit);
      this.dealt[a] = 0;
      this.dealt[b] = 0;
      if (stop) return true;
    }
    return false;
  }

  score(): void {
    let best = -1;
    let count = 0;
    for (let p = 0; p < this.players; p++) {
      const rank = evaluate(this.hands[p] as Card[]);
      this.ranks[p] = rank;
      if (rank > best) {
        best = rank;
        count = 1;
      } else if (rank === best) {
        count++;
      }
    }
    const units = SHARE_UNITS / count;
    for (let p = 0; p < this.players; p++) {
      if (this.ranks[p] !== best) continue;
      if (count === 1) this.win[p] = (this.win[p] ?? 0) + 1;
      else this.tie[p] = (this.tie[p] ?? 0) + 1;
      this.share[p] = (this.share[p] ?? 0) + units;
    }
    this.trials++;
  }

  result(method: EquityResult['method']): EquityResult {
    const player = (p: number): PlayerEquity => ({
      win: (this.win[p] ?? 0) / this.trials,
      tie: (this.tie[p] ?? 0) / this.trials,
      equity: (this.share[p] ?? 0) / (SHARE_UNITS * this.trials),
    });
    return {
      hero: player(0),
      opponents: this.c.opponents.map((_, i) => player(i + 1)),
      method,
      trials: this.trials,
    };
  }
}

function cannotDeal(): RangeError {
  return new RangeError("Opponents' hands cannot all be dealt together");
}

/** @internal Enumerates every opponent deal and runout. Results are in canonical opponent order. */
export function exactEquity(c: CanonicalInput): EquityResult {
  const table = new Table(c);
  const { need } = table;
  const remaining: Card[] = [];
  // Visits every `need`-card subset of `remaining` in nested index order.
  const runouts = (depth: number, start: number): void => {
    if (depth === need) {
      table.score();
      return;
    }
    for (let i = start; i <= remaining.length - (need - depth); i++) {
      table.setRunout(depth, remaining[i] as Card);
      runouts(depth + 1, i + 1);
    }
  };
  table.forEachDeal(0, () => {
    remaining.length = 0;
    for (let card = 0; card < 52; card++) if (!table.dealt[card]) remaining.push(card);
    runouts(0, 0);
    return false;
  });
  if (table.trials === 0) throw cannotDeal();
  return table.result('exact');
}

/** @internal Samples whole deals, seeded from the input. Results are in canonical opponent order. */
export function sampledEquity(
  c: CanonicalInput,
  trials: number,
  maxRejections = 100 * trials,
): EquityResult {
  const table = new Table(c);
  if (!table.forEachDeal(0, () => true)) throw cannotDeal();
  const rng = new Xoshiro128(deriveSeed(c));
  const { dealt, need } = table;
  const opponents = c.opponents.length;
  // Each range as flat (low, high) card pairs, for a fast inner loop.
  const flat = c.opponents.map((range) => Uint8Array.from(range.flat()));
  // Cards dealt in the current trial, so they can be returned to the deck before the next one.
  // Opponent i's cards are at 2i and 2i + 1.
  const marked = new Uint8Array(52);
  let markedCount = 0;
  let rejections = 0;
  while (table.trials < trials) {
    for (let m = 0; m < markedCount; m++) dealt[marked[m] ?? 0] = 0;
    markedCount = 0;
    let i = 0;
    for (; i < opponents; i++) {
      const range = flat[i] as Uint8Array;
      const pick = 2 * rng.nextInt(range.length / 2);
      const a = range[pick] ?? 0;
      const b = range[pick + 1] ?? 0;
      if (dealt[a] || dealt[b]) break;
      dealt[a] = 1;
      dealt[b] = 1;
      marked[markedCount++] = a;
      marked[markedCount++] = b;
    }
    if (i < opponents) {
      if (++rejections > maxRejections) throw new RangeError('Sampling rejected too many deals');
      continue;
    }
    for (let p = 0; p < opponents; p++) {
      table.setHole(p + 1, [marked[2 * p] ?? 0, marked[2 * p + 1] ?? 0]);
    }
    for (let j = 0; j < need; j++) {
      let card = rng.nextInt(52);
      while (dealt[card]) card = rng.nextInt(52);
      dealt[card] = 1;
      marked[markedCount++] = card;
      table.setRunout(j, card);
    }
    table.score();
  }
  return table.result('sampled');
}

/**
 * Each player's chance of winning, tying and pot share. Exact when the estimated work is small,
 * otherwise sampled with a seed that depends only on the canonical input. Throws RangeError.
 */
export function computeEquity(input: EquityInput): EquityResult {
  const c = canonicalise(input);
  const result =
    estimateEvaluations(c) <= EXACT_EVALUATION_LIMIT
      ? exactEquity(c)
      : sampledEquity(c, SAMPLE_TRIALS);
  const opponents = new Array<PlayerEquity>(c.order.length);
  c.order.forEach((inputIndex, i) => {
    opponents[inputIndex] = result.opponents[i] as PlayerEquity;
  });
  return { ...result, opponents };
}
