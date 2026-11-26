import type { ActionType, Grade } from '../advice/grade';
import type { ActionRecord, SeatNumber } from '../engine/hand';
import { userMade } from '../table/hand-record';
// The JSON import stays last, as in src/stats/healthy-ranges.ts.
import leakCategories from './leak-categories.json' with { type: 'json' };

export type LeakStreet = 'flop' | 'turn' | 'river';
export type FacingAction = 'fold' | 'call' | 'raise';
export type OpenAction = 'check' | 'bet';
export type PositionGroup = 'early' | 'middle' | 'late' | 'blinds';
export type PreflopAction = 'fold' | 'open' | 'call' | 'raise';
export type PreflopCategoryId = `${PositionGroup}-${PreflopAction}`;
export type PostflopCategoryId =
  `${LeakStreet}-facing-a-bet-${FacingAction}` | `${LeakStreet}-not-facing-a-bet-${OpenAction}`;
export type LeakCategoryId = PostflopCategoryId | PreflopCategoryId;

/** A leak category's authored text (REQ-047.5, REQ-061.2). */
interface CategoryText {
  /** 'Calling too often on the turn'. */
  readonly title: string;
  /** 'turn calls'. */
  readonly evidenceName: string;
  /** Exactly one sentence. */
  readonly fix: string;
  readonly justification: string;
}

/** One postflop leak category (REQ-047.1). */
export interface PostflopLeakCategory extends CategoryText {
  readonly id: PostflopCategoryId;
  readonly street: LeakStreet;
  readonly facingBet: boolean;
  readonly action: FacingAction | OpenAction;
}

/** One preflop leak category: position group × action (REQ-047.1, REQ-047.6). */
export interface PreflopLeakCategory extends CategoryText {
  readonly id: PreflopCategoryId;
  readonly street: 'preflop';
  readonly group: PositionGroup;
  readonly action: PreflopAction;
}

export type LeakCategory = PostflopLeakCategory | PreflopLeakCategory;

const FORMAT = 'tlh-leak-categories';
const KEYS = [
  'id',
  'street',
  'facingBet',
  'action',
  'title',
  'evidenceName',
  'fix',
  'justification',
] as const;
const PREFLOP_KEYS = [
  'id',
  'street',
  'group',
  'action',
  'title',
  'evidenceName',
  'fix',
  'justification',
] as const;
const STREETS: readonly string[] = ['preflop', 'flop', 'turn', 'river'];
const GROUPS: readonly string[] = ['early', 'middle', 'late', 'blinds'];
const PREFLOP_ACTIONS: readonly string[] = ['fold', 'open', 'call', 'raise'];
const FACING_ACTIONS: readonly string[] = ['fold', 'call', 'raise'];
const OPEN_ACTIONS: readonly string[] = ['check', 'bet'];

type Fields = Readonly<Record<string, unknown>>;

function invalid(path: string): RangeError {
  return new RangeError(`Invalid leak categories: ${path}`);
}

/** `value` as an object with only `keys`; RangeError naming `path`, or `path.<key>` for an extra key. */
function exact(value: unknown, path: string, keys: readonly string[]): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(path);
  const extra = Object.keys(value).find((key) => !keys.includes(key));
  if (extra !== undefined) throw invalid(`${path}.${extra}`);
  return value as Fields;
}

const isTrimmed = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value === value.trim();

/** Starts with an upper-case letter, ends with '.', and has no other '.', '!' or '?'. */
const isOneSentence = (value: unknown): boolean =>
  typeof value === 'string' && /^[A-Z][^.!?]*\.$/.test(value);

function idOf(street: string, facingBet: boolean, action: string): string {
  return `${street}-${facingBet ? 'facing-a-bet' : 'not-facing-a-bet'}-${action}`;
}

function checkText(entry: Fields, path: string): void {
  if (!isTrimmed(entry.title) || entry.title.endsWith('.')) throw invalid(`${path}.title`);
  if (!isTrimmed(entry.evidenceName) || entry.evidenceName !== entry.evidenceName.toLowerCase()) {
    throw invalid(`${path}.evidenceName`);
  }
  if (!isOneSentence(entry.fix)) throw invalid(`${path}.fix`);
  if (!isTrimmed(entry.justification) || !/^[A-Z].*\.$/.test(entry.justification)) {
    throw invalid(`${path}.justification`);
  }
}

