import { assertChips, type SeatNumber } from '../engine/hand';
import { handRecord, isWhole, type HandRecord } from './hand-record';
import {
  BOT_STYLES,
  MAX_SESSION_COUNT,
  assertSessionConfig,
  completedHand,
  isSeatName,
  nextHand,
  nextStep,
  stakesFor,
  tableStake,
  type BotStyle,
  type SessionConfig,
  type SessionSeat,
  type TableState,
} from './session';

export interface SessionRecordSeat {
  readonly seat: SeatNumber;
  readonly kind: 'user' | 'bot';
  /** null iff kind === 'user'. */
  readonly botId: number | null;
  /** 1 to 40 characters. */
  readonly name: string;
  /** null iff kind === 'user'. */
  readonly style: BotStyle | null;
  /** Chips before the next hand: a safe integer of at least 1, except 0 for the user seat of a cash session
   *  waiting at Rebuy / Leave table (D-1). */
  readonly stack: number;
}

/** A session as stored in IndexedDB (REQ-052.3): the state ready for the next hand (D-3). Never holds a hand
 *  in progress or its actions (D-4). */
export interface SessionRecord {
  /** 32 lowercase hex characters. */
  readonly sessionId: string;
  /** ISO-8601 UTC: when the table started. */
  readonly startedAt: string;
  /** ISO-8601 UTC: the last write (the completion time of the last hand). */
  readonly updatedAt: string;
  /** The starting configuration as played. */
  readonly config: SessionConfig;
  /** Completed hands; 0 in the start record. */
  readonly handsPlayed: number;
  /** Ascending seat order; the same seat numbers and kinds as config.seats. */
  readonly seats: readonly SessionRecordSeat[];
  /** Dealer button of the next hand to be dealt. */
  readonly button: SeatNumber;
  /** The user's rebuys; 0..MAX_SESSION_COUNT, stored with the next completed hand (A-1). */
  readonly rebuys: number;
  /** null for cash; the sit-and-go level (1 until TASK-5.4). */
  readonly level: number | null;
  /** Position of the next replacement name; 0..MAX_SESSION_COUNT (AC#7). */
  readonly nextBotName: number;
  readonly nextBotId: number;
  /** ISO-8601 UTC: when the session was ended; absent or null while not ended. Written only by E10 (D-1). */
  readonly endedAt?: string | null;
}

export { MAX_SESSION_COUNT };

export interface PausedSession {
  /** The paused session, already parsed; null if none. */
  readonly session: SessionRecord | null;
  /** One per stored value that failed parseSessionRecord. */
  readonly rejected: readonly Error[];
}

export interface SessionMeta {
  readonly sessionId: string;
  readonly startedAt: Date;
  readonly updatedAt: Date;
}

const SESSION_ID = /^[0-9a-f]{32}$/;

function invalid(field: string): RangeError {
  return new RangeError(`Invalid session record: ${field}`);
}

function isoDate(date: Date, field: string): string {
  if (Number.isNaN(date.getTime())) throw invalid(field);
  return date.toISOString();
}

/** Plain-data record of `table`, which must be ready to deal (no hand). handsPlayed = handNumber - 1.
 *  RangeError('Invalid session record: <field>') on a dealt table, a bad session id or an invalid Date. */
export function sessionRecord(table: TableState, meta: SessionMeta): SessionRecord {
  if (table.hand !== null) throw invalid('hand');
  if (!SESSION_ID.test(meta.sessionId)) throw invalid('sessionId');
  const { config } = table;
  return {
    sessionId: meta.sessionId,
    startedAt: isoDate(meta.startedAt, 'startedAt'),
    updatedAt: isoDate(meta.updatedAt, 'updatedAt'),
    config: structuredClone(config),
    handsPlayed: table.handNumber - 1,
    seats: [...table.seats]
      .sort((a, b) => a.seat - b.seat)
      .map(({ seat, kind, name, style }) => ({
        seat,
        kind,
        botId: table.botIds[seat] ?? null,
        name,
        style,
        stack: (table.stacks.find((s) => s.seat === seat) as { stack: number }).stack,
      })),
    button: table.button,
    rebuys: table.rebuys,
    level: config.gameType === 'sit-and-go' ? 1 : null,
    nextBotName: table.nextBotName,
    nextBotId: table.nextBotId,
  };
}

/** The finished hand's record and the session ready for the next hand (nextHand), written together (D-2).
 *  RangeError if the hand is not done. */
export function handWrite(
  table: TableState,
  meta: { readonly sessionId: string; readonly startedAt: Date; readonly completedAt: Date },
): { record: HandRecord; session: SessionRecord } {
  const done = nextStep(table) === 'done' ? completedHand(table) : null;
  if (done === null) throw new RangeError('Not a completed hand');
  const { sessionId, startedAt, completedAt } = meta;
  return {
    record: handRecord(done, {
      sessionId,
      handNumber: table.handNumber,
      config: table.config,
      completedAt,
    }),
    session: sessionRecord(nextHand(table), { sessionId, startedAt, updatedAt: completedAt }),
  };
}

type Fields = Readonly<Record<string, unknown>>;

function object(value: unknown, field: string): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(field);
  return value as Fields;
}

