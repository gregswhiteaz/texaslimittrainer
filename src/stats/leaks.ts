import type { ActionType, Grade } from '../advice/grade';
// The JSON import stays last, as in src/stats/healthy-ranges.ts.
import leakCategories from './leak-categories.json' with { type: 'json' };

export type LeakStreet = 'flop' | 'turn' | 'river';
export type FacingAction = 'fold' | 'call' | 'raise';
export type OpenAction = 'check' | 'bet';
export type LeakCategoryId =
  `${LeakStreet}-facing-a-bet-${FacingAction}` | `${LeakStreet}-not-facing-a-bet-${OpenAction}`;

/** One postflop leak category with its authored text (REQ-047.1, REQ-061.2). */
export interface LeakCategory {
  readonly id: LeakCategoryId;
  readonly street: LeakStreet;
  readonly facingBet: boolean;
  readonly action: FacingAction | OpenAction;
  /** 'Calling too often on the turn'. */
  readonly title: string;
  /** 'turn calls'. */
  readonly evidenceName: string;
  /** Exactly one sentence. */
  readonly fix: string;
  readonly justification: string;
}

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
const STREETS: readonly string[] = ['flop', 'turn', 'river'];
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

function parseCategory(value: unknown, path: string, seen: Set<string>): LeakCategory {
  const entry = exact(value, path, KEYS);
  const missing = KEYS.find((key) => !(key in entry));
  if (missing !== undefined) throw invalid(`${path}.${missing}`);
  const { street, facingBet, action } = entry;
  if (typeof street !== 'string' || !STREETS.includes(street)) throw invalid(`${path}.street`);
  if (typeof facingBet !== 'boolean') throw invalid(`${path}.facingBet`);
  if (typeof action !== 'string' || !(facingBet ? FACING_ACTIONS : OPEN_ACTIONS).includes(action)) {
    throw invalid(`${path}.action`);
  }
  if (entry.id !== idOf(street, facingBet, action) || seen.has(entry.id)) {
    throw invalid(`${path}.id`);
  }
  seen.add(entry.id);
  if (!isTrimmed(entry.title) || entry.title.endsWith('.')) throw invalid(`${path}.title`);
  if (!isTrimmed(entry.evidenceName) || entry.evidenceName !== entry.evidenceName.toLowerCase()) {
    throw invalid(`${path}.evidenceName`);
  }
  if (!isOneSentence(entry.fix)) throw invalid(`${path}.fix`);
  if (!isTrimmed(entry.justification) || !/^[A-Z].*\.$/.test(entry.justification)) {
    throw invalid(`${path}.justification`);
  }
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

/** The category of a decision; null for preflop (TASK-10.6) or a category not in the data. A fold, call or
 *  raise faces a bet; a check or bet does not (A-1). */
export function decisionCategory(
  street: 'preflop' | LeakStreet,
  action: ActionType,
): LeakCategoryId | null {
  if (street === 'preflop') return null;
  const facing = FACING_ACTIONS.includes(action);
  return BY_ID.get(idOf(street, facing, action))?.id ?? null;
}

export interface CategoryDecision {
  readonly street: 'preflop' | LeakStreet;
  readonly action: { readonly type: ActionType };
  readonly grade: { readonly grade: Grade };
  readonly hinted: boolean;
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
  for (const { street, action, grade, hinted } of decisions) {
    if (hinted) continue;
    const category = decisionCategory(street, action.type);
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

/** The leaks among `counts`, in LEAK_CATEGORIES order (A-3); counts whose category is unknown are ignored. */
export function sessionLeaks(counts: readonly CategoryCount[]): readonly Leak[] {
  const byCategory = new Map(counts.map((count) => [count.category, count]));
  return LEAK_CATEGORIES.flatMap(({ id, title, fix }) => {
    const count = byCategory.get(id);
    return count !== undefined && isLeak(count)
      ? [{ category: id, title, evidence: leakEvidence(count), fix }]
      : [];
  });
}
