import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isReplayCode, shuffledDeck } from '../../src/engine/deck';
import { createHand, type HandState, type SeatConfig } from '../../src/engine/hand';
import { handRecord, parseHandRecord } from '../../src/table/hand-record';
import {
  DEFAULT_SEATS,
  DEFAULT_SESSION_CONFIG,
  assertSessionConfig,
  completedHand,
  configForLineUp,
  configForPlayers,
  dealHand,
  nextHand,
  resolveSessionConfig,
  stakesFor,
  type CompletedHand,
  type SessionConfig,
  type SessionSeat,
  type Stake,
} from '../../src/table/session';
import { restoreSession, sessionRecord, type SessionRecord } from '../../src/table/session-record';
import { KINGS_SHOWDOWN, SCENARIO_CODE } from '../support/table-scenarios';

const AT = new Date('2026-11-23T10:00:00Z');
const SESSION = '0123456789abcdef0123456789abcdef';
const HOSTILE: unknown = JSON.parse('{"toString":1}');
const RECORD: SessionRecord = sessionRecord(nextHand(KINGS_SHOWDOWN), {
  sessionId: SESSION,
  startedAt: AT,
  updatedAt: AT,
});

type Json = Record<string, unknown>;

/** A deep copy of `value` with `path` (dot-separated keys) set to `next`. */
function withField(value: unknown, path: string, next: unknown): Json {
  const copy = structuredClone(value) as Json;
  const keys = path.split('.');
  const last = keys.pop() as string;
  let target = copy;
  for (const key of keys) target = target[key] as Json;
  target[last] = next;
  return copy;
}

