import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import type { HandState } from '../../src/engine/hand';
import { styleCounts, styleStats } from '../../src/stats/style-stats';
import { DB_NAME, DB_VERSION, SESSIONS_STORE, openHandStore } from '../../src/storage/hand-store';
import type { HandRecord, HandStore } from '../../src/table/hand-record';
import {
  DEFAULT_SESSION_CONFIG,
  applyUserAction,
  completedHand,
  dealHand,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  type CompletedHand,
  type TableState,
} from '../../src/table/session';
import {
  findPausedSession,
  handWrite,
  restoreSession,
  sessionRecord,
  type SessionRecord,
} from '../../src/table/session-record';
import { checkOrCall, playHand, playSession } from '../support/session-play';

vi.setConfig({ testTimeout: 30_000 });

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-23T10:00:00Z');
const codeFor = (hand: number): ReplayCode => replayCodeFromWords([0x9e3779b9, hand, 2, 3]);
const at = (minute: number): Date => new Date(STARTED.getTime() + minute * 60_000);

function stored(id: string, updated: number, extra: Partial<SessionRecord> = {}): SessionRecord {
  const record = sessionRecord(seatSession(), {
    sessionId: id.repeat(32),
    startedAt: STARTED,
    updatedAt: at(updated),
  });
  return { ...record, ...extra };
}

