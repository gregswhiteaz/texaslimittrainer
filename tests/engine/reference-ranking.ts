// Independent test oracle: ranks the 7,462 five-card classes from first principles by counting and
// sorting. It must never import the evaluator under test.
import { cardRank, cardSuit, type Card } from '../../src/engine/cards';

/** Weakest first. */
const CATEGORY_ORDER = [
  'high-card',
  'one-pair',
  'two-pair',
  'three-of-a-kind',
  'straight',
  'flush',
  'full-house',
  'four-of-a-kind',
  'straight-flush',
] as const;

export type ReferenceCategory = (typeof CATEGORY_ORDER)[number];

export interface ReferenceClass {
  /** Card ranks (0..12), grouped by count then rank, highest first. */
  ranks: number[];
  flush: boolean;
  category: ReferenceCategory;
  /** 1..7462, higher is stronger. */
  rank: number;
  tiebreak: number[];
}

function classify(ranks: number[], flush: boolean): Omit<ReferenceClass, 'rank'> {
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const shape = groups.map(([, n]) => n).join('');
  const distinct = groups.map(([r]) => r);
  const ordered = groups.flatMap(([r, n]) => Array<number>(n).fill(r));
  let top = -1;
  if (shape === '11111') {
    const [hi = 0, second = 0, , , lo = 0] = distinct;
    if (hi - lo === 4) top = hi;
    else if (hi === 12 && second === 3) top = 3; // A-5-4-3-2: the ace plays low
  }
  const make = (category: ReferenceCategory, tiebreak: number[]) => ({
    ranks: ordered,
    flush,
    category,
    tiebreak,
  });
  if (top >= 0 && flush) return make('straight-flush', [top]);
  if (shape === '41') return make('four-of-a-kind', distinct);
  if (shape === '32') return make('full-house', distinct);
  if (flush) return make('flush', distinct);
  if (top >= 0) return make('straight', [top]);
  if (shape === '311') return make('three-of-a-kind', distinct);
  if (shape === '221') return make('two-pair', distinct);
  if (shape === '2111') return make('one-pair', distinct);
  return make('high-card', distinct);
}

function compareClasses(a: Omit<ReferenceClass, 'rank'>, b: Omit<ReferenceClass, 'rank'>): number {
  const byCategory = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  if (byCategory !== 0) return byCategory;
  for (let i = 0; i < a.tiebreak.length; i++) {
    const diff = (a.tiebreak[i] ?? 0) - (b.tiebreak[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Unique key of a class: base-5 rank counts, doubled, plus 1 for a flush. */
function classKey(ranks: readonly number[], flush: boolean): number {
  return ranks.reduce((sum, r) => sum + 5 ** r, 0) * 2 + (flush ? 1 : 0);
}

function buildClasses(): ReferenceClass[] {
  const unranked: Omit<ReferenceClass, 'rank'>[] = [];
  for (let a = 0; a < 13; a++)
    for (let b = a; b < 13; b++)
      for (let c = b; c < 13; c++)
        for (let d = c; d < 13; d++)
          for (let e = d; e < 13; e++) {
            if (a === e) continue; // five of one rank is impossible
            const ranks = [a, b, c, d, e];
            unranked.push(classify(ranks, false));
            if (new Set(ranks).size === 5) unranked.push(classify(ranks, true));
          }
  return unranked.sort(compareClasses).map((cls, i) => ({ ...cls, rank: i + 1 }));
}

/** Every five-card class, weakest first. */
export const REFERENCE_CLASSES: readonly ReferenceClass[] = buildClasses();

const byKey = new Map(REFERENCE_CLASSES.map((cls) => [classKey(cls.ranks, cls.flush), cls]));

/** The class of exactly five distinct cards. */
export function referenceClass(cards: readonly Card[]): ReferenceClass {
  const suit = cardSuit(cards[0] ?? 0);
  const flush = cards.every((card) => cardSuit(card) === suit);
  const cls = byKey.get(classKey(cards.map(cardRank), flush));
  if (cls === undefined) throw new Error(`No reference class for ${cards.join(',')}`);
  return cls;
}

/** All five-card subsets of the given cards. */
export function fiveCardSubsets(cards: readonly Card[]): Card[][] {
  const out: Card[][] = [];
  const pick = (start: number, chosen: Card[]): void => {
    if (chosen.length === 5) {
      out.push(chosen);
      return;
    }
    for (let i = start; i < cards.length; i++) pick(i + 1, [...chosen, cards[i] ?? 0]);
  };
  pick(0, []);
  return out;
}

/** Highest reference rank over all five-card subsets. */
export function bestReferenceRank(cards: readonly Card[]): number {
  return Math.max(...fiveCardSubsets(cards).map((hand) => referenceClass(hand).rank));
}
