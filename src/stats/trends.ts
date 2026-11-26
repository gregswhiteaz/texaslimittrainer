import type { Grade } from '../advice/grade';
import { referenceSizeOf } from '../advice/preflop';
import type { ReferenceSize } from '../advice/preflop-chart';
import type { ActionRecord, HandResult, SeatNumber } from '../engine/hand';
import { netResult } from '../table/review';
import type { GameType, LineUpName } from '../table/session';
import { bbPer100, signedTenths } from '../table/session-report';

// TASK-11.1: the Statistics screen's Major-error trend over the stored hands (REQ-048). TASK-11.2: the cash-only
// BB/100 trend. TASK-11.3: the G-2 target line on the Major-error trend. TASK-11.4: the table size and game type
// filters. TASK-11.5: grouping per session or per local day. TASK-11.7: the line-up filter. See docs/stats/trends.md.

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
  /** The hand record's line-up name; absent only in synthetic input (A-2). */
  readonly lineUp?: LineUpName;
}

export interface CashSummary {
  /** The user's net chips in the hand: netResult(record). */
  readonly net: number;
  /** The hand's stake big bet (record.stake.bigBet), ≥ 1. */
  readonly bigBet: number;
}

interface TrendSourceBase {
  readonly sessionId: string;
  readonly handNumber: number;
  readonly completedAt: string;
  readonly decisions: readonly {
    readonly grade: { readonly grade: Grade };
    readonly hinted: boolean;
  }[];
  readonly seats?: readonly unknown[];
  readonly lineUp?: LineUpName;
}

/** A stored cash hand: it always carries its stake and the fields netResult reads. */
export interface CashTrendSource extends TrendSourceBase {
  readonly gameType: 'cash';
  readonly stake: { readonly bigBet: number };
  readonly userSeat: SeatNumber;
  readonly actions: readonly ActionRecord[];
  readonly result: HandResult;
}

export interface OtherTrendSource extends TrendSourceBase {
  readonly gameType?: Exclude<GameType, 'cash'>;
}

/** Decisions and cash fields as stored; HandRecord satisfies it. */
export type TrendSource = CashTrendSource | OtherTrendSource;

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
  /** Present only under Session or Day grouping. */
  readonly group?: TrendGroup;
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
  /** Present only under Session or Day grouping, the same value as that group's Major point. */
  readonly group?: TrendGroup;
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
    ...(record.lineUp && { lineUp: record.lineUp }),
  };
  if (record.gameType !== 'cash') return base;
  const cash = { net: netResult(record), bigBet: record.stake.bigBet };
  return { ...base, cash };
}

export type TableSizeFilter = 'all' | ReferenceSize;
export type GameTypeFilter = 'all' | GameType;
export type LineUpFilter = 'all' | LineUpName;

export interface TrendFilter {
  readonly tableSize: TableSizeFilter;
  readonly gameType: GameTypeFilter;
  /** Absent means All (A-3). */
  readonly lineUp?: LineUpFilter;
}

export const ALL_TRENDS: TrendFilter = { tableSize: 'all', gameType: 'all', lineUp: 'all' };
export const TABLE_SIZE_LABEL = 'Table size';
export const GAME_TYPE_LABEL = 'Game type';
export const LINE_UP_LABEL = 'Line-up';
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
export const LINE_UP_OPTIONS: readonly (readonly [LineUpFilter, string])[] = [
  ['all', 'All'],
  ['Mixed', 'Mixed'],
  ['Tough', 'Tough'],
  ['Soft', 'Soft'],
  ['Custom', 'Custom'],
];

export type TrendGrouping = 'hands' | 'session' | 'day';
export const DEFAULT_GROUPING: TrendGrouping = 'hands';
export const GROUPING_LABEL = 'Group by';
export const GROUPING_OPTIONS: readonly (readonly [TrendGrouping, string])[] = [
  ['hands', 'Every 500 hands'],
  ['session', 'Session'],
  ['day', 'Day'],
];

/** A Session or Day point's group. day: 'YYYY-MM-DD' in local time; for a session, its start's local day. */
export type TrendGroup =
  | { readonly kind: 'session'; readonly number: number; readonly day: string }
  | { readonly kind: 'day'; readonly day: string };

/** The hands matching `filter` in input order, keeping sessionStarts; `data` itself when every filter is All.
 *  A hand's table size is its session's: the largest dealtIn among the session's hands, through referenceSizeOf
 *  (D-2). A session with no known dealtIn, or one outside 2–10, matches only All. A hand matches a named line-up
 *  by its own stored lineUp; a hand without one matches only All. */
