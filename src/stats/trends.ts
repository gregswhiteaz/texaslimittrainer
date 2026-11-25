import type { Grade } from '../advice/grade';
import { referenceSizeOf } from '../advice/preflop';
import type { ReferenceSize } from '../advice/preflop-chart';
import type { ActionRecord, HandResult, SeatNumber } from '../engine/hand';
import { netResult } from '../table/review';
import type { GameType } from '../table/session';
import { bbPer100, signedTenths } from '../table/session-report';

// TASK-11.1: the Statistics screen's Major-error trend over the stored hands (REQ-048). TASK-11.2: the cash-only
// BB/100 trend. TASK-11.3: the G-2 target line on the Major-error trend. TASK-11.4: the table size and game type
// filters. See docs/stats/trends.md.

export const GROUP_SIZE = 500;
/** Hands in the G-2 baseline (REQ-048.9). */
export const G2_BASELINE_HANDS = 1000;

/** One stored hand as the trends need it. */
export interface TrendHand {
  readonly sessionId: string;
  readonly handNumber: number;
  /** ISO-8601. */
  readonly completedAt: string;
  readonly unhintedMajors: number;
  /** Present iff the hand is a cash-game hand. */
  readonly cash?: CashSummary;
  /** Dealt-in seats in the hand (record.seats.length), 2–10. */
  readonly dealtIn?: number;
}

export interface CashSummary {
  /** The user's net chips in the hand: netResult(record). */
  readonly net: number;
  /** The hand's stake big bet (record.stake.bigBet), ≥ 1. */
  readonly bigBet: number;
}

/** Decisions and cash fields as stored; HandRecord satisfies it. */
export interface TrendSource {
  readonly sessionId: string;
  readonly handNumber: number;
  readonly completedAt: string;
  readonly decisions: readonly {
    readonly grade: { readonly grade: Grade };
    readonly hinted: boolean;
  }[];
  readonly gameType?: GameType;
  readonly stake?: { readonly bigBet: number };
  readonly userSeat?: SeatNumber;
  readonly actions?: readonly ActionRecord[];
  readonly result?: HandResult;
  readonly seats?: readonly unknown[];
}

export interface TrendData {
  readonly hands: readonly TrendHand[];
  /** sessionId → session startedAt (ISO) for every valid stored session record. */
  readonly sessionStarts: ReadonlyMap<string, string>;
}

export interface TrendReader {
  trendData(): Promise<TrendData>;
}

export interface TrendPoint {
  /** 1-based position in the ordered hands, e.g. 501. */
  readonly firstHand: number;
  readonly lastHand: number;
  readonly majorPer100: number;
}

export type MajorErrorChart =
  | { readonly kind: 'no-hands' }
  | { readonly kind: 'more-hands'; readonly needed: number }
  | { readonly kind: 'points'; readonly points: readonly TrendPoint[] };

export interface Bb100Point {
  /** 1-based position among the ordered cash hands. */
  readonly firstHand: number;
  readonly lastHand: number;
  readonly bb100: number;
}

export type Bb100Chart =
  | { readonly kind: 'no-cash' }
  | { readonly kind: 'more-cash'; readonly needed: number }
  | { readonly kind: 'points'; readonly points: readonly Bb100Point[] };

export interface StatisticsView {
  readonly hands: number;
  readonly sessions: number;
  readonly totals: string;
  readonly chart: MajorErrorChart;
  readonly bb100: Bb100Chart;
  /** Half the G-2 baseline rate over every stored hand; null below G2_BASELINE_HANDS stored hands. */
  readonly g2Target: number | null;
}

export const NO_HANDS_MESSAGE = 'Play your first hand to see trends.';
export const CHART_TITLE = 'Major errors per 100 hands';
export const CHART_NOTE = 'Each point is 500 hands. Lower is better.';
export const LOAD_FAILED_MESSAGE = 'Your statistics could not be loaded.';
export const NO_CASH_MESSAGE = 'No cash-game hands yet.';
export const BB100_TITLE = 'Big bets won per 100 hands';
export const BB100_GOAL = 'Dashed line: break-even';
export const BB100_NOTE =
  'Each point is 500 cash hands. Above the dashed line means you are winning.';
export const G2_CAPTION = 'Dashed line: half your first-1,000 rate (G-2)';

/** The hand's unhinted Major decisions; a forced fold has no decision entry, so it never counts (REQ-004.8). */
export function trendHand(record: TrendSource): TrendHand {
  let unhintedMajors = 0;
  for (const { grade, hinted } of record.decisions) {
    if (!hinted && grade.grade === 'major') unhintedMajors++;
  }
  const { sessionId, handNumber, completedAt } = record;
  const base = {
    sessionId,
    handNumber,
    completedAt,
    unhintedMajors,
    ...(record.seats && { dealtIn: record.seats.length }),
  };
  if (record.gameType !== 'cash') return base;
  // parseHandRecord guarantees a cash record carries these fields.
  const cashHand = record as Required<
    Pick<TrendSource, 'stake' | 'userSeat' | 'actions' | 'result'>
  >;
  const cash = { net: netResult(cashHand), bigBet: cashHand.stake.bigBet };
  return { ...base, cash };
}

