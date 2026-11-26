import type { ActionType, Grade } from '../advice/grade';
import type { SeatNumber } from '../engine/hand';
import {
  categoryCounts,
  handCategoryDecisions,
  LEAK_CATEGORIES,
  type CategoryCount,
} from '../stats/leaks';
import {
  addStyleCounts,
  handStyleCounts,
  type StatHand,
  type StyleCounts,
} from '../stats/style-stats';
import { isWhole, type HandRecordDecision } from './hand-record';
import { buyIn, MAX_SESSION_COUNT, tableStake, type GameType, type Stake } from './session';
import type { SessionRecord } from './session-record';
import { GAME_LABEL } from './table-view';

/** The cash result of a session (REQ-007.3, REQ-044.1). */
export interface CashResult {
  /** 20 × the big bet of the stake. */
  readonly buyIn: number;
  /** The session's stored rebuys. */
  readonly rebuys: number;
  /** The user seat's stored stack (0 after a bust). */
  readonly finalStack: number;
  /** finalStack − buyIn × (1 + rebuys), in dollars. */
  readonly result: number;
  /** bbPer100(result, bigBet, handsPlayed): one decimal, never -0. */
  readonly bbPer100: number;
}

/** One ended session's report as stored in `reports` (REQ-044.7). Written once, never modified (REQ-052.5). */
export interface SessionReport {
  /** 32 lowercase hex characters; the key. */
  readonly sessionId: string;
  /** ISO-8601 UTC: the session's startedAt. */
  readonly startedAt: string;
  /** ISO-8601 UTC: equal to the session record's endedAt. */
  readonly endedAt: string;
  readonly gameType: GameType;
  readonly players: number;
  /** tableStake(config). */
  readonly stake: Stake;
  /** At least 1. */
  readonly handsPlayed: number;
  /** null iff sit-and-go (A-3). */
  readonly cash: CashResult | null;
  /** The user's style counts over the session's stored hands. Absent on reports without stored hands
   *  (TASK-10.3 A-4). */
  readonly style?: StyleCounts;
  /** Absent on reports without stored decision records (TASK-10.4 A-3, A-4). */
  readonly errors?: ErrorCounts;
  /** Unhinted counts per leak category (postflop, then preflop); absent iff `errors` is absent (TASK-10.5 A-4, A-5). */
  readonly leakCounts?: readonly CategoryCount[];
  /** Absent iff `errors` is absent (TASK-10.7 A-3). */
  readonly hints?: HintCounts;
}

/** The part of a stored decision the report reads; HandRecordDecision satisfies it. */
export interface ReportDecision {
  readonly grade: { readonly grade: Grade };
  readonly hinted: boolean;
  /** Absent only in hand-built test data; such a decision is not classified (TASK-10.5 A-2). */
  readonly street?: HandRecordDecision['street'];
  readonly action?: { readonly type: ActionType };
}

/** A stored hand as the report needs it; HandRecord satisfies it. `decisions` absent → no `errors` (A-4). */
export type ReportHand = StatHand & {
  readonly userSeat: SeatNumber;
  /** Absent only in hand-built test data; such a hand's preflop decisions are not classified (TASK-10.6 A-2). */
  readonly button?: SeatNumber;
  readonly decisions?: readonly ReportDecision[];
};

/** Counts of the user's unhinted decisions graded Major / Minor (REQ-044.2, REQ-040.3). */
export interface ErrorCounts {
  readonly major: number;
  readonly minor: number;
}

/** The user's decisions in the session and how many were hinted (REQ-044.3, REQ-040.4). */
export interface HintCounts {
  /** Decision records with hinted true; 0 ≤ hinted ≤ decisions. */
  readonly hinted: number;
  /** All of the user's decision records in the session's stored hands; ≥ 0. */
  readonly decisions: number;
}

/** The result of SessionEnder.endPausedSessions. */
export interface PausedSessionsEnd {
  /** The confirmed session's report; null if it had 0 hands (deleted) or was absent. */
  readonly report: SessionReport | null;
  /** One error per older unended session that could not be ended (left unchanged). */
  readonly rejected: readonly Error[];
}