function whole(value: unknown, field: string, min: number, max?: number): void {
  if (!isWhole(value, min, max)) throw invalid(field);
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

/** Validates untrusted stored data before any table is built from it; returns it typed, not copied. Unknown
 *  extra properties are ignored, but a `hand` or `actions` property is rejected: an in-progress hand is never
 *  stored or restored (D-4). RangeError('Invalid session record: <field>'), or assertSessionConfig's or
 *  assertChips's RangeError. */
export function parseSessionRecord(value: unknown): SessionRecord {
  const record = object(value, 'record');
  if (Object.hasOwn(record, 'hand')) throw invalid('hand');
  if (Object.hasOwn(record, 'actions')) throw invalid('actions');
  if (typeof record.sessionId !== 'string' || !SESSION_ID.test(record.sessionId)) {
    throw invalid('sessionId');
  }
  isoString(record.startedAt, 'startedAt');
  isoString(record.updatedAt, 'updatedAt');
  if (Object.hasOwn(record, 'endedAt') && record.endedAt !== null) {
    isoString(record.endedAt, 'endedAt');
  }
  const { config } = record;
  assertSessionConfig(config);
  whole(record.handsPlayed, 'handsPlayed', 0, MAX_SESSION_COUNT);
  whole(record.rebuys, 'rebuys', 0, MAX_SESSION_COUNT);
  whole(record.nextBotName, 'nextBotName', 0, MAX_SESSION_COUNT);
  whole(record.nextBotId, 'nextBotId', 1, MAX_SESSION_COUNT);
  const nextBotId = record.nextBotId as number;
  if (config.gameType === 'cash' ? record.level !== null : !isWhole(record.level, 1)) {
    throw invalid('level');
  }
  const { seats } = record;
  if (!Array.isArray(seats) || seats.length !== config.players) throw invalid('seats');
  const botIds = new Set<unknown>();
  const chips: { seat: SeatNumber; stack: number }[] = [];
  for (let i = 0; i < seats.length; i++) {
    const field = `seats[${i}]`;
    if (!(i in seats)) throw invalid(field);
    const seat = object(seats[i], field);
    const expected = config.seats[i] as SessionSeat;
    if (seat.seat !== expected.seat) throw invalid(`${field}.seat`);
    if (seat.kind !== expected.kind) throw invalid(`${field}.kind`);
    if (seat.kind === 'user') {
      if (seat.botId !== null) throw invalid(`${field}.botId`);
      if (seat.style !== null) throw invalid(`${field}.style`);
    } else {
      if (!isWhole(seat.botId, 1, nextBotId - 1) || botIds.has(seat.botId)) {
        throw invalid(`${field}.botId`);
      }
      botIds.add(seat.botId);
      if (!BOT_STYLES.includes(seat.style as BotStyle)) throw invalid(`${field}.style`);
    }
    if (!isSeatName(seat.name)) throw invalid(`${field}.name`);
    // The stack rules are createHand's (assertChips below), with its messages. A cash user on 0 is busted,
    // waiting at Rebuy / Leave table (D-1), and is the one seat left out.
    if (config.gameType === 'cash' && seat.kind === 'user' && seat.stack === 0) continue;
    chips.push({ seat: expected.seat, stack: seat.stack as number });
  }
  if (!config.seats.some(({ seat }) => seat === record.button)) throw invalid('button');
  assertChips(stakesFor(tableStake(config)), chips);
  return value as SessionRecord;
}

/** parseSessionRecord, then the table ready to deal hand handsPlayed + 1. Never restores a hand or applies
 *  an action. */
export function restoreSession(value: unknown): TableState {
  const record = parseSessionRecord(value);
  const botIds: Record<number, number> = {};
  for (const { seat, botId } of record.seats) {
    if (botId !== null) botIds[seat] = botId;
  }
  return {
    config: record.config,
    stakes: stakesFor(tableStake(record.config)),
    seats: record.seats.map(({ seat, name, kind, style }) => ({ seat, name, kind, style })),
    stacks: record.seats.map(({ seat, stack }) => ({ seat, stack })),
    hand: null,
    replayCode: null,
    userDecisions: [],
    handNumber: record.handsPlayed + 1,
    button: record.button,
    nextBotName: record.nextBotName,
    botIds,
    nextBotId: record.nextBotId,
    rebuys: record.rebuys,
  };
}

const isEnded = (record: SessionRecord): boolean =>
  record.endedAt !== undefined && record.endedAt !== null;

/** Later updatedAt, then later startedAt, then greater sessionId (A-1). */
function isLater(a: SessionRecord, b: SessionRecord): boolean {
  const updated = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
  if (updated !== 0) return updated > 0;
  const started = Date.parse(a.startedAt) - Date.parse(b.startedAt);
  if (started !== 0) return started > 0;
  return a.sessionId > b.sessionId;
}

/** Parses each stored value; invalid ones are collected in `rejected` and ended ones dropped. The paused
 *  session is the latest of the rest (A-1). Never throws. */
export function findPausedSession(values: readonly unknown[]): PausedSession {
  let session: SessionRecord | null = null;
  const rejected: Error[] = [];
  for (const value of values) {
    let record: SessionRecord;
    try {
      record = parseSessionRecord(value);
    } catch (error) {
      rejected.push(error instanceof Error ? error : new Error(String(error)));
      continue;
    }
    if (!isEnded(record) && (session === null || isLater(record, session))) session = record;
  }
  return { session, rejected };
}