/** `list` with index `hole` removed, keeping its length. */
function holed<T>(list: readonly T[], hole: number): T[] {
  const copy = [...list];
  Reflect.deleteProperty(copy, hole);
  return copy;
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

const config = (overrides: Json): unknown => ({ ...DEFAULT_SESSION_CONFIG, ...overrides });
const seatsWith = (index: number, seat: Json): Json[] =>
  DEFAULT_SEATS.map((s, i) => (i === index ? { ...s, ...seat } : { ...s }));

describe('session restore acceptance', () => {
  it('assertSessionConfig accepts only one user seat at userSeat, players equal to seats, a seated button and known values', () => {
    const sitAndGo = resolveSessionConfig({ gameType: 'sit-and-go' });
    for (const valid of [
      DEFAULT_SESSION_CONFIG,
      sitAndGo,
      configForPlayers(DEFAULT_SESSION_CONFIG, 2),
      configForLineUp(DEFAULT_SESSION_CONFIG, 10, 'Mixed'),
    ]) {
      expect(() => assertSessionConfig(valid)).not.toThrow();
    }
    const invalid: unknown[] = [
      config({ seats: seatsWith(0, { kind: 'user', style: null }) }),
      config({ seats: seatsWith(4, { kind: 'bot', style: 'TAG' }) }),
      config({ userSeat: 4 }),
      config({ players: 5 }),
      config({ button: 9 }),
      config({ gameType: 'poker' }),
      config({ lineUp: 'Wild' }),
      config({ speed: 'slow' }),
      config({ seats: seatsWith(0, { style: 'Shark' }) }),
      config({ seats: seatsWith(4, { style: 'TAG' }) }),
      config({ seats: seatsWith(0, { name: '' }) }),
      config({ seats: [...DEFAULT_SEATS].reverse() }),
      config({ stake: { smallBet: 0, bigBet: 8 } }),
      { ...sitAndGo, stake: { smallBet: 4, bigBet: 8 } },
      null,
      [DEFAULT_SESSION_CONFIG],
    ];
    for (const value of invalid) rangeError(() => assertSessionConfig(value));
  });

  it("restored stakes and stacks pass createHand's safe-integer and pot-bound rules", () => {
    expect(restoreSession(structuredClone(RECORD))).toEqual(nextHand(KINGS_SHOWDOWN));
    const deck = shuffledDeck(SCENARIO_CODE);
    const createMessage = (stake: Stake, stacks: readonly unknown[]): string =>
      rangeError(() =>
        createHand({
          stakes: stakesFor(stake),
          seats: RECORD.seats.map((s, i) => ({ seat: s.seat, stack: stacks[i] }) as SeatConfig),
          button: RECORD.button,
          deck,
        }),
      ).message;
    const stacks = RECORD.seats.map((s) => s.stack);
    const stake = (RECORD.config as { stake: Stake }).stake;
    for (const bad of [0, -1, 1.5, 2 ** 53]) {
      const changed = [bad, ...stacks.slice(1)];
      const record = withField(RECORD, 'seats.0.stack', bad);
      expect(rangeError(() => restoreSession(record)).message).toBe(createMessage(stake, changed));
    }
    const huge = stacks.map(() => 2 ** 51);
    let record: Json = structuredClone(RECORD) as unknown as Json;
    for (const [i, value] of huge.entries()) record = withField(record, `seats.${i}.stack`, value);
    expect(rangeError(() => restoreSession(record)).message).toBe(createMessage(stake, huge));
    expect(rangeError(() => restoreSession(record)).message).toBe(
      'Stacks must total at most 9007199254740991',
    );
    const bigStake = { smallBet: 4, bigBet: 2 ** 53 };
    const bigRecord = withField(RECORD, 'config.stake', bigStake);
    expect(rangeError(() => restoreSession(bigRecord)).message).toBe(
      createMessage(bigStake, stacks),
    );
  });

  it('object or array seat, button and replay-code values are rejected with RangeError', () => {
    for (const hostile of [HOSTILE, [3]]) {
      for (const path of ['seats.1.seat', 'button', 'config.button', 'config.seats.1.seat']) {
        rangeError(() => restoreSession(withField(RECORD, path, hostile)));
      }
    }
    const done = completedHand(KINGS_SHOWDOWN) as CompletedHand;
    const record = handRecord(done, {
      sessionId: SESSION,
      handNumber: 1,
      config: KINGS_SHOWDOWN.config,
      completedAt: AT,
    });
    for (const code of [[SCENARIO_CODE], HOSTILE]) {
      expect(rangeError(() => parseHandRecord(withField(record, 'replayCode', code))).message).toBe(
        'Invalid hand record: replayCode',
      );
    }
    const stakes = KINGS_SHOWDOWN.stakes;
    const deck = shuffledDeck(SCENARIO_CODE);
    const seats = KINGS_SHOWDOWN.stacks.map((s) => ({ ...s }));
    const hostileSeat = seats.map((s, i) => (i === 1 ? { ...s, seat: HOSTILE } : s));
    rangeError(() => createHand({ stakes, deck, button: 6, seats: hostileSeat as SeatConfig[] }));
    rangeError(() => createHand({ stakes, deck, seats, button: HOSTILE as number }));
    expect(isReplayCode([SCENARIO_CODE])).toBe(false);
    expect(isReplayCode(HOSTILE)).toBe(false);
    rangeError(() => shuffledDeck([SCENARIO_CODE] as unknown as string));
    rangeError(() => shuffledDeck(HOSTILE as string));
  });

  it('sparse or non-object seats are rejected with RangeError', () => {
    const recordSeats = RECORD.seats;
    const configSeats = RECORD.config.seats;
    const badLists = <T>(list: readonly T[]): unknown[][] => [
      holed(list, 0),
      holed(list, 3),
      ...[5, null, []].map((entry) => list.map((s, i) => (i === 2 ? entry : s))),
    ];
    for (const seats of badLists(recordSeats)) {
      rangeError(() => restoreSession({ ...RECORD, seats }));
    }
    for (const seats of badLists(configSeats)) {
      rangeError(() => restoreSession({ ...RECORD, config: { ...RECORD.config, seats } }));
      rangeError(() => assertSessionConfig({ ...DEFAULT_SESSION_CONFIG, seats }));
    }
    const done = completedHand(KINGS_SHOWDOWN) as CompletedHand;
    const record = handRecord(done, {
      sessionId: SESSION,
      handNumber: 1,
      config: KINGS_SHOWDOWN.config,
      completedAt: AT,
    });
    for (const seats of badLists(record.seats)) {
      rangeError(() => parseHandRecord({ ...record, seats }));
    }
    const deck = shuffledDeck(SCENARIO_CODE);
    for (const seats of badLists(KINGS_SHOWDOWN.stacks)) {
      const error = rangeError(() =>
        createHand({
          stakes: KINGS_SHOWDOWN.stakes,
          deck,
          button: 6,
          seats: seats as SeatConfig[],
        }),
      );
      expect(error.message).toBe('Invalid hand config');
    }
  });

  it('resolveSessionConfig output always passes assertSessionConfig', () => {
    const fourSeats: SessionSeat[] = [1, 2, 3, 4].map((seat) =>
      seat === 2
        ? { seat, name: 'You', kind: 'user', style: null }
        : { seat, name: `Bot ${seat}`, kind: 'bot', style: 'TAG' },
    );
    const partials: Partial<SessionConfig>[] = [
      {},
      { players: 3 },
      { players: 10 },
      { seats: fourSeats },
      { gameType: 'sit-and-go' },
      { button: 2 },
      { stake: { smallBet: 10, bigBet: 20 } } as Partial<SessionConfig>,
    ];
    for (const partial of partials) {
      expect(() => assertSessionConfig(resolveSessionConfig(partial))).not.toThrow();
    }
    expect(resolveSessionConfig({})).toEqual(DEFAULT_SESSION_CONFIG);
    expect(resolveSessionConfig({ players: 3 })).toEqual(
      configForPlayers(DEFAULT_SESSION_CONFIG, 3),
    );
    expect(resolveSessionConfig({ seats: fourSeats })).toMatchObject({
      players: 4,
      userSeat: 2,
      button: 3,
    });
    expect(resolveSessionConfig({ button: 2 }).button).toBe(2);
    rangeError(() => resolveSessionConfig({ players: 3, seats: DEFAULT_SEATS }));

    fc.assert(
      fc.property(
        fc.record(
          {
            players: fc.integer({ min: 2, max: 10 }),
            button: fc.integer({ min: 1, max: 10 }),
            gameType: fc.constantFrom('cash' as const, 'sit-and-go' as const),
          },
          { requiredKeys: [] },
        ),
        (partial) => {
          let resolved: SessionConfig;
          try {
            resolved = resolveSessionConfig(partial);
          } catch (error) {
            return error instanceof RangeError;
          }
          assertSessionConfig(resolved);
          return true;
        },
      ),
    );
  });

  it('a stored in-progress hand or action list is rejected and restore applies no action', () => {
    const dealt = dealHand(nextHand(KINGS_SHOWDOWN), SCENARIO_CODE).hand as HandState;
    const corrupt: HandState = {
      ...dealt,
      players: dealt.players.map((p, i) =>
        i === 0 ? { ...p, allIn: true, stack: -50, streetContribution: 9999 } : p,
      ),
    };
    for (const hand of [dealt, corrupt]) {
      const stored = { ...structuredClone(RECORD), hand: structuredClone(hand) };
      expect(rangeError(() => restoreSession(stored)).message).toBe('Invalid session record: hand');
    }
    for (const actions of [[{ seat: 1, type: 'call', amount: 4 }], [{ seat: HOSTILE }]]) {
      const stored = { ...structuredClone(RECORD), actions };
      expect(rangeError(() => restoreSession(stored)).message).toBe(
        'Invalid session record: actions',
      );
    }
    const restored = restoreSession(structuredClone(RECORD));
    expect(restored.hand).toBeNull();
    expect(restored.userDecisions).toEqual([]);
    expect(restored.replayCode).toBeNull();
    expect(restored.handNumber).toBe(RECORD.handsPlayed + 1);
  });
});