export function filterTrendData(data: TrendData, filter: TrendFilter): TrendData {
  const { tableSize, gameType } = filter;
  const lineUp = filter.lineUp ?? 'all';
  if (tableSize === 'all' && gameType === 'all' && lineUp === 'all') return data;
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
    hands: data.hands.filter(
      (h) =>
        typeMatches(h) && sizeMatches(h.sessionId) && (lineUp === 'all' || h.lineUp === lineUp),
    ),
    sessionStarts: data.sessionStarts,
  };
}

/** A session's start in ms: its record's startedAt, else its earliest completedAt. */
function sessionStartTimes(data: TrendData): (sessionId: string) => number {
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
  return (sessionId) => starts.get(sessionId) ?? (earliest.get(sessionId) as number);
}

/** By session start (its record's startedAt, else its earliest completedAt), then sessionId, then hand number. */
export function orderHands(data: TrendData): readonly TrendHand[] {
  const start = sessionStartTimes(data);
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

/** Greatest common divisor of positive safe integers. */
function gcd(a: number, b: number): number {
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

/** Σ(net / bigBet) / n × 100 summed in floats, rounded half away from zero to tenths; 0, never -0. */
function floatBb100(summaries: readonly CashSummary[]): number {
  const sum = summaries.reduce((s, c) => s + c.net / c.bigBet, 0);
  const v = (sum / summaries.length) * 100;
  const tenths = Math.sign(v) * Math.floor(Math.abs(v) * 10 + 0.5);
  return tenths === 0 ? 0 : tenths / 10;
}

/** BB/100 of `hands`, all cash: Σ(net / bigBet) / n × 100 as an exact fraction over the big bets' least common
 *  multiple, rounded like the Session Report's BB/100. If that multiple would exceed Number.MAX_SAFE_INTEGER (only
 *  tampered stakes), the float sum rounded half away from zero instead. RangeError if empty or a hand is not cash. */
export function bb100Value(hands: readonly TrendHand[]): number {
  const cash = hands.map((h) => h.cash);
  if (cash.length === 0 || cash.includes(undefined)) {
    throw new RangeError('bb100Value needs cash hands');
  }
  const summaries = cash as readonly CashSummary[];
  let lcm = 1;
  for (const { bigBet } of summaries) {
    const next = (lcm / gcd(lcm, bigBet)) * bigBet;
    if (next > Number.MAX_SAFE_INTEGER) return floatBb100(summaries);
    lcm = next;
  }
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

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** The local calendar day of `at` (ISO string or epoch ms) as 'YYYY-MM-DD', in the viewing device's time zone. */
export function localDay(at: string | number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-05' → '5 Nov 2026', independent of the browser locale. */
export function dayText(day: string): string {
  const [year, month, date] = day.split('-');
  return `${Number(date)} ${MONTHS[Number(month) - 1]} ${year}`;
}

interface HandGroup {
  readonly group: TrendGroup;
  readonly hands: readonly TrendHand[];
}

/** `ordered` split into sessions (runs of one sessionId, numbered 1…k) or into local completion days (ascending,
 *  keeping `ordered` order within a day). */
function groupHands(
  ordered: readonly TrendHand[],
  grouping: 'session' | 'day',
  start: (sessionId: string) => number,
): readonly HandGroup[] {
  if (grouping === 'session') {
    const groups: { group: TrendGroup; hands: TrendHand[] }[] = [];
    let current: TrendHand[] | undefined;
    let sessionId: string | undefined;
    for (const hand of ordered) {
      if (hand.sessionId !== sessionId) {
        sessionId = hand.sessionId;
        current = [];
        const day = localDay(start(sessionId));
        groups.push({ group: { kind: 'session', number: groups.length + 1, day }, hands: current });
      }
      (current as TrendHand[]).push(hand);
    }
    return groups;
  }
  const days = new Map<string, TrendHand[]>();
  for (const hand of ordered) {
    const day = localDay(hand.completedAt);
    const bucket = days.get(day);
    if (bucket === undefined) days.set(day, [hand]);
    else bucket.push(hand);
  }
  return [...days.keys()]
    .sort()
    .map((day) => ({ group: { kind: 'day', day }, hands: days.get(day) as TrendHand[] }));
}

/** One Major point per group, positioned in the groups' concatenated hands. */
function groupedMajorPoints(groups: readonly HandGroup[]): readonly TrendPoint[] {
  let pos = 0;
  return groups.map(({ group, hands }) => {
    const majors = hands.reduce((sum, h) => sum + h.unhintedMajors, 0);
    const point = {
      firstHand: pos + 1,
      lastHand: pos + hands.length,
      majorPer100: bbPer100(majors, 1, hands.length),
      group,
    };
    pos += hands.length;
    return point;
  });
}

/** One BB/100 point per group with a cash hand, positioned in the groups' concatenated cash hands. */
function groupedBb100Points(groups: readonly HandGroup[]): readonly Bb100Point[] {
  const points: Bb100Point[] = [];
  let pos = 0;
  for (const { group, hands } of groups) {
    const cash = hands.filter((h) => h.cash !== undefined);
    if (cash.length === 0) continue;
    points.push({
      firstHand: pos + 1,
      lastHand: pos + cash.length,
      bb100: bb100Value(cash),
      group,
    });
    pos += cash.length;
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
 *  filter never moves it. Session and Day groupings plot every group from the first hand on (REQ-048.10). */
export function statisticsView(
  data: TrendData,
  all: TrendData = data,
  grouping: TrendGrouping = DEFAULT_GROUPING,
): StatisticsView {
  const hands = data.hands.length;
  const sessions = new Set(data.hands.map((h) => h.sessionId)).size;
  let ordered: readonly TrendHand[] | undefined;
  const order = (): readonly TrendHand[] => (ordered ??= orderHands(data));
  const cashHands = data.hands.filter((h) => h.cash !== undefined).length;
  let chart: MajorErrorChart;
  let bb100: Bb100Chart;
  if (grouping === 'hands') {
    chart =
      hands === 0
        ? { kind: 'no-hands' }
        : hands < GROUP_SIZE
          ? { kind: 'more-hands', needed: GROUP_SIZE - hands }
          : { kind: 'points', points: majorErrorPoints(order()) };
    bb100 =
      cashHands === 0
        ? { kind: 'no-cash' }
        : cashHands < GROUP_SIZE
          ? { kind: 'more-cash', needed: GROUP_SIZE - cashHands }
          : { kind: 'points', points: bb100Points(order()) };
  } else {
    const groups = hands === 0 ? [] : groupHands(order(), grouping, sessionStartTimes(data));
    chart =
      hands === 0 ? { kind: 'no-hands' } : { kind: 'points', points: groupedMajorPoints(groups) };
    bb100 =
      cashHands === 0
        ? { kind: 'no-cash' }
        : { kind: 'points', points: groupedBb100Points(groups) };
  }
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

const groupText = (group: TrendGroup): string =>
  group.kind === 'session'
    ? `Session ${countText(group.number)}, ${dayText(group.day)}`
    : dayText(group.day);

/** What one point stands for in the chart labels. */
const perPoint = (grouping: TrendGrouping, hands: string): string =>
  grouping === 'hands' ? `${GROUP_SIZE} ${hands}` : grouping;

export function chartNote(grouping: TrendGrouping): string {
  return grouping === 'hands' ? CHART_NOTE : `Each point is one ${grouping}. Lower is better.`;
}

export function bb100Note(grouping: TrendGrouping): string {
  return grouping === 'hands'
    ? BB100_NOTE
    : `Each point is one ${grouping}'s cash hands. Above the dashed line means you are winning.`;
}

export function pointLabel(point: TrendPoint): string {
  if (point.group) return `${groupText(point.group)}: ${point.majorPer100.toFixed(1)}`;
  return `Hands ${countText(point.firstHand)}–${countText(point.lastHand)}: ${point.majorPer100.toFixed(1)}`;
}

/** With a target, the label also names the dashed line's value. */
export function chartLabel(
  points: readonly TrendPoint[],
  target: number | null = null,
  grouping: TrendGrouping = DEFAULT_GROUPING,
): string {
  const values = points.map((p) => p.majorPer100.toFixed(1)).join(', ');
  const line = target === null ? '' : `. Dashed target line at ${target.toFixed(1)}`;
  return `${CHART_TITLE}, one point per ${perPoint(grouping, 'hands')}: ${values}${line}`;
}

export function moreCashHandsMessage(needed: number): string {
  return `Play ${counted(needed, 'more cash hand')} to see your first trend point.`;
}

export function bb100PointLabel(point: Bb100Point): string {
  if (point.group) return `${groupText(point.group)}: ${signedTenths(point.bb100)}`;
  return `Cash hands ${countText(point.firstHand)}–${countText(point.lastHand)}: ${signedTenths(point.bb100)}`;
}

export function bb100ChartLabel(
  points: readonly Bb100Point[],
  grouping: TrendGrouping = DEFAULT_GROUPING,
): string {
  const values = points.map((p) => signedTenths(p.bb100)).join(', ');
  return `${BB100_TITLE}, one point per ${perPoint(grouping, 'cash hands')}: ${values}`;
}
