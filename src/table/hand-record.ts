import type { Card } from '../engine/cards';
import { isReplayCode, type ReplayCode } from '../engine/deck';
import type { ActionRecord, HandResult, SeatNumber, Stakes } from '../engine/hand';
import type { EarlierShowdown } from '../engine/player-view';
import type { PausedSession, SessionRecord } from './session-record';
import {
  BOT_STYLES,
  LINE_UPS,
  isSeatName,
  tableStake,
  type BotStyle,
  type CompletedHand,
  type GameType,
  type LineUpName,
  type SessionConfig,
  type Stake,
} from './session';

export interface HandRecordSeat {
  readonly seat: SeatNumber;
  readonly kind: 'user' | 'bot';
  /** Per-session bot id; null iff kind === 'user'. */
  readonly botId: number | null;
  readonly name: string;
  /** null iff kind === 'user'. */
  readonly style: BotStyle | null;
  readonly startingStack: number;
}

/** One completed hand as stored in IndexedDB (REQ-052.2). Satisfies StatHand. */
export interface HandRecord {
  /** 32 lowercase hex characters. */
  readonly sessionId: string;
  /** 1-based, as TableState.handNumber. */
  readonly handNumber: number;
  /** ISO-8601 UTC, e.g. '2026-11-17T14:32:05.000Z'. */
  readonly completedAt: string;
  readonly replayCode: ReplayCode;
  readonly gameType: GameType;
  /** The cash stake, or the sit-and-go level limits. */
  readonly stake: Stake;
  /** null for cash; the sit-and-go level. */
  readonly level: number | null;
  /** Blinds and bets actually played. */
  readonly stakes: Stakes;
  readonly lineUp: LineUpName;
  readonly button: SeatNumber;
  readonly userSeat: SeatNumber;
  /** Dealt-in seats, ascending seat order. */
  readonly seats: readonly HandRecordSeat[];
  readonly userHoleCards: readonly [Card, Card];
  /** Blinds first, then every action in order. */
  readonly actions: readonly ActionRecord[];
  readonly board: readonly Card[];
  /** null for a fold-out. */
  readonly shown: EarlierShowdown | null;
  readonly result: HandResult;
}

export interface HandRecordMeta {
  readonly sessionId: string;
  readonly handNumber: number;
  readonly config: SessionConfig;
  readonly completedAt: Date;
}

/** Add-only store of hand records: no update, put or delete (REQ-052.5/.6), plus one session record per
 *  session that is replaced as the session goes on (REQ-052.3). */
export interface HandStore {
  /** Adds a new record and, if given, puts `session`, in one transaction; resolves when it is complete
   *  (durable). Rejects with the IndexedDB error (name 'ConstraintError') if (sessionId, handNumber) already
   *  exists; then neither the stored record nor the stored session changes. */
  add(record: HandRecord, session?: SessionRecord): Promise<void>;
  /** Creates or replaces the session's record; resolves when the transaction is complete (durable). */
  putSession(session: SessionRecord): Promise<void>;
  /** The validated session record, or null if absent. Rejects with parseSessionRecord's RangeError if the
   *  stored value is invalid. */
  getSession(sessionId: string): Promise<SessionRecord | null>;
  /** The paused session (findPausedSession over every stored session value). Rejects only if the database
   *  cannot be read. */
  pausedSession(): Promise<PausedSession>;
  /** The validated record, or null if absent. Rejects with parseHandRecord's RangeError if the stored value is invalid. */
  get(sessionId: string, handNumber: number): Promise<HandRecord | null>;
  count(): Promise<number>;
}

const SESSION_ID = /^[0-9a-f]{32}$/;
const GAME_TYPES: readonly string[] = ['cash', 'sit-and-go'];
const STREETS: readonly string[] = ['preflop', 'flop', 'turn', 'river'];
const ACTION_TYPES: readonly string[] = [
  'small-blind',
  'big-blind',
  'fold',
  'check',
  'call',
  'bet',
  'raise',
];

function invalid(field: string): RangeError {
  return new RangeError(`Invalid hand record: ${field}`);
}

/** A safe integer in min..max (no coercion). */
export function isWhole(
  value: unknown,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): value is number {
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
}

/** Plain-data record; copies arrays/objects so the record shares nothing with live state.
 *  RangeError('Invalid hand record: <field>') on a bad sessionId, handNumber or invalid Date. */