export interface SessionEnder {
  /** Ends the stored session in one strict transaction over `sessions` and `reports`. Absent → resolves null,
   *  writes nothing. handsPlayed 0 → deletes the session record, resolves null. Otherwise puts the stored
   *  value with `endedAt`, adds sessionReport(...) and resolves that report once complete. Rejects (nothing
   *  changed) if the stored session fails parseSessionRecord (RangeError), or if the stored session is already
   *  ended or a report for the id exists (DOMException 'ConstraintError'). */
  endSession(sessionId: string, endedAt: Date): Promise<SessionReport | null>;
  /** Ends `sessionId` at `endedAt` (as endSession), then every other valid unended stored session at its own
   *  updatedAt, each in its own transaction. Rejects (nothing changed) only if ending `sessionId` fails;
   *  failures ending the others are returned in `rejected`. Invalid stored values are skipped. */
  endPausedSessions(sessionId: string, endedAt: Date): Promise<PausedSessionsEnd>;
  /** parseSessionReport of the stored value, or null if absent. */
  getReport(sessionId: string): Promise<SessionReport | null>;
}

export interface ReportTile {
  readonly key: 'result' | 'bb100' | 'rebuys';
  readonly label: string;
  readonly value: string;
}

export interface RateTile {
  readonly key: 'hands' | 'major' | 'minor';
  readonly label: string;
  readonly value: string;
}

export interface HintTile {
  readonly label: 'Hints used';
  /** "40 of 320 decisions (12.5%)", "1 of 1 decision (100.0%)", "0 of 0 decisions (0.0%)". */
  readonly value: string;
}

export interface ReportView {
  /** "Cash · 6 players · $4/$8 · 214 hands" */
  readonly header: string;
  /** Result, BB/100, Rebuys for cash; none for a sit-and-go. */
  readonly tiles: readonly ReportTile[];
}

const SESSION_ID = /^[0-9a-f]{32}$/;

function invalid(field: string): RangeError {
  return new RangeError(`Invalid session report: ${field}`);
}

/** Big bets won per 100 hands, rounded half away from zero to one decimal with integer arithmetic; 0, never
 *  -0, when it rounds to zero. */
export function bbPer100(result: number, bigBet: number, hands: number): number {
  const d = bigBet * hands;
  const tenths = Math.sign(result) * Math.floor((2000 * Math.abs(result) + d) / (2 * d));
  return tenths === 0 ? 0 : tenths / 10;
}

/** The report of `session` ended at `endedAt`, with `style` summed over `hands` (absent when `hands` is
 *  omitted or empty), and `errors`, `leakCounts` and `hints` counted from their decisions (absent unless every hand
 *  carries them). RangeError('Invalid session report: <field>') for 0 hands played or an invalid Date. */
export function sessionReport(
  session: SessionRecord,
  endedAt: Date,
  hands: readonly ReportHand[] = [],
): SessionReport {
  if (session.handsPlayed === 0) throw invalid('handsPlayed');
  if (Number.isNaN(endedAt.getTime())) throw invalid('endedAt');
  const { config, handsPlayed, rebuys } = session;
  const { smallBet, bigBet } = tableStake(config);
  let cash: CashResult | null = null;
  if (config.gameType === 'cash') {
    const finalStack = (session.seats.find((s) => s.kind === 'user') as { stack: number }).stack;
    const amount = buyIn({ smallBet, bigBet });
    const result = finalStack - amount * (1 + rebuys);
    cash = {
      buyIn: amount,
      rebuys,
      finalStack,
      result,
      bbPer100: bbPer100(result, bigBet, handsPlayed),
    };
  }
  const report: SessionReport = {
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    endedAt: endedAt.toISOString(),
    gameType: config.gameType,
    players: config.players,
    stake: { smallBet, bigBet },
    handsPlayed,
    cash,
  };
  if (hands.length === 0) return report;
  const style = hands
    .map((hand) => handStyleCounts(hand, hand.userSeat))
    .reduce((total, counts) => addStyleCounts(total, counts));
  if (!hands.every((hand) => hand.decisions !== undefined)) return { ...report, style };
  const decisions = hands.flatMap((hand) => hand.decisions as readonly ReportDecision[]);
  const errors = { major: 0, minor: 0 };
  for (const { grade, hinted } of decisions) {
    if (hinted) continue;
    if (grade.grade === 'major') errors.major++;
    else if (grade.grade === 'minor') errors.minor++;
  }
  const leakCounts = categoryCounts(
    hands.flatMap((hand) =>
      handCategoryDecisions({ ...hand, decisions: hand.decisions as readonly ReportDecision[] }),
    ),
  );
  const hints = { hinted: decisions.filter((d) => d.hinted).length, decisions: decisions.length };
  return { ...report, style, errors, leakCounts, hints };
}

