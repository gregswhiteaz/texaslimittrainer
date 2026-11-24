import { isWhole } from './hand-record';
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
   *  changed) if the stored session fails parseSessionRecord (RangeError) or a report for the id exists
   *  (DOMException 'ConstraintError'). */
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

/** The report of `session` ended at `endedAt`. RangeError('Invalid session report: <field>') for 0 hands
 *  played or an invalid Date. */
export function sessionReport(session: SessionRecord, endedAt: Date): SessionReport {
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
  return {
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    endedAt: endedAt.toISOString(),
    gameType: config.gameType,
    players: config.players,
    stake: { smallBet, bigBet },
    handsPlayed,
    cash,
  };
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

/** Validates an untrusted stored report; returns it typed, not copied. Unknown extra properties are ignored.
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