function parseCategory(value: unknown, path: string, seen: Set<string>): LeakCategory {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(path);
  const { street } = value as Fields;
  if (typeof street !== 'string' || !STREETS.includes(street)) throw invalid(`${path}.street`);
  const keys = street === 'preflop' ? PREFLOP_KEYS : KEYS;
  const entry = exact(value, path, keys);
  const missing = keys.find((key) => !(key in entry));
  if (missing !== undefined) throw invalid(`${path}.${missing}`);
  let id: string;
  if (street === 'preflop') {
    const { group, action } = entry;
    if (typeof group !== 'string' || !GROUPS.includes(group)) throw invalid(`${path}.group`);
    if (typeof action !== 'string' || !PREFLOP_ACTIONS.includes(action)) {
      throw invalid(`${path}.action`);
    }
    id = `${group}-${action}`;
  } else {
    const { facingBet, action } = entry;
    if (typeof facingBet !== 'boolean') throw invalid(`${path}.facingBet`);
    if (
      typeof action !== 'string' ||
      !(facingBet ? FACING_ACTIONS : OPEN_ACTIONS).includes(action)
    ) {
      throw invalid(`${path}.action`);
    }
    id = idOf(street, facingBet, action);
  }
  if (entry.id !== id || seen.has(id)) throw invalid(`${path}.id`);
  seen.add(id);
  checkText(entry, path);
  return entry as unknown as LeakCategory;
}

/** Validates a leak-category data file. RangeError('Invalid leak categories: <path>'), e.g.
 *  'categories[3].fix'. */
export function parseLeakCategories(value: unknown): readonly LeakCategory[] {
  const file = exact(value, 'file', ['format', 'version', 'categories']);
  if (file.format !== FORMAT) throw invalid('format');
  if (file.version !== 1) throw invalid('version');
  if (!Array.isArray(file.categories)) throw invalid('categories');
  const seen = new Set<string>();
  return file.categories.map((entry: unknown, i) => parseCategory(entry, `categories[${i}]`, seen));
}

/** The validated data file, in file order. */
export const LEAK_CATEGORIES: readonly LeakCategory[] = parseLeakCategories(leakCategories);

const BY_ID: ReadonlyMap<string, LeakCategory> = new Map(LEAK_CATEGORIES.map((c) => [c.id, c]));

/** Position group of `seat` among the dealt-in `seats`, counted back from `button` (REQ-047.6, A-6): with 3+
 *  seats the two after the button are blinds, the button and the seat before it late, the next two back middle
 *  and the rest early; heads-up the button is late and the other seat blinds. RangeError if `seat` or
 *  `button` is not dealt in. */
export function positionGroup(
  seats: readonly SeatNumber[],
  button: SeatNumber,
  seat: SeatNumber,
): PositionGroup {
  const sorted = [...seats].sort((x, y) => x - y);
  if (!sorted.includes(seat)) throw new RangeError(`Seat ${seat} is not dealt in`);
  if (!sorted.includes(button)) throw new RangeError(`Button ${button} is not dealt in`);
  const start = sorted.findIndex((s) => s > button);
  const order = start <= 0 ? sorted : [...sorted.slice(start), ...sorted.slice(0, start)];
  const n = order.length;
  const i = order.indexOf(seat);
  const k = n - 1 - i;
  if (n === 2) return seat === button ? 'late' : 'blinds';
  if (i <= 1) return 'blinds';
  if (k <= 1) return 'late';
  if (k <= 3) return 'middle';
  return 'early';
}

/** The preflop leak action of a decision: a raise is an open unless someone raised before it; a check (the big
 *  blind's option) or a bet has none (REQ-047.9, A-1, A-5). */
export function preflopAction(type: ActionType, raisedBefore: boolean): PreflopAction | null {
  if (type === 'fold' || type === 'call') return type;
  if (type === 'raise') return raisedBefore ? 'raise' : 'open';
  return null;
}

/** Where a preflop decision was made. */
export interface PreflopSpot {
  readonly group: PositionGroup;
  /** A preflop record of type `raise` precedes the decision's action. */
  readonly raisedBefore: boolean;
}

/** The category of a decision, or null when it has none or the category is not in the data. Postflop: a fold,
 *  call or raise faces a bet; a check or bet does not (TASK-10.5 A-1). Preflop: `<group>-<action>` from
 *  `spot`; null without a spot. */
export function decisionCategory(
  street: 'preflop' | LeakStreet,
  action: ActionType,
  spot?: PreflopSpot,
): LeakCategoryId | null {
  if (street === 'preflop') {
    const mapped = spot && preflopAction(action, spot.raisedBefore);
    return mapped ? (BY_ID.get(`${spot.group}-${mapped}`)?.id ?? null) : null;
  }
  const facing = FACING_ACTIONS.includes(action);
  return BY_ID.get(idOf(street, facing, action))?.id ?? null;
}

export interface CategoryDecision {
  readonly street: 'preflop' | LeakStreet;
  readonly action: { readonly type: ActionType };
  readonly grade: { readonly grade: Grade };
  readonly hinted: boolean;
  /** Preflop only; without it a preflop decision is in no category. */
  readonly preflop?: PreflopSpot;
}

/** A hand as handCategoryDecisions needs it; HandRecord satisfies it. */
export interface CategoryHand {
  readonly seats: readonly { readonly seat: SeatNumber }[];
  readonly button?: SeatNumber;
  readonly userSeat: SeatNumber;
  readonly actions: readonly ActionRecord[];
  readonly decisions: readonly {
    readonly street?: CategoryDecision['street'];
    readonly action?: { readonly type: ActionType };
    readonly grade: { readonly grade: Grade };
    readonly hinted: boolean;
  }[];
}