type Fields = Readonly<Record<string, unknown>>;

function object(value: unknown, field: string): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(field);
  return value as Fields;
}

function whole(value: unknown, field: string, min: number, max?: number): number {
  if (!isWhole(value, min, max)) throw invalid(field);
  return value;
}

function isoString(value: unknown, field: string): void {
  if (
    typeof value !== 'string' ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    throw invalid(field);
  }
}

/** Validates stored style counts in StyleCounts field order; each inequality fails on its left-hand field. */
function parseStyle(value: unknown, handsPlayed: number): void {
  const style = object(value, 'style');
  const count = (field: keyof StyleCounts, max = Number.MAX_SAFE_INTEGER): number =>
    whole(style[field], `style.${field}`, 0, max);
  const dealt = whole(style.handsDealt, 'style.handsDealt', 1, handsPlayed);
  const voluntary = count('voluntary', dealt);
  count('preflopRaised', voluntary);
  count('postflopAggressive');
  count('postflopCalls');
  const sawFlop = count('sawFlop', dealt);
  const showdowns = count('showdowns', sawFlop);
  count('showdownsWon', showdowns);
}

function parseErrors(value: unknown): void {
  const errors = object(value, 'errors');
  whole(errors.major, 'errors.major', 0, Number.MAX_SAFE_INTEGER);
  whole(errors.minor, 'errors.minor', 0, Number.MAX_SAFE_INTEGER);
}

/** Validates stored leak counts: categories known and in strictly increasing LEAK_CATEGORIES order,
 *  1 ≤ decisions, errors ≤ decisions, major ≤ errors. */
function parseLeakCounts(value: unknown): void {
  if (!Array.isArray(value)) throw invalid('leakCounts');
  const order = LEAK_CATEGORIES.map((category) => category.id as string);
  let previous = -1;
  value.forEach((element: unknown, i) => {
    const path = `leakCounts[${i}]`;
    const count = object(element, path);
    const index = typeof count.category === 'string' ? order.indexOf(count.category) : -1;
    if (index <= previous) throw invalid(`${path}.category`);
    previous = index;
    const decisions = whole(count.decisions, `${path}.decisions`, 1, Number.MAX_SAFE_INTEGER);
    const errors = whole(count.errors, `${path}.errors`, 0, decisions);
    whole(count.major, `${path}.major`, 0, errors);
  });
}

function parseHints(value: unknown): void {
  const hints = object(value, 'hints');
  const decisions = whole(hints.decisions, 'hints.decisions', 0, Number.MAX_SAFE_INTEGER);
  whole(hints.hinted, 'hints.hinted', 0, decisions);
}

/** Validates an untrusted stored report; returns it typed, not copied. Unknown extra properties are ignored.
 *  `hints` without `errors` is rejected: the app never writes it and it would show no tile.
 *  RangeError('Invalid session report: <field>'). */