export function handRecord(hand: CompletedHand, meta: HandRecordMeta): HandRecord {
  const { sessionId, handNumber, config, completedAt } = meta;
  if (!SESSION_ID.test(sessionId)) throw invalid('sessionId');
  if (!isWhole(handNumber, 1)) throw invalid('handNumber');
  if (Number.isNaN(completedAt.getTime())) throw invalid('completedAt');
  const stake = tableStake(config);
  return {
    sessionId,
    handNumber,
    completedAt: completedAt.toISOString(),
    replayCode: hand.replayCode,
    gameType: config.gameType,
    stake: { smallBet: stake.smallBet, bigBet: stake.bigBet },
    level: config.gameType === 'sit-and-go' ? 1 : null,
    stakes: { ...hand.stakes },
    lineUp: config.lineUp,
    button: hand.button,
    userSeat: hand.userSeat,
    seats: [...hand.seats]
      .sort((a, b) => a.seat - b.seat)
      .map(({ seat, kind, botId, name, style, startingStack }) => ({
        seat,
        kind,
        botId,
        name,
        style,
        startingStack,
      })),
    userHoleCards: [hand.userHoleCards[0], hand.userHoleCards[1]],
    actions: structuredClone(hand.actions),
    board: [...hand.board],
    shown: structuredClone(hand.shown),
    result: structuredClone(hand.result),
  };
}

type Fields = Readonly<Record<string, unknown>>;

/** A-5 bounds. */
const MAX_ACTIONS = 400;
const MAX_SEAT_ENTRIES = 10;

function object(value: unknown, field: string): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(field);
  return value as Fields;
}

/** A dense array of min..max entries; a hole is invalid as `<field>[i]`. */
function array(value: unknown, field: string, min = 0, max = Infinity): readonly unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw invalid(field);
  for (let i = 0; i < value.length; i++) {
    if (!(i in value)) throw invalid(`${field}[${i}]`);
  }
  return value;
}

function whole(value: unknown, field: string, min: number, max?: number): void {
  if (!isWhole(value, min, max)) throw invalid(field);
}

function oneOf(value: unknown, options: readonly unknown[], field: string): void {
  if (!options.includes(value)) throw invalid(field);
}

function cards(value: unknown, field: string, min: number, max: number): readonly Card[] {
  const list = array(value, field, min, max);
  list.forEach((card, i) => whole(card, `${field}[${i}]`, 0, 51));
  return list as readonly Card[];
}

/** A whole seat 1..10 that is one of the record's seats. */
function seatIn(value: unknown, seats: ReadonlySet<unknown>, field: string): void {
  whole(value, field, 1, 10);
  if (!seats.has(value)) throw invalid(field);
}

function seatAmount(value: unknown, field: string, seats: ReadonlySet<unknown>): void {
  const entry = object(value, field);
  seatIn(entry.seat, seats, `${field}.seat`);
  whole(entry.amount, `${field}.amount`, 0);
}

/** Each seat's one pair of hole cards: a pair is two different cards, and a seat shows the same pair (as a
 *  set) every time it appears. */
class HoleCards {
  readonly pairs = new Map<unknown, readonly Card[]>();

  add(seat: unknown, value: unknown, field: string): void {
    const pair = cards(value, field, 2, 2);
    if (pair[0] === pair[1]) throw invalid(field);
    const known = this.pairs.get(seat);
    if (known !== undefined && !pair.every((card) => known.includes(card))) throw invalid(field);
    this.pairs.set(seat, pair);
  }
}

/** The seat numbers; checks every seat entry. */
function checkSeats(value: unknown, userSeat: unknown): ReadonlySet<unknown> {
  const seen = new Set<unknown>();
  let users = 0;
  array(value, 'seats', 2, 10).forEach((item, i) => {
    const field = `seats[${i}]`;
    const seat = object(item, field);
    whole(seat.seat, `${field}.seat`, 1, 10);
    if (seen.has(seat.seat)) throw invalid(`${field}.seat`);
    seen.add(seat.seat);
    oneOf(seat.kind, ['user', 'bot'], `${field}.kind`);
    const isUser = seat.kind === 'user';
    if (isUser ? seat.botId !== null : !isWhole(seat.botId, 1)) throw invalid(`${field}.botId`);
    if (!isSeatName(seat.name)) throw invalid(`${field}.name`);
    if (isUser ? seat.style !== null : !BOT_STYLES.includes(seat.style as BotStyle)) {
      throw invalid(`${field}.style`);
    }
    whole(seat.startingStack, `${field}.startingStack`, 0);
    if (isUser) {
      users += 1;
      if (seat.seat !== userSeat) throw invalid(`${field}.seat`);
    }
  });
  if (users !== 1) throw invalid('seats');
  return seen;
}