/** The hand's decisions that have a street and action, as CategoryDecisions. The j-th decision pairs with the
 *  user's j-th non-blind action record (userMade, A-3); a preflop decision gets its spot when the hand has a `button`
 *  and its paired record is preflop with the same type, otherwise it has none and is not counted. */
export function handCategoryDecisions(hand: CategoryHand): CategoryDecision[] {
  const spots = new Map<number, PreflopSpot>();
  if (hand.button !== undefined) {
    const { button, userSeat, decisions } = hand;
    const made = userMade(hand.actions, userSeat);
    // Fixed for the hand; computed on the first pairing so a hand with none never reads seats or throws (A-1).
    let group: PositionGroup | undefined;
    let raisedBefore = false;
    let j = 0;
    for (const record of hand.actions) {
      if (record === made[j]) {
        const d = decisions[j];
        if (
          d?.street === 'preflop' &&
          record.street === 'preflop' &&
          record.type === d.action?.type
        ) {
          group ??= positionGroup(
            hand.seats.map((s) => s.seat),
            button,
            userSeat,
          );
          spots.set(j, { group, raisedBefore });
        }
        j++;
      }
      if (record.street === 'preflop' && record.type === 'raise') raisedBefore = true;
    }
  }
  return hand.decisions.flatMap(({ street, action, grade, hinted }, i) => {
    if (street === undefined || action === undefined) return [];
    const preflop = spots.get(i);
    return [{ street, action, grade, hinted, ...(preflop && { preflop }) }];
  });
}

export interface CategoryCount {
  readonly category: LeakCategoryId;
  /** Unhinted decisions, ≥ 1. */
  readonly decisions: number;
  /** Unhinted Minor + Major, ≤ decisions. */
  readonly errors: number;
  /** Unhinted Major, ≤ errors. */
  readonly major: number;
}

/** Unhinted counts per category with ≥ 1 unhinted decision, in LEAK_CATEGORIES order. */
export function categoryCounts(decisions: Iterable<CategoryDecision>): readonly CategoryCount[] {
  const counts = new Map<LeakCategoryId, { decisions: number; errors: number; major: number }>();
  for (const { street, action, grade, hinted, preflop } of decisions) {
    if (hinted) continue;
    const category = decisionCategory(street, action.type, preflop);
    if (category === null) continue;
    const count = counts.get(category) ?? { decisions: 0, errors: 0, major: 0 };
    count.decisions++;
    if (grade.grade !== 'correct') count.errors++;
    if (grade.grade === 'major') count.major++;
    counts.set(category, count);
  }
  return LEAK_CATEGORIES.flatMap(({ id }) => {
    const count = counts.get(id);
    return count === undefined ? [] : [{ category: id, ...count }];
  });
}

/** At least 8 unhinted decisions and at least 40% of them errors (REQ-047.2), in integer arithmetic. */
export function isLeak(count: CategoryCount): boolean {
  return count.decisions >= 8 && 5 * count.errors >= 2 * count.decisions;
}

/** '4 of 10 turn calls graded as errors' (REQ-047.4). */
export function leakEvidence(count: CategoryCount): string {
  const { evidenceName } = BY_ID.get(count.category) as LeakCategory;
  return `${count.errors} of ${count.decisions} ${evidenceName} graded as errors`;
}

export interface Leak {
  readonly category: LeakCategoryId;
  readonly title: string;
  readonly evidence: string;
  readonly fix: string;
}

/** At most this many leaks are shown on the report (REQ-044.5, REQ-047.3). */
export const MAX_SHOWN_LEAKS = 3;

interface Candidate {
  readonly category: LeakCategory;
  readonly count: CategoryCount;
  /** Index in LEAK_CATEGORIES, the last tie-break. */
  readonly index: number;
}

/** Negative when `a` is more costly than `b`: more Major, higher error rate, more errors, then data order. */
function compareLeaks(a: Candidate, b: Candidate): number {
  const x = a.count;
  const y = b.count;
  return (
    y.major - x.major ||
    y.errors * x.decisions - x.errors * y.decisions ||
    y.errors - x.errors ||
    a.index - b.index
  );
}

/** The leaks among `counts`, most costly first (REQ-047.3), at most MAX_SHOWN_LEAKS;
 *  counts whose category is unknown are ignored. */
export function sessionLeaks(counts: readonly CategoryCount[]): readonly Leak[] {
  const byCategory = new Map(counts.map((count) => [count.category, count]));
  return LEAK_CATEGORIES.flatMap((category, index): Candidate[] => {
    const count = byCategory.get(category.id);
    return count !== undefined && isLeak(count) ? [{ category, count, index }] : [];
  })
    .sort(compareLeaks)
    .slice(0, MAX_SHOWN_LEAKS)
    .map(({ category: { id, title, fix }, count }) => ({
      category: id,
      title,
      evidence: leakEvidence(count),
      fix,
    }));
}