export function parseSessionReport(value: unknown): SessionReport {
  const report = object(value, 'report');
  if (typeof report.sessionId !== 'string' || !SESSION_ID.test(report.sessionId)) {
    throw invalid('sessionId');
  }
  isoString(report.startedAt, 'startedAt');
  isoString(report.endedAt, 'endedAt');
  if (report.gameType !== 'cash' && report.gameType !== 'sit-and-go') throw invalid('gameType');
  whole(report.players, 'players', 2, 10);
  const stake = object(report.stake, 'stake');
  const smallBet = whole(stake.smallBet, 'stake.smallBet', 1);
  const bigBet = whole(stake.bigBet, 'stake.bigBet', 1);
  if (bigBet !== 2 * smallBet) throw invalid('stake.bigBet');
  const hands = whole(report.handsPlayed, 'handsPlayed', 1, MAX_SESSION_COUNT);
  if (report.gameType === 'sit-and-go') {
    if (report.cash !== null) throw invalid('cash');
  } else {
    const cash = object(report.cash, 'cash');
    const amount = whole(cash.buyIn, 'cash.buyIn', 0);
    if (amount !== buyIn({ smallBet, bigBet })) throw invalid('cash.buyIn');
    const rebuys = whole(cash.rebuys, 'cash.rebuys', 0, MAX_SESSION_COUNT);
    const finalStack = whole(cash.finalStack, 'cash.finalStack', 0);
    const result = finalStack - amount * (1 + rebuys);
    if (cash.result !== result) throw invalid('cash.result');
    if (cash.bbPer100 !== bbPer100(result, bigBet, hands)) throw invalid('cash.bbPer100');
  }
  if (report.style !== undefined) parseStyle(report.style, hands);
  if (report.errors !== undefined) parseErrors(report.errors);
  if (report.leakCounts !== undefined) parseLeakCounts(report.leakCounts);
  if (report.hints !== undefined) {
    if (report.errors === undefined) throw invalid('hints');
    parseHints(report.hints);
  }
  return value as SessionReport;
}

/** "+$46", "-$40", "$0". */
export function signedDollars(amount: number): string {
  if (amount === 0) return '$0';
  return `${amount > 0 ? '+' : '-'}$${Math.abs(amount)}`;
}

/** "+2.7", "-5.0", "0.0". */
export function signedTenths(value: number): string {
  if (value === 0) return '0.0';
  return `${value > 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}`;
}

/** The report screen's header line and KPI tiles (A-2, A-8). */
export function reportView(report: SessionReport): ReportView {
  const { gameType, players, stake, handsPlayed, cash } = report;
  const limits =
    gameType === 'cash'
      ? `$${stake.smallBet}/$${stake.bigBet}`
      : `${stake.smallBet}/${stake.bigBet}`;
  const hands = handsPlayed === 1 ? '1 hand' : `${handsPlayed} hands`;
  return {
    header: `${GAME_LABEL[gameType]} · ${players} players · ${limits} · ${hands}`,
    tiles:
      cash === null
        ? []
        : [
            { key: 'result', label: 'Result', value: signedDollars(cash.result) },
            { key: 'bb100', label: 'BB/100', value: signedTenths(cash.bbPer100) },
            { key: 'rebuys', label: 'Rebuys', value: String(cash.rebuys) },
          ],
  };
}

/** Hands played and the Major / Minor error rates per 100 hands (TASK-10.4); [] for a report without
 *  `errors`. */
export function rateTiles(report: SessionReport): readonly RateTile[] {
  const { handsPlayed, errors } = report;
  if (errors === undefined) return [];
  const rate = (count: number): string => bbPer100(count, 1, handsPlayed).toFixed(1);
  return [
    { key: 'hands', label: 'Hands played', value: String(handsPlayed) },
    { key: 'major', label: 'Major errors /100', value: rate(errors.major) },
    { key: 'minor', label: 'Minor errors /100', value: rate(errors.minor) },
  ];
}

/** The hint-usage tile (TASK-10.7 D-2), or null for a report without `hints`. */
export function hintTile(report: SessionReport): HintTile | null {
  if (report.hints === undefined) return null;
  const { hinted, decisions } = report.hints;
  const pct = decisions === 0 ? '0.0' : bbPer100(hinted, 1, decisions).toFixed(1);
  const noun = decisions === 1 ? 'decision' : 'decisions';
  return { label: 'Hints used', value: `${hinted} of ${decisions} ${noun} (${pct}%)` };
}
