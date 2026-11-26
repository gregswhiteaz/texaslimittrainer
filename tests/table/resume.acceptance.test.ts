import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveLineUpName, lineUpSessionConfig } from '../../src/bots/lineup';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import {
  DEFAULT_SESSION_CONFIG,
  configForGameType,
  configForLineUp,
  configWithSeatStyle,
  dealHand,
  nextHand,
  seatSession,
  type BotStyle,
  type SessionConfig,
  type TableState,
} from '../../src/table/session';
import {
  MAX_SESSION_COUNT,
  findPausedSession,
  handWrite,
  parseSessionRecord,
  restoreSession,
  sessionRecord,
  type SessionRecord,
} from '../../src/table/session-record';
import { headerText, resumeSummary } from '../../src/table/table-view';
import { playSession } from '../support/session-play';

vi.setConfig({ testTimeout: 30_000 });

vi.mock('../../src/bots/lineup', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/bots/lineup')>();
  return {
    ...real,
    resolveLineUpName: vi.fn(real.resolveLineUpName),
    lineUpSessionConfig: vi.fn(real.lineUpSessionConfig),
  };
});

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-23T10:00:00Z');
const codeFor = (hand: number): ReplayCode => replayCodeFromWords([0x9e3779b9, hand, 2, 3]);

type Json = Record<string, unknown>;

function startRecord(config: Partial<SessionConfig>, handsPlayed = 0): SessionRecord {
  const table = { ...seatSession(config), handNumber: handsPlayed + 1 };
  return sessionRecord(table, { sessionId: SESSION, startedAt: STARTED, updatedAt: STARTED });
}

function rangeError(run: () => unknown): RangeError {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(RangeError);
    return error as RangeError;
  }
  throw new Error('Expected a RangeError');
}

/** Restore, parse and findPausedSession all reject `bad` with `message`. */
function expectRejected(bad: unknown, message: string): void {
  expect(rangeError(() => restoreSession(bad)).message).toBe(message);
  expect(rangeError(() => parseSessionRecord(bad)).message).toBe(message);
  const { session, rejected } = findPausedSession([bad]);
  expect(session).toBeNull();
  expect(rejected).toHaveLength(1);
  expect(rejected[0]).toBeInstanceOf(RangeError);
  expect(rejected[0]?.message).toBe(message);
}

/** The session record after the last of `played` (the state ready for the next hand). */
function recordAfter(played: readonly TableState[]): SessionRecord {
  const last = played.at(-1) as TableState;
  return handWrite(last, {
    sessionId: SESSION,
    startedAt: STARTED,
    completedAt: new Date(STARTED.getTime() + last.handNumber * 60_000),
  }).session;
}

const ninePlayerCustom = (button: number): SessionConfig => {
  const tens = configForGameType(DEFAULT_SESSION_CONFIG, 'cash', { smallBet: 10, bigBet: 20 });
  const mixed = configForLineUp(tens, 9, 'Mixed');
  const seat2 = mixed.seats.find((s) => s.seat === 2)?.style as BotStyle;
  const custom = configWithSeatStyle(mixed, 'Mixed', 2, seat2 === 'Rock' ? 'Maniac' : 'Rock');
  return { ...custom, button: button as SessionConfig['button'] };
};

