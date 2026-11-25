import type { Grade } from '../advice/grade';
import type { ActionRecord, HandResult, SeatNumber } from '../engine/hand';
import { netResult } from '../table/review';
import type { GameType } from '../table/session';
import { bbPer100, signedTenths } from '../table/session-report';

// TASK-11.1: the Statistics screen's Major-error trend over the stored hands (REQ-048). TASK-11.2: the cash-only
// BB/100 trend. See docs/stats/trends.md.

export const GROUP_SIZE = 500;

/** One stored hand as the trends need it. */
export interface TrendHand {
  readonly sessionId: string;
  readonly handNumber: number;
  /** ISO-8601. */
  readonly completedAt: string;
  readonly unhintedMajors: number;
  /** Present iff the hand is a cash-game hand. */
  readonly cash?: CashSummary;
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

/** The hand's unhinted Major decisions; a forced fold has no decision entry, so it never counts (REQ-004.8). */
export function trendHand(record: TrendSource): TrendHand {
  let unhintedMajors = 0;
  for (const { grade, hinted } of record.decisions) {
    if (!hinted && grade.grade === 'major') unhintedMajors++;
  }
  const { sessionId, handNumber, completedAt } = record;
  if (record.gameType !== 'cash') return { sessionId, handNumber, completedAt, unhintedMajors };
  // parseHandRecord guarantees a cash record carries these fields.
  const cashHand = record as Required<
    Pick<TrendSource, 'stake' | 'userSeat' | 'actions' | 'result'>
  >;
  const cash = { net: netResult(cashHand), bigBet: cashHand.stake.bigBet };
  return { sessionId, handNumber, completedAt, unhintedMajors, cash };
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

export function statisticsView(data: TrendData): StatisticsView {
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
  return { hands, sessions, totals: totalsLine(hands, sessions), chart, bb100 };
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

export function chartLabel(points: readonly TrendPoint[]): string {
  const values = points.map((p) => p.majorPer100.toFixed(1)).join(', ');
  return `${CHART_TITLE}, one point per ${GROUP_SIZE} hands: ${values}`;
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