export type TableSizeFilter = 'all' | ReferenceSize;
export type GameTypeFilter = 'all' | GameType;

export interface TrendFilter {
  readonly tableSize: TableSizeFilter;
  readonly gameType: GameTypeFilter;
}

export const ALL_TRENDS: TrendFilter = { tableSize: 'all', gameType: 'all' };
export const TABLE_SIZE_LABEL = 'Table size';
export const GAME_TYPE_LABEL = 'Game type';
export const TABLE_SIZE_OPTIONS: readonly (readonly [TableSizeFilter, string])[] = [
  ['all', 'All'],
  ['heads-up', 'Heads-up'],
  ['6-max', '6-max'],
  ['full-ring', 'Full ring'],
];
export const GAME_TYPE_OPTIONS: readonly (readonly [GameTypeFilter, string])[] = [
  ['all', 'All'],
  ['cash', 'Cash'],
  ['sit-and-go', 'Sit-and-go'],
];

/** The hands matching `filter` in input order, keeping sessionStarts; `data` itself when the filter is All / All.
 *  A hand's table size is its session's: the largest dealtIn among the session's hands, through referenceSizeOf
 *  (D-2). A session with no known dealtIn, or one outside 2–10, matches only All. */
export function filterTrendData(data: TrendData, filter: TrendFilter): TrendData {
  const { tableSize, gameType } = filter;
  if (tableSize === 'all' && gameType === 'all') return data;
  const sizeOf = new Map<string, number>();
  if (tableSize !== 'all') {
    for (const { sessionId, dealtIn } of data.hands) {
      if (dealtIn !== undefined)
        sizeOf.set(sessionId, Math.max(dealtIn, sizeOf.get(sessionId) ?? 0));
    }
  }
  const sizeMatches = (sessionId: string): boolean => {
    if (tableSize === 'all') return true;
    const size = sizeOf.get(sessionId);
    return size !== undefined && size >= 2 && size <= 10 && referenceSizeOf(size) === tableSize;
  };
  const typeMatches = (hand: TrendHand): boolean =>
    gameType === 'all' || (hand.cash !== undefined) === (gameType === 'cash');
  return {
    hands: data.hands.filter((h) => typeMatches(h) && sizeMatches(h.sessionId)),
    sessionStarts: data.sessionStarts,
  };
}

/** By session start (its record's startedAt, else its earliest completedAt), then sessionId, then hand number. */
export function orderHands(data: TrendData): readonly TrendHand[] {
  const starts = new Map<string, number>();
  for (const [sessionId, startedAt] of data.sessionStarts) {
    starts.set(sessionId, Date.parse(startedAt));
  }
  const earliest = new Map<string, number>();
  for (const hand of data.hands) {
    if (data.sessionStarts.has(hand.sessionId)) continue;
    const at = Date.parse(hand.completedAt);
    earliest.set(hand.sessionId, Math.min(at, earliest.get(hand.sessionId) ?? at));
  }
  const start = (sessionId: string): number =>
    starts.get(sessionId) ?? (earliest.get(sessionId) as number);
  return [...data.hands].sort(
    (a, b) =>
      start(a.sessionId) - start(b.sessionId) ||
      (a.sessionId < b.sessionId ? -1 : a.sessionId > b.sessionId ? 1 : 0) ||
      a.handNumber - b.handNumber,
  );
}

/** One point per complete group of GROUP_SIZE ordered hands; the trailing remainder forms none. */
export function majorErrorPoints(ordered: readonly TrendHand[]): readonly TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let first = 0; first + GROUP_SIZE <= ordered.length; first += GROUP_SIZE) {
    let majors = 0;
    for (let i = first; i < first + GROUP_SIZE; i++) {
      majors += (ordered[i] as TrendHand).unhintedMajors;
    }
    points.push({
      firstHand: first + 1,
      lastHand: first + GROUP_SIZE,
      majorPer100: bbPer100(majors, 1, GROUP_SIZE),
    });
  }
  return points;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** BB/100 of `hands`, all cash: Σ(net / bigBet) / n × 100 as an exact fraction over the big bets' least common
 *  multiple, rounded like the Session Report's BB/100. RangeError if empty or a hand is not cash. */