/** Puts `values` as they are into the `sessions` store of `factory`'s database (opened by the app first). */
async function seedRaw(factory: IDBFactory, values: readonly unknown[]): Promise<void> {
  await openHandStore(factory).count();
  await new Promise<void>((resolve, reject) => {
    const open = factory.open(DB_NAME, DB_VERSION);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction(SESSIONS_STORE, 'readwrite');
      for (const value of values) transaction.objectStore(SESSIONS_STORE).put(value);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

async function write(store: HandStore, done: TableState): Promise<void> {
  const { record, session } = handWrite(done, {
    sessionId: SESSION,
    startedAt: STARTED,
    completedAt: at(done.handNumber),
  });
  await store.add(record, session);
}

/** Hands 1-10 written, then hand 11 dealt and part-played but never written (the app closed). */
async function closedInHand11(factory: IDBFactory): Promise<{
  played: TableState[];
  abandoned: TableState;
}> {
  const store = openHandStore(factory);
  const start = seatSession();
  await store.putSession(
    sessionRecord(start, { sessionId: SESSION, startedAt: STARTED, updatedAt: STARTED }),
  );
  const played = playSession(start, 10, codeFor);
  for (const done of played) await write(store, done);
  let abandoned = dealHand(nextHand(played.at(-1) as TableState), codeFor(11));
  for (let step = 0; step < 3 && nextStep(abandoned) !== 'done'; step++) {
    abandoned =
      nextStep(abandoned) === 'bot'
        ? stepBot(abandoned)
        : applyUserAction(abandoned, checkOrCall(abandoned.hand as HandState));
  }
  expect(abandoned.hand?.actions.length).toBeGreaterThan(2);
  expect(nextStep(abandoned)).not.toBe('done');
  return { played, abandoned };
}

const ready = (table: TableState) => ({
  stacks: table.stacks,
  seats: table.seats,
  botIds: table.botIds,
  button: table.button,
  nextBotName: table.nextBotName,
  nextBotId: table.nextBotId,
});

describe('resume storage acceptance', () => {
  it('the paused session is the latest valid stored session that has not ended', async () => {
    expect(await openHandStore(new IDBFactory()).pausedSession()).toEqual({
      session: null,
      rejected: [],
    });

    const endedOnly = [
      stored('a', 5, { endedAt: at(6).toISOString() }),
      stored('b', 9, { endedAt: at(10).toISOString() }),
    ];
    const endedFactory = new IDBFactory();
    await seedRaw(endedFactory, endedOnly);
    expect((await openHandStore(endedFactory).pausedSession()).session).toBeNull();
    expect(findPausedSession(endedOnly).session).toBeNull();

    // Rule 1: A (10:05), B (10:30, ended 10:31), C (10:20), D (invalid) → C.
    const a = stored('a', 5);
    const b = stored('b', 30, { endedAt: at(31).toISOString() });
    const c = stored('c', 20);
    const d = { sessionId: 'd'.repeat(32), seats: 'x' };
    const factory = new IDBFactory();
    await seedRaw(factory, [a, b, c, d]);
    for (const result of [
      await openHandStore(factory).pausedSession(),
      findPausedSession([a, b, c, d]),
    ]) {
      expect(result.session).toEqual(c);
      expect(result.rejected).toHaveLength(1);
      expect(result.rejected[0]).toBeInstanceOf(RangeError);
    }

    const long = stored('e', 1, { handsPlayed: 132 });
    const longFactory = new IDBFactory();
    await seedRaw(longFactory, [long]);
    expect((await openHandStore(longFactory).pausedSession()).session?.handsPlayed).toBe(132);

    for (const open of [stored('f', 1, { endedAt: null }), stored('f', 1)]) {
      expect(findPausedSession([open]).session).toEqual(open);
    }
    for (const endedAt of ['yesterday', 5]) {
      const bad = { ...stored('f', 1), endedAt };
      const badFactory = new IDBFactory();
      await seedRaw(badFactory, [bad]);
      for (const { session, rejected } of [
        await openHandStore(badFactory).pausedSession(),
        findPausedSession([bad]),
      ]) {
        expect(session).toBeNull();
        expect(rejected).toHaveLength(1);
        expect(rejected[0]).toBeInstanceOf(RangeError);
        expect(rejected[0]?.message).toBe('Invalid session record: endedAt');
      }
    }
  });

  it('a session closed in hand 11 resumes at hand 11 with the end-of-hand-10 stacks and keeps its session id', async () => {
    const factory = new IDBFactory();
    const { played } = await closedInHand11(factory);
    const t10 = played.at(-1) as TableState;

    // The relaunch: a new store over the same database.
    const relaunched = openHandStore(factory);
    const { session, rejected } = await relaunched.pausedSession();
    expect(rejected).toEqual([]);
    expect(session?.sessionId).toBe(SESSION);
    expect(session?.handsPlayed).toBe(10);
    const table = restoreSession(session);
    expect(table.handNumber).toBe(11);
    expect(table.hand).toBeNull();
    expect(ready(table)).toEqual(ready(nextHand(t10)));

    const hand11 = playHand(table, codeFor(11));
    await write(relaunched, hand11);
    const record11 = await relaunched.get(SESSION, 11);
    expect(record11?.sessionId).toBe(SESSION);
    expect(record11?.handNumber).toBe(11);
    expect((await relaunched.getSession(SESSION))?.handsPlayed).toBe(11);

    const hand12 = playHand(nextHand(hand11), codeFor(12));
    expect(hand12.handNumber).toBe(12);
    await write(relaunched, hand12);
    expect((await relaunched.get(SESSION, 12))?.handNumber).toBe(12);
    expect((await relaunched.getSession(SESSION))?.handsPlayed).toBe(12);
    expect(await relaunched.count()).toBe(12);
  });

  it('the abandoned hand 11 has no record and the stats equal those of hands 1 to 10', async () => {
    const factory = new IDBFactory();
    const { played } = await closedInHand11(factory);
    const relaunched = openHandStore(factory);
    const records: HandRecord[] = [];
    for (let n = 1; n <= 10; n++) {
      const record = await relaunched.get(SESSION, n);
      expect(record, `hand ${n}`).not.toBeNull();
      records.push(record as HandRecord);
    }
    expect(await relaunched.get(SESSION, 11)).toBeNull();
    expect(await relaunched.count()).toBe(10);
    const live = played.map((t) => completedHand(t) as CompletedHand);
    for (const { seat } of DEFAULT_SESSION_CONFIG.seats) {
      expect(styleStats(styleCounts(records, seat)), `seat ${seat}`).toEqual(
        styleStats(styleCounts(live, seat)),
      );
    }
    const restored = restoreSession((await relaunched.pausedSession()).session);
    expect(restored.userDecisions).toEqual([]);
    expect(restored.handNumber).toBe(11);
  });

  it('pausedSession validates each stored session and skips invalid ones', async () => {
    const valid = stored('a', 20);
    const robot = structuredClone(stored('b', 10)) as unknown as {
      seats: { kind: string }[];
    };
    (robot.seats[1] as { kind: string }).kind = 'robot';
    const factory = new IDBFactory();
    await seedRaw(factory, [valid, robot]);
    const both = await openHandStore(factory).pausedSession();
    expect(both.session).toEqual(valid);
    expect(both.rejected).toHaveLength(1);
    expect(both.rejected[0]).toBeInstanceOf(RangeError);
    expect(both.rejected[0]?.message).toBe('Invalid session record: seats[1].kind');

    const onlyBad = new IDBFactory();
    await seedRaw(onlyBad, [robot]);
    const none = await openHandStore(onlyBad).pausedSession();
    expect(none.session).toBeNull();
    expect(none.rejected.map((e) => e.message)).toEqual(['Invalid session record: seats[1].kind']);

    // A newer database version cannot be opened: the read rejects.
    const newer = new IDBFactory();
    await new Promise<void>((resolve) => {
      const open = newer.open(DB_NAME, DB_VERSION + 1);
      open.onsuccess = () => {
        open.result.close();
        resolve();
      };
    });
    await expect(openHandStore(newer).pausedSession()).rejects.toMatchObject({
      name: 'VersionError',
    });
  });
});