function checkResult(value: unknown, seats: ReadonlySet<unknown>, holeCards: HoleCards): void {
  const result = object(value, 'result');
  oneOf(result.endedBy, ['fold', 'showdown'], 'result.endedBy');
  array(result.showdown, 'result.showdown', 0, MAX_SEAT_ENTRIES).forEach((item, i) => {
    const field = `result.showdown[${i}]`;
    const shown = object(item, field);
    seatIn(shown.seat, seats, `${field}.seat`);
    holeCards.add(shown.seat, shown.holeCards, `${field}.holeCards`);
    whole(shown.rank, `${field}.rank`, 0);
  });
  array(result.awards, 'result.awards', 0, MAX_SEAT_ENTRIES).forEach((item, i) => {
    const field = `result.awards[${i}]`;
    const award = object(item, field);
    whole(award.pot, `${field}.pot`, 0);
    whole(award.amount, `${field}.amount`, 0);
    array(award.winners, `${field}.winners`, 0, MAX_SEAT_ENTRIES).forEach((winner, w) =>
      seatAmount(winner, `${field}.winners[${w}]`, seats),
    );
  });
  if (result.returned !== undefined) seatAmount(result.returned, 'result.returned', seats);
}

/** Validates an untrusted stored value; returns it typed (not copied). Extra properties are ignored.
 *  Besides each field's shape it checks the fields against each other: every seat named is a dealt-in seat,
 *  each seat shows one pair (the user's is userHoleCards), no card appears twice, and the level matches the
 *  game type. RangeError('Invalid hand record: <field>') naming the first failing field. */
export function parseHandRecord(value: unknown): HandRecord {
  const record = object(value, 'record');
  if (typeof record.sessionId !== 'string' || !SESSION_ID.test(record.sessionId)) {
    throw invalid('sessionId');
  }
  whole(record.handNumber, 'handNumber', 1);
  const { completedAt } = record;
  if (
    typeof completedAt !== 'string' ||
    Number.isNaN(Date.parse(completedAt)) ||
    new Date(completedAt).toISOString() !== completedAt
  ) {
    throw invalid('completedAt');
  }
  if (!isReplayCode(record.replayCode)) throw invalid('replayCode');
  oneOf(record.gameType, GAME_TYPES, 'gameType');
  const stake = object(record.stake, 'stake');
  whole(stake.smallBet, 'stake.smallBet', 1);
  whole(stake.bigBet, 'stake.bigBet', 1);
  if (record.gameType === 'cash' ? record.level !== null : !isWhole(record.level, 1)) {
    throw invalid('level');
  }
  const stakes = object(record.stakes, 'stakes');
  for (const key of ['smallBlind', 'bigBlind', 'smallBet', 'bigBet']) {
    whole(stakes[key], `stakes.${key}`, 0);
  }
  oneOf(record.lineUp, LINE_UPS, 'lineUp');
  whole(record.button, 'button', 1, 10);
  whole(record.userSeat, 'userSeat', 1, 10);
  const seats = checkSeats(record.seats, record.userSeat);
  if (!seats.has(record.button)) throw invalid('button');
  const holeCards = new HoleCards();
  holeCards.add(record.userSeat, record.userHoleCards, 'userHoleCards');
  array(record.actions, 'actions', 0, MAX_ACTIONS).forEach((item, i) => {
    const field = `actions[${i}]`;
    const action = object(item, field);
    oneOf(action.street, STREETS, `${field}.street`);
    seatIn(action.seat, seats, `${field}.seat`);
    oneOf(action.type, ACTION_TYPES, `${field}.type`);
    whole(action.amount, `${field}.amount`, 0);
    whole(action.added, `${field}.added`, 0);
  });
  const board = cards(record.board, 'board', 0, 5);
  if (record.shown !== null) {
    const shown = object(record.shown, 'shown');
    array(shown.shown, 'shown.shown', 0, MAX_SEAT_ENTRIES).forEach((item, i) => {
      const field = `shown.shown[${i}]`;
      const hand = object(item, field);
      seatIn(hand.seat, seats, `${field}.seat`);
      holeCards.add(hand.seat, hand.holeCards, `${field}.holeCards`);
    });
  }
  checkResult(record.result, seats, holeCards);
  const dealt = [...board, ...[...holeCards.pairs.values()].flat()];
  if (new Set(dealt).size !== dealt.length) throw invalid('cards');
  return value as HandRecord;
}