export function bb100Value(hands: readonly TrendHand[]): number {
  const cash = hands.map((h) => h.cash);
  if (cash.length === 0 || cash.includes(undefined)) {
    throw new RangeError('bb100Value needs cash hands');
  }
  const summaries = cash as readonly CashSummary[];
  const lcm = summaries.reduce((l, c) => (l / gcd(l, c.bigBet)) * c.bigBet, 1);
  const net = summaries.reduce((sum, c) => sum + c.net * (lcm / c.bigBet), 0);
  return bbPer100(net, lcm, summaries.length);
}

/** One point per complete group of GROUP_SIZE cash hands among the ordered hands; the remainder forms none. */
export function bb100Points(ordered: readonly TrendHand[]): readonly Bb100Point[] {
  const cash = ordered.filter((h) => h.cash !== undefined);
  const points: Bb100Point[] = [];
  for (let first = 0; first + GROUP_SIZE <= cash.length; first += GROUP_SIZE) {
    points.push({
      firstHand: first + 1,
      lastHand: first + GROUP_SIZE,
      bb100: bb100Value(cash.slice(first, first + GROUP_SIZE)),
    });
  }
  return points;
}

/** Half the unhinted Major errors per 100 hands over the first G2_BASELINE_HANDS of `ordered` (all stored hands in
 *  orderHands order), rounded to tenths; null when there are fewer than G2_BASELINE_HANDS hands. */
export function g2Target(ordered: readonly TrendHand[]): number | null {
  if (ordered.length < G2_BASELINE_HANDS) return null;
  let majors = 0;
  for (let i = 0; i < G2_BASELINE_HANDS; i++) majors += (ordered[i] as TrendHand).unhintedMajors;
  return bbPer100(majors, 2, G2_BASELINE_HANDS);
}

/** `data` drives the totals and charts; `all` (every stored hand, default `data`) drives the G-2 target, so a
 *  filter never moves it. */
export function statisticsView(data: TrendData, all: TrendData = data): StatisticsView {
  const hands = data.hands.length;
  const sessions = new Set(data.hands.map((h) => h.sessionId)).size;
  let ordered: readonly TrendHand[] | undefined;
  const order = (): readonly TrendHand[] => (ordered ??= orderHands(data));
  const chart: MajorErrorChart =
    hands === 0
      ? { kind: 'no-hands' }
      : hands < GROUP_SIZE
        ? { kind: 'more-hands', needed: GROUP_SIZE - hands }
        : { kind: 'points', points: majorErrorPoints(order()) };
  const cashHands = data.hands.filter((h) => h.cash !== undefined).length;
  const bb100: Bb100Chart =
    cashHands === 0
      ? { kind: 'no-cash' }
      : cashHands < GROUP_SIZE
        ? { kind: 'more-cash', needed: GROUP_SIZE - cashHands }
        : { kind: 'points', points: bb100Points(order()) };
  const target =
    all.hands.length < G2_BASELINE_HANDS
      ? null
      : g2Target(all === data ? order() : orderHands(all));
  return { hands, sessions, totals: totalsLine(hands, sessions), chart, bb100, g2Target: target };
}

/** A whole count with comma thousands separators, independent of the browser locale (A-7). */
export function countText(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+$)/g, ',');
}

const counted = (n: number, word: string): string => `${countText(n)} ${word}${n === 1 ? '' : 's'}`;

export function totalsLine(hands: number, sessions: number): string {
  return `${counted(hands, 'hand')} over ${counted(sessions, 'session')}`;
}

export function moreHandsMessage(needed: number): string {
  return `Play ${counted(needed, 'more hand')} to see your first trend point.`;
}

export function pointLabel(point: TrendPoint): string {
  return `Hands ${countText(point.firstHand)}–${countText(point.lastHand)}: ${point.majorPer100.toFixed(1)}`;
}

/** With a target, the label also names the dashed line's value. */
export function chartLabel(points: readonly TrendPoint[], target: number | null = null): string {
  const values = points.map((p) => p.majorPer100.toFixed(1)).join(', ');
  const line = target === null ? '' : `. Dashed target line at ${target.toFixed(1)}`;
  return `${CHART_TITLE}, one point per ${GROUP_SIZE} hands: ${values}${line}`;
}

export function moreCashHandsMessage(needed: number): string {
  return `Play ${counted(needed, 'more cash hand')} to see your first trend point.`;
}

export function bb100PointLabel(point: Bb100Point): string {
  return `Cash hands ${countText(point.firstHand)}–${countText(point.lastHand)}: ${signedTenths(point.bb100)}`;
}

export function bb100ChartLabel(points: readonly Bb100Point[]): string {
  const values = points.map((p) => signedTenths(p.bb100)).join(', ');
  return `${BB100_TITLE}, one point per ${GROUP_SIZE} cash hands: ${values}`;
}