describe('resume acceptance', () => {
  beforeEach(() => {
    vi.mocked(resolveLineUpName).mockClear();
    vi.mocked(lineUpSessionConfig).mockClear();
  });

  it('the resume summary shows game type, players, stake and hands played', () => {
    expect(resumeSummary(startRecord({}, 132))).toBe(
      'Cash · 6 players · $4/$8 · 132 hands · paused',
    );
    expect(resumeSummary(startRecord({}, 1))).toBe('Cash · 6 players · $4/$8 · 1 hand · paused');
    expect(resumeSummary(startRecord({}, 0))).toBe('Cash · 6 players · $4/$8 · 0 hands · paused');
    expect(resumeSummary(startRecord(ninePlayerCustom(1), 25))).toBe(
      'Cash · 9 players · $10/$20 · 25 hands · paused',
    );
    expect(resumeSummary(startRecord({ gameType: 'sit-and-go' }, 3))).toBe(
      'Sit-and-go · 6 players · 20/40 · 3 hands · paused',
    );
    expect(headerText(DEFAULT_SESSION_CONFIG, 11)).toBe('Cash · 6 players · $4/$8 · Hand #11');
    expect(headerText(seatSession({ gameType: 'sit-and-go' }).config, 1)).toBe(
      'Sit-and-go · 6 players · 20/40 · Hand #1',
    );
    expect(headerText(ninePlayerCustom(1), 26)).toBe('Cash · 9 players · $10/$20 · Hand #26');
  });

  it('a 9-player custom session resumes with its seats, styles, stacks and count and the next button', () => {
    const config = ninePlayerCustom(1);
    expect(config.lineUp).toBe('Custom');
    const played = playSession(seatSession(config), 25, codeFor);
    const t25 = played.at(-1) as TableState;
    expect(t25.handNumber).toBe(25);
    expect(t25.hand?.button).toBe(7);
    const expected = nextHand(t25);

    const restored = restoreSession(recordAfter(played));
    expect(restored.config.gameType).toBe('cash');
    expect(restored.config.players).toBe(9);
    expect(restored.config.gameType === 'cash' && restored.config.stake).toEqual({
      smallBet: 10,
      bigBet: 20,
    });
    expect(restored.config.lineUp).toBe('Custom');
    expect(restored.config.speed).toBe(config.speed);
    expect(restored.seats).toEqual(expected.seats);
    expect(restored.botIds).toEqual(expected.botIds);
    expect(restored.stacks).toEqual(expected.stacks);
    expect(restored.handNumber - 1).toBe(25);
    expect(restored.button).toBe(8);
    expect(restored).toEqual(expected);
    expect(dealHand(restored, codeFor(26)).hand?.button).toBe(8);

    // Wrap-around: seats 1, 2, 3, 5, 7 with the button on 7, so the next button is seat 1.
    const sparse = seatSession({
      ...DEFAULT_SESSION_CONFIG,
      players: 5,
      seats: DEFAULT_SESSION_CONFIG.seats
        .filter((s) => [1, 2, 3, 5].includes(s.seat))
        .concat({ seat: 7, name: 'Zed', kind: 'bot', style: 'Maniac' }),
      button: 7,
    });
    const wrapped = playSession(sparse, 1, codeFor);
    expect(wrapped[0]?.hand?.button).toBe(7);
    const resumed = restoreSession(recordAfter(wrapped));
    expect(resumed.button).toBe(1);
    expect(resumed).toEqual(nextHand(wrapped[0] as TableState));
    expect(dealHand(resumed, codeFor(2)).hand?.button).toBe(1);
  });

  it('a stored session with an unknown kind, unknown style or missing name is rejected before line-up or table code', () => {
    const valid = startRecord({});
    // Seat index 1 of the record, or of its config.
    const seat = (r: Json): Json => (r.seats as Json[])[1] as Json;
    const configSeat = (r: Json): Json => seat(r.config as Json);
    const edits: [string, (record: Json) => void][] = [
      ['Invalid session record: seats[1].kind', (r) => (seat(r).kind = 'robot')],
      ['Invalid session config: seats[1].kind', (r) => (configSeat(r).kind = 'robot')],
      ['Invalid session record: seats[1].style', (r) => (seat(r).style = 'Shark')],
      ['Invalid session config: seats[1].style', (r) => (configSeat(r).style = 'Shark')],
      ['Invalid session record: seats[1].name', (r) => Reflect.deleteProperty(seat(r), 'name')],
      ['Invalid session record: seats[1].name', (r) => (seat(r).name = '')],
      [
        'Invalid session config: seats[1].name',
        (r) => Reflect.deleteProperty(configSeat(r), 'name'),
      ],
    ];
    vi.mocked(resolveLineUpName).mockClear();
    vi.mocked(lineUpSessionConfig).mockClear();
    for (const [message, edit] of edits) {
      const bad = structuredClone(valid) as unknown as Json;
      edit(bad);
      expectRejected(bad, message);
    }
    expect(resolveLineUpName).not.toHaveBeenCalled();
    expect(lineUpSessionConfig).not.toHaveBeenCalled();
    // The spies wrap the real functions.
    expect(configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed').lineUp).toBe('Mixed');
    expect(lineUpSessionConfig).toHaveBeenCalled();
  });

  it('handsPlayed or nextBotId near MAX_SAFE_INTEGER is rejected with RangeError', () => {
    expect(MAX_SESSION_COUNT).toBe(1_000_000_000);
    expect(MAX_SESSION_COUNT).toBeLessThan(Number.MAX_SAFE_INTEGER);
    const valid = startRecord({});
    for (const field of ['handsPlayed', 'nextBotId'] as const) {
      for (const value of [
        Number.MAX_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER - 1,
        MAX_SESSION_COUNT + 1,
      ]) {
        expectRejected({ ...valid, [field]: value }, `Invalid session record: ${field}`);
      }
    }
    const atCap = restoreSession({ ...valid, handsPlayed: MAX_SESSION_COUNT });
    expect(atCap.handNumber).toBe(MAX_SESSION_COUNT + 1);
    expect(Number.isSafeInteger(atCap.handNumber)).toBe(true);
    const botsAtCap = restoreSession({ ...valid, nextBotId: MAX_SESSION_COUNT });
    expect(botsAtCap.nextBotId).toBe(MAX_SESSION_COUNT);
    expect(Object.values(botsAtCap.botIds).every((id) => id < MAX_SESSION_COUNT)).toBe(true);
  });

  it('findPausedSession orders by updatedAt, startedAt and sessionId', () => {
    const base = startRecord({});
    const at = (minute: number): string =>
      new Date(STARTED.getTime() + minute * 60_000).toISOString();
    const record = (id: string, startedAt: string, updatedAt: string): SessionRecord => ({
      ...base,
      sessionId: id.repeat(32),
      startedAt,
      updatedAt,
    });
    const pick = (values: unknown[]): SessionRecord | null => {
      const forward = findPausedSession(values).session;
      expect(findPausedSession([...values].reverse()).session).toBe(forward);
      return forward;
    };

    const older = record('a', at(0), at(5));
    const newer = record('b', at(0), at(30));
    expect(pick([older, newer])).toBe(newer);

    const earlyStart = record('c', at(1), at(30));
    const lateStart = record('a', at(2), at(30));
    expect(pick([earlyStart, lateStart])).toBe(lateStart);

    const low = record('1', at(2), at(30));
    const high = record('f', at(2), at(30));
    expect(pick([low, high, earlyStart])).toBe(high);

    for (const value of ['x', null, []]) {
      const { session, rejected } = findPausedSession([value, older]);
      expect(session).toBe(older);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]).toBeInstanceOf(RangeError);
      expect(rejected[0]?.message).toBe('Invalid session record: record');
    }

    const ended = { ...newer, endedAt: at(31) };
    const open = { ...older, endedAt: null };
    expect(parseSessionRecord(ended)).toBe(ended);
    expect(parseSessionRecord(open)).toBe(open);
    expect(parseSessionRecord(older)).toBe(older);
    expect(pick([ended, open])).toBe(open);
    expect(findPausedSession([ended]).session).toBeNull();
    for (const endedAt of ['yesterday', 5]) {
      expectRejected({ ...older, endedAt }, 'Invalid session record: endedAt');
    }
  });
});
