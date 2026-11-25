import type { Grade } from '../advice/grade';
import { bbPer100 } from '../table/session-report';

// TASK-11.1: the Statistics screen's Major-error trend over the stored hands (REQ-048). See docs/stats/trends.md.

export const GROUP_SIZE = 500;

/** One stored hand as the trends need it. */
export interface TrendHand {
  readonly sessionId: string;
  readonly handNumber: number;
  /** ISO-8601. */
  readonly completedAt: string;
  readonly unhintedMajors: number;
}

/** Decisions as stored; HandRecord satisfies it. */
export interface TrendSource {
  readonly sessionId: string;
  readonly handNumber: number;
  readonly completedAt: string;
  readonly decisions: readonly {
    readonly grade: { readonly grade: Grade };
    readonly hinted: boolean;
  }[];
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

export interface StatisticsView {
  readonly hands: number;
  readonly sessions: number;
  readonly totals: string;
  readonly chart: MajorErrorChart;
}

export const NO_HANDS_MESSAGE = 'Play your first hand to see trends.';
export const CHART_TITLE = 'Major errors per 100 hands';
export const CHART_NOTE = 'Each point is 500 hands. Lower is better.';
export const LOAD_FAILED_MESSAGE = 'Your statistics could not be loaded.';

/** The hand's unhinted Major decisions; a forced fold has no decision entry, so it never counts (REQ-004.8). */
export function trendHand(record: TrendSource): TrendHand {
  let unhintedMajors = 0;
  for (const { grade, hinted } of record.decisions) {
    if (!hinted && grade.grade === 'major') unhintedMajors++;
  }
  const { sessionId, handNumber, completedAt } = record;
  return { sessionId, handNumber, completedAt, unhintedMajors };
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

export function statisticsView(data: TrendData): StatisticsView {
  const hands = data.hands.length;
  const sessions = new Set(data.hands.map((h) => h.sessionId)).size;
  const chart: MajorErrorChart =
    hands === 0
      ? { kind: 'no-hands' }
      : hands < GROUP_SIZE
        ? { kind: 'more-hands', needed: GROUP_SIZE - hands }
        : { kind: 'points', points: majorErrorPoints(orderHands(data)) };
  return { hands, sessions, totals: totalsLine(hands, sessions), chart };
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
