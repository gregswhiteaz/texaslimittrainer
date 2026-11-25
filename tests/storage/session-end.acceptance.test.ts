import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import {
  DB_NAME,
  DB_VERSION,
  HANDS_STORE,
  REPORTS_STORE,
  SESSIONS_STORE,
  openHandStore,
} from '../../src/storage/hand-store';
import type { HandRecord, HandStore } from '../../src/table/hand-record';
import { seatSession, type TableState } from '../../src/table/session';
import { handWrite, sessionRecord } from '../../src/table/session-record';
import { sessionReport } from '../../src/table/session-report';
import { playSession } from '../support/session-play';

const SESSION_A = '0123456789abcdef0123456789abcdef';
const SESSION_B = 'b'.repeat(32);
const STARTED = new Date('2026-11-23T10:00:00Z');
const codeFor = (hand: number): ReplayCode => replayCodeFromWords([0x9e3779b9, hand, 2, 3]);
const at = (minute: number): Date => new Date(STARTED.getTime() + minute * 60_000);

/** Writes the start record and `hands` hands of session `sessionId`, as the app does. */
async function play(store: HandStore, sessionId: string, hands: number): Promise<TableState[]> {
  const start = seatSession();
  await store.putSession(
    sessionRecord(start, { sessionId, startedAt: STARTED, updatedAt: STARTED }),
  );
  const played = playSession(start, hands, codeFor);
  for (const done of played) {
    const { record, session } = handWrite(done, {
      sessionId,
      startedAt: STARTED,
      completedAt: at(done.handNumber),
    });
    await store.add(record, session);
  }
  return played;
}

/** Every value in `store` of `factory`'s database. */
function all(factory: IDBFactory, store: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const open = factory.open(DB_NAME, DB_VERSION);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const request = db.transaction(store, 'readonly').objectStore(store).getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    };
  });
}

describe('session end storage acceptance', () => {
  it('AC#5/AC#7 ending saves the report, relaunch reads it, 0 hands stores nothing', async () => {
    const factory = new IDBFactory();
    const store = openHandStore(factory);
    await play(store, SESSION_A, 3);
    const stored = await store.getSession(SESSION_A);
    const ended = at(30);

    const report = await store.endSession(SESSION_A, ended);
    const hands = await Promise.all([1, 2, 3].map(async (n) => store.get(SESSION_A, n)));
    expect(report).toEqual(
      sessionReport(stored as NonNullable<typeof stored>, ended, hands as HandRecord[]),
    );
    expect(report?.handsPlayed).toBe(3);

    const relaunched = openHandStore(factory);
    expect(await relaunched.getReport(SESSION_A)).toEqual(report);
    const session = await relaunched.getSession(SESSION_A);
    expect(session?.endedAt).toBe(ended.toISOString());
    expect({ ...session, endedAt: undefined }).toEqual({ ...stored, endedAt: undefined });
    expect((await relaunched.pausedSession()).session).toBeNull();
    expect(await relaunched.count()).toBe(3);

    // A stored start record (0 hands) is deleted and no report is stored.
    const fresh = new IDBFactory();
    const empty = openHandStore(fresh);
    await play(empty, SESSION_B, 0);
    expect(await empty.getSession(SESSION_B)).not.toBeNull();
    expect(await empty.endSession(SESSION_B, ended)).toBeNull();
    expect(await empty.getSession(SESSION_B)).toBeNull();
    expect(await empty.getReport(SESSION_B)).toBeNull();
    expect(await all(fresh, REPORTS_STORE)).toEqual([]);
    expect(await all(fresh, SESSIONS_STORE)).toEqual([]);

    // An absent session writes nothing.
    expect(await empty.endSession(SESSION_A, ended)).toBeNull();
    expect(await all(fresh, REPORTS_STORE)).toEqual([]);
  });

  it('AC#6 a stored report is never rewritten and a second write is rejected', async () => {
    const factory = new IDBFactory();
    const store = openHandStore(factory);
    await play(store, SESSION_A, 2);
    const reportA = await store.endSession(SESSION_A, at(10));
    const json = JSON.stringify(await store.getReport(SESSION_A));
    expect(JSON.parse(json)).toEqual(reportA);
    const sessionA = JSON.stringify(await store.getSession(SESSION_A));

    await play(store, SESSION_B, 3);
    const reportB = await store.endSession(SESSION_B, at(40));
    expect(reportB?.handsPlayed).toBe(3);

    await expect(store.endSession(SESSION_A, at(60))).rejects.toMatchObject({
      name: 'ConstraintError',
    });
    expect(JSON.stringify(await store.getReport(SESSION_A))).toBe(json);
    expect(JSON.stringify(await store.getSession(SESSION_A))).toBe(sessionA);
    expect(await store.getReport(SESSION_B)).toEqual(reportB);

    // A stored session that fails validation is not ended: nothing changes.
    await new Promise<void>((resolve, reject) => {
      const open = factory.open(DB_NAME, DB_VERSION);
      open.onsuccess = () => {
        const transaction = open.result.transaction(SESSIONS_STORE, 'readwrite');
        transaction
          .objectStore(SESSIONS_STORE)
          .put({ ...JSON.parse(sessionA), sessionId: 'c'.repeat(32), handsPlayed: -1 });
        transaction.oncomplete = () => {
          open.result.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
    await expect(store.endSession('c'.repeat(32), at(70))).rejects.toThrow(
      new RangeError('Invalid session record: handsPlayed'),
    );
    expect(await store.getReport('c'.repeat(32))).toBeNull();
    expect(await all(factory, REPORTS_STORE)).toHaveLength(2);
  });

  it('a v2 database upgrades to v3 with its records intact', async () => {
    const factory = new IDBFactory();
    const [done] = playSession(seatSession(), 1, codeFor);
    const { record, session } = handWrite(done as TableState, {
      sessionId: SESSION_A,
      startedAt: STARTED,
      completedAt: at(1),
    });
    await new Promise<void>((resolve, reject) => {
      const open = factory.open(DB_NAME, 2);
      open.onupgradeneeded = () => {
        open.result.createObjectStore(HANDS_STORE, { keyPath: ['sessionId', 'handNumber'] });
        open.result.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
      };
      open.onsuccess = () => {
        const transaction = open.result.transaction([HANDS_STORE, SESSIONS_STORE], 'readwrite');
        transaction.objectStore(HANDS_STORE).add(record);
        transaction.objectStore(SESSIONS_STORE).put(session);
        transaction.oncomplete = () => {
          open.result.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });

    const store = openHandStore(factory);
    expect(DB_VERSION).toBe(4); // TASK-12.1 Q-1: v4 adds the settings store.
    expect(await store.count()).toBe(1);
    const names = await new Promise<string[]>((resolve) => {
      const open = factory.open(DB_NAME);
      open.onsuccess = () => {
        const list = [...open.result.objectStoreNames];
        open.result.close();
        resolve(list);
      };
    });
    expect(names).toEqual(['hands', 'reports', 'sessions', 'settings']);
    expect(JSON.stringify(await all(factory, HANDS_STORE))).toBe(JSON.stringify([record]));
    expect(JSON.stringify(await all(factory, SESSIONS_STORE))).toBe(JSON.stringify([session]));

    const report = await store.endSession(SESSION_A, at(5));
    expect(report?.handsPlayed).toBe(1);
    expect(await store.getReport(SESSION_A)).toEqual(report);
  });
});
