import { formatCard, type Card } from '../engine/cards';
import { evaluate } from '../engine/hand-evaluator';
import { splitMix32 } from '../engine/seeded-random';

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
/** @internal Node budget for the sampled path's search for one full deal. */
export const FEASIBILITY_NODE_LIMIT = 100_000;

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

  const seen = new Uint8Array(52 * 52);
  const ranges = opponents.map((range, i) => {
    seen.fill(0);
    const live: HoleCards[] = [];
    let sorted = true;
    for (const [a, b] of range) {
      const lo = a < b ? a : b;
      const hi = a < b ? b : a;
      if (dead[lo] || dead[hi] || seen[lo * 52 + hi]) continue;
      seen[lo * 52 + hi] = 1;
      const last = live[live.length - 1];
      if (last !== undefined && (last[0] > lo || (last[0] === lo && last[1] > hi))) sorted = false;
      live.push([lo, hi]);
    }
    if (live.length === 0) throw new RangeError(`Opponent ${i + 1} has no possible hand`);
    if (!sorted) live.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
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

/** @internal fnv1a32(canonicalKey(c)), hashed as it goes instead of building the key string. */
export function deriveSeed(c: CanonicalInput): number {
  let hash = 0x811c9dc5;
  const text = (s: string) => {
    for (let i = 0; i < s.length; i++) hash = Math.imul(hash ^ s.charCodeAt(i), 0x01000193);
  };
  // Cards are 0..51: one or two decimal digits.
  const card = (n: number) => {
    if (n >= 10) hash = Math.imul(hash ^ (48 + Math.floor(n / 10)), 0x01000193);
    hash = Math.imul(hash ^ (48 + (n % 10)), 0x01000193);
  };
  const cards = (list: readonly Card[]) =>
    list.forEach((n, i) => {
      if (i > 0) text(',');
      card(n);
    });
  text('equity-v1|h:');
  cards(c.hero);
  text('|b:');
  cards(c.board);
  text('|o:');
  c.opponents.forEach((range, r) => {
    if (r > 0) text('/');
    range.forEach((combo, i) => {
      if (i > 0) text(';');
      cards(combo);
    });
  });
  return hash >>> 0;
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
  readonly win: Float64Array;
  readonly tie: Float64Array;
  readonly share: Float64Array;
  trials = 0;
  /** forEachDeal stops (returning true, as if `visit` had) once it has visited this many nodes. */
  nodeLimit = Infinity;
  private nodes = 0;
  private readonly ranks: Int32Array;
  readonly c: CanonicalInput;

  constructor(c: CanonicalInput) {
    this.c = c;
    this.players = c.opponents.length + 1;
    this.need = 5 - c.board.length;
    this.hands = Array.from({ length: this.players }, () => {
      const hand = new Array<Card>(7).fill(0);
      c.board.forEach((card, i) => (hand[2 + i] = card));
      return hand;
    });
    this.setHole(0, c.hero[0], c.hero[1]);
    for (const card of [...c.hero, ...c.board]) this.dealt[card] = 1;
    this.win = new Float64Array(this.players);
    this.tie = new Float64Array(this.players);
    this.share = new Float64Array(this.players);
    this.ranks = new Int32Array(this.players);
  }

  setHole(player: number, low: Card, high: Card): void {
    const hand = this.hands[player] as Card[];
    hand[0] = low;
    hand[1] = high;
  }

  setRunout(index: number, card: Card): void {
    const slot = 7 - this.need + index;
    for (let p = 0; p < this.players; p++) (this.hands[p] as Card[])[slot] = card;
  }

  /** Backtracks over opponent deals. `visit` returns true to stop. Returns true if stopped. */
  forEachDeal(from: number, visit: () => boolean): boolean {
    if (++this.nodes > this.nodeLimit) return true;
    if (from === this.c.opponents.length) return visit();
    for (const combo of this.c.opponents[from] ?? []) {
      const [a, b] = combo;
      if (this.dealt[a] || this.dealt[b]) continue;
      this.dealt[a] = 1;
      this.dealt[b] = 1;
      this.setHole(from + 1, a, b);
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
    const counts = count === 1 ? this.win : this.tie;
    for (let p = 0; p < this.players; p++) {
      if (this.ranks[p] !== best) continue;
      counts[p] = (counts[p] as number) + 1;
      this.share[p] = (this.share[p] as number) + units;
    }
    this.trials++;
  }

  result(method: EquityResult['method']): EquityResult {
    const player = (p: number): PlayerEquity => ({
      win: (this.win[p] as number) / this.trials,
      tie: (this.tie[p] as number) / this.trials,
      equity: (this.share[p] as number) / (SHARE_UNITS * this.trials),
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
    // A river deal has no runout to enumerate, so it needs no deck.
    if (need > 0)
      for (let card = 0; card < 52; card++) if (!table.dealt[card]) remaining.push(card);
    runouts(0, 0);
    return false;
  });
  if (table.trials === 0) throw cannotDeal();
  return table.result('exact');
}

/** @internal How often, in rejections, the sampler checks whether its rejection cap can still be met. */
export const SAMPLER_CHECK_EVERY = 8192;
/** @internal Standard deviations in the Wilson upper bound on the sampler's acceptance rate. */
export const SAMPLER_ABORT_Z = 8;

/**
 * @internal True when, even at the z = SAMPLER_ABORT_Z Wilson upper bound on the acceptance rate, the
 * rejections still to come before `trials` deals are accepted would exceed `maxRejections` by more than
 * z standard deviations of that (negative binomial) count.
 */
export function rejectionsOverBudget(
  accepted: number,
  rejections: number,
  trials: number,
  maxRejections: number,
): boolean {
  const n = accepted + rejections;
  const z2 = SAMPLER_ABORT_Z * SAMPLER_ABORT_Z;
  const pHi = (accepted + z2 / 2 + SAMPLER_ABORT_Z * Math.sqrt(accepted + z2 / 4)) / (n + z2);
  const remaining = trials - accepted;
  const projected =
    (remaining * (1 - pHi)) / pHi - (SAMPLER_ABORT_Z * Math.sqrt(remaining * (1 - pHi))) / pHi;
  return rejections + projected > maxRejections;
}

/** @internal Samples whole deals, seeded from the input. Results are in canonical opponent order. */
export function sampledEquity(
  c: CanonicalInput,
  trials: number,
  maxRejections = 100 * trials,
): EquityResult {
  const table = new Table(c);
  // Fewer distinct cards across all ranges than the opponents need: no deal is possible.
  const inRanges = new Uint8Array(52);
  for (const range of c.opponents) {
    for (const [a, b] of range) {
      inRanges[a] = 1;
      inRanges[b] = 1;
    }
  }
  if (inRanges.reduce((sum, x) => sum + x, 0) < 2 * c.opponents.length) throw cannotDeal();
  // If the budget runs out the deal is assumed possible; maxRejections then bounds the sampler.
  table.nodeLimit = FEASIBILITY_NODE_LIMIT;
  if (!table.forEachDeal(0, () => true)) throw cannotDeal();
  // xoshiro128** state in locals, seeded and drawn exactly as Xoshiro128(deriveSeed(c)).nextInt.
  // Both inlined draws below duplicate Xoshiro128.nextUint32: keep both identical to it.
  const seed = splitMix32(deriveSeed(c));
  let s0 = seed() | 0;
  let s1 = seed() | 0;
  let s2 = seed() | 0;
  let s3 = seed() | 0;
  const { dealt, need, hands, players } = table;
  const opponents = c.opponents.length;
  const firstRunout = 7 - need;
  // Each range as flat (low, high) card pairs, for a fast inner loop.
  const flat = c.opponents.map((range) => {
    const pairs = new Uint8Array(2 * range.length);
    range.forEach(([a, b], i) => {
      pairs[2 * i] = a;
      pairs[2 * i + 1] = b;
    });
    return pairs;
  });
  // stamp[card] === attempt marks a card dealt in the current attempt; `dealt` holds hero and board.
  // Opponent combos never contain hero or board cards, so only the runout checks `dealt`.
  const stamp = new Uint32Array(52);
  let attempt = 0;
  // The current attempt's opponent cards, copied into `hands` once the deal is accepted.
  const picks = new Uint8Array(2 * opponents);
  let rejections = 0;
  while (table.trials < trials) {
    attempt++;
    let i = 0;
    for (; i < opponents; i++) {
      const range = flat[i] as Uint8Array;
      // Xoshiro128.nextInt(range.length / 2), inlined: locals, not a closure, keep the state in registers.
      const x = Math.imul(s1, 5);
      const u = Math.imul((x << 7) | (x >>> 25), 9) >>> 0;
      const t = s1 << 9;
      s2 ^= s0;
      s3 ^= s1;
      s1 ^= s2;
      s0 ^= s3;
      s2 ^= t;
      s3 = (s3 << 11) | (s3 >>> 21);
      const pick = 2 * Math.floor((u * (range.length >> 1)) / 4294967296);
      const a = range[pick] as number;
      const b = range[pick + 1] as number;
      if (stamp[a] === attempt || stamp[b] === attempt) break;
      stamp[a] = attempt;
      stamp[b] = attempt;
      picks[2 * i] = a;
      picks[2 * i + 1] = b;
    }
    if (i < opponents) {
      // Over the cap, or (checked now and then) certain to go over it: the same error either way.
      if (
        ++rejections > maxRejections ||
        (rejections % SAMPLER_CHECK_EVERY === 0 &&
          rejectionsOverBudget(table.trials, rejections, trials, maxRejections))
      )
        throw new RangeError('Sampling rejected too many deals');
      continue;
    }
    for (let p = 0; p < opponents; p++) {
      const hand = hands[p + 1] as Card[];
      hand[0] = picks[2 * p] as number;
      hand[1] = picks[2 * p + 1] as number;
    }
    for (let slot = firstRunout; slot < 7; slot++) {
      let card: number;
      do {
        // nextInt(52), inlined like the opponent picks.
        const x = Math.imul(s1, 5);
        const u = Math.imul((x << 7) | (x >>> 25), 9) >>> 0;
        const t = s1 << 9;
        s2 ^= s0;
        s3 ^= s1;
        s1 ^= s2;
        s0 ^= s3;
        s2 ^= t;
        s3 = (s3 << 11) | (s3 >>> 21);
        card = Math.floor((u * 52) / 4294967296);
      } while (dealt[card] || stamp[card] === attempt);
      stamp[card] = attempt;
      for (let p = 0; p < players; p++) (hands[p] as Card[])[slot] = card;
    }
    table.score();
  }
  return table.result('sampled');
}

/** Exact when estimateEvaluations ≤ exactLimit, otherwise sampled with `trials` accepted trials. */
export interface EquityBudget {
  readonly exactLimit: number;
  readonly trials: number;
}

/**
 * Each player's chance of winning, tying and pot share. Exact when the estimated work is small,
 * otherwise sampled with a seed that depends only on the canonical input. Throws RangeError.
 */
export function computeEquity(input: EquityInput): EquityResult {
  return equityWithBudget(input, { exactLimit: EXACT_EVALUATION_LIMIT, trials: SAMPLE_TRIALS });
}

/** computeEquity with a custom exact limit and sample count; same validation, seed and output order. */
export function equityWithBudget(input: EquityInput, budget: EquityBudget): EquityResult {
  const c = canonicalise(input);
  const result =
    estimateEvaluations(c) <= budget.exactLimit ? exactEquity(c) : sampledEquity(c, budget.trials);
  const opponents = new Array<PlayerEquity>(c.order.length);
  c.order.forEach((inputIndex, i) => {
    opponents[inputIndex] = result.opponents[i] as PlayerEquity;
  });
  return { ...result, opponents };
}
