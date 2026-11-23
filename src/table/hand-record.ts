import type { Card } from '../engine/cards';
import { isReplayCode, type ReplayCode } from '../engine/deck';
import type { ActionRecord, HandResult, SeatNumber, Stakes } from '../engine/hand';
import type { EarlierShowdown } from '../engine/player-view';
import {
  BOT_STYLES,
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

/** Add-only store of hand records: no update, put or delete (REQ-052.5/.6). */
export interface HandStore {
  /** Adds a new record; resolves when the transaction is complete (durable). Rejects with the IndexedDB
   *  error (name 'ConstraintError') if (sessionId, handNumber) already exists; the stored record is unchanged. */
  add(record: HandRecord): Promise<void>;
  /** The validated record, or null if absent. Rejects with parseHandRecord's RangeError if the stored value is invalid. */
  get(sessionId: string, handNumber: number): Promise<HandRecord | null>;
  count(): Promise<number>;
}

const SESSION_ID = /^[0-9a-f]{32}$/;
const GAME_TYPES: readonly string[] = ['cash', 'sit-and-go'];
const LINE_UPS: readonly string[] = ['Mixed', 'Tough', 'Soft', 'Custom'];
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

function isWhole(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number {
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

function object(value: unknown, field: string): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(field);
  return value as Fields;
}

function array(value: unknown, field: string, min = 0, max = Infinity): readonly unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw invalid(field);
  return value;
}

function whole(value: unknown, field: string, min: number, max?: number): void {
  if (!isWhole(value, min, max)) throw invalid(field);
}

function oneOf(value: unknown, options: readonly unknown[], field: string): void {
  if (!options.includes(value)) throw invalid(field);
}

function cards(value: unknown, field: string, min: number, max: number): void {
  array(value, field, min, max).forEach((card, i) => whole(card, `${field}[${i}]`, 0, 51));
}

function seatAmount(value: unknown, field: string): void {
  const entry = object(value, field);
  whole(entry.seat, `${field}.seat`, 1, 10);
  whole(entry.amount, `${field}.amount`, 0);
}

function checkSeats(value: unknown, userSeat: unknown): void {
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
    if (typeof seat.name !== 'string' || seat.name === '') throw invalid(`${field}.name`);
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
}

function checkResult(value: unknown): void {
  const result = object(value, 'result');
  oneOf(result.endedBy, ['fold', 'showdown'], 'result.endedBy');
  array(result.showdown, 'result.showdown').forEach((item, i) => {
    const field = `result.showdown[${i}]`;
    const shown = object(item, field);
    whole(shown.seat, `${field}.seat`, 1, 10);
    cards(shown.holeCards, `${field}.holeCards`, 2, 2);
    whole(shown.rank, `${field}.rank`, 0);
  });
  array(result.awards, 'result.awards').forEach((item, i) => {
    const field = `result.awards[${i}]`;
    const award = object(item, field);
    whole(award.pot, `${field}.pot`, 0);
    whole(award.amount, `${field}.amount`, 0);
    array(award.winners, `${field}.winners`).forEach((winner, w) =>
      seatAmount(winner, `${field}.winners[${w}]`),
    );
  });
  if (result.returned !== undefined) seatAmount(result.returned, 'result.returned');
}

/** Validates an untrusted stored value; returns it typed (not copied). Extra properties are ignored.
 *  RangeError('Invalid hand record: <field>') naming the first failing field. */
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
  if (typeof record.replayCode !== 'string' || !isReplayCode(record.replayCode)) {
    throw invalid('replayCode');
  }
  oneOf(record.gameType, GAME_TYPES, 'gameType');
  const stake = object(record.stake, 'stake');
  whole(stake.smallBet, 'stake.smallBet', 1);
  whole(stake.bigBet, 'stake.bigBet', 1);
  if (record.level !== null) whole(record.level, 'level', 1);
  const stakes = object(record.stakes, 'stakes');
  for (const key of ['smallBlind', 'bigBlind', 'smallBet', 'bigBet']) {
    whole(stakes[key], `stakes.${key}`, 0);
  }
  oneOf(record.lineUp, LINE_UPS, 'lineUp');
  whole(record.button, 'button', 1, 10);
  whole(record.userSeat, 'userSeat', 1, 10);
  checkSeats(record.seats, record.userSeat);
  cards(record.userHoleCards, 'userHoleCards', 2, 2);
  array(record.actions, 'actions').forEach((item, i) => {
    const field = `actions[${i}]`;
    const action = object(item, field);
    oneOf(action.street, STREETS, `${field}.street`);
    whole(action.seat, `${field}.seat`, 1, 10);
    oneOf(action.type, ACTION_TYPES, `${field}.type`);
    whole(action.amount, `${field}.amount`, 0);
    whole(action.added, `${field}.added`, 0);
  });
  cards(record.board, 'board', 0, 5);
  if (record.shown !== null) {
    const shown = object(record.shown, 'shown');
    array(shown.shown, 'shown.shown').forEach((item, i) => {
      const field = `shown.shown[${i}]`;
      const hand = object(item, field);
      whole(hand.seat, `${field}.seat`, 1, 10);
      cards(hand.holeCards, `${field}.holeCards`, 2, 2);
    });
  }
  checkResult(record.result);
  return value as HandRecord;
}
