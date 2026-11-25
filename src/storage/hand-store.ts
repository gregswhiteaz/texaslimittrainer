import { trendHand, type TrendData, type TrendHand, type TrendReader } from '../stats/trends';
import { parseHandRecord, type HandRecord, type HandStore } from '../table/hand-record';
import {
  findPausedSession,
  isEnded,
  parseSessionRecord,
  type SessionRecord,
} from '../table/session-record';
import {
  parseSessionReport,
  sessionReport,
  type SessionEnder,
  type SessionReport,
} from '../table/session-report';
import { DEFAULT_SETTINGS, parseSettings, type SettingsReader } from '../table/settings';

export const DB_NAME = 'tlh-trainer';
/** The only version marker until REQ-054 adds per-store schema versions. v2 added SESSIONS_STORE, v3
 *  REPORTS_STORE, v4 SETTINGS_STORE. */
export const DB_VERSION = 4;
export const HANDS_STORE = 'hands';
export const SESSIONS_STORE = 'sessions';
export const REPORTS_STORE = 'reports';
export const SETTINGS_STORE = 'settings';
/** The out-of-line key of the one settings record in SETTINGS_STORE. */
export const SETTINGS_KEY = 'settings';

function opened(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, DB_VERSION);
    request.onupgradeneeded = (event) => {
      if (event.oldVersion < 1) {
        request.result.createObjectStore(HANDS_STORE, { keyPath: ['sessionId', 'handNumber'] });
      }
      // Each later version appends one `oldVersion < N` step; existing stores and records are never touched.
      if (event.oldVersion < 2) {
        request.result.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
      }
      if (event.oldVersion < 3) {
        request.result.createObjectStore(REPORTS_STORE, { keyPath: 'sessionId' });
      }
      if (event.oldVersion < 4) {
        request.result.createObjectStore(SETTINGS_STORE).put({ ...DEFAULT_SETTINGS }, SETTINGS_KEY);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

function requested<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Resolves when `transaction` completes; rejects with `request`'s error, else the transaction's. */
function completed(transaction: IDBTransaction, request: IDBRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const fail = () => reject(request.error ?? transaction.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = fail;
    transaction.onabort = fail;
  });
}

/** Ends `sessionId` in `db` (SessionEnder.endSession): every step runs in request callbacks of one strict
 *  transaction, so a failure anywhere changes nothing. The report's style counts come from the session's
 *  stored hand records; a missing or invalid record is skipped (TASK-10.3 A-7). */
function ended(db: IDBDatabase, sessionId: string, endedAt: Date): Promise<SessionReport | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE, REPORTS_STORE, HANDS_STORE], 'readwrite', {
      durability: 'strict',
    });
    const sessions = transaction.objectStore(SESSIONS_STORE);
    let report: SessionReport | null = null;
    let failure: unknown = null;
    let failed: IDBRequest | null = null;
    const read = sessions.get(sessionId);
    read.onsuccess = () => {
      const value: unknown = read.result;
      if (value === undefined) return;
      let session: SessionRecord;
      try {
        session = parseSessionRecord(value);
      } catch (error) {
        failure = error;
        transaction.abort();
        return;
      }
      if (session.handsPlayed === 0) {
        sessions.delete(sessionId);
        return;
      }
      const hands = transaction.objectStore(HANDS_STORE);
      const records: (HandRecord | null)[] = [];
      let pending = session.handsPlayed;
      for (let n = 1; n <= session.handsPlayed; n++) {
        const get = hands.get([sessionId, n]);
        get.onsuccess = () => {
          try {
            records[n - 1] = get.result === undefined ? null : parseHandRecord(get.result);
          } catch {
            records[n - 1] = null;
          }
          if (--pending === 0) write(value as object, session, records);
        };
        get.onerror = () => {
          failed = get;
        };
      }
    };
    const write = (value: object, session: SessionRecord, records: (HandRecord | null)[]) => {
      try {
        report = sessionReport(
          session,
          endedAt,
          records.filter((r) => r !== null),
        );
      } catch (error) {
        failure = error;
        transaction.abort();
        return;
      }
      sessions.put({ ...value, endedAt: report.endedAt });
      const add = transaction.objectStore(REPORTS_STORE).add(report);
      add.onerror = () => {
        failed = add;
      };
    };
    read.onerror = () => {
      failed = read;
    };
    const fail = () => reject(failure ?? failed?.error ?? transaction.error);
    transaction.oncomplete = () => resolve(report);
    transaction.onerror = fail;
    transaction.onabort = fail;
  });
}

/** Every valid stored hand as a TrendHand and every valid session's startedAt, from one read-only transaction;
 *  invalid values are skipped (TASK-11.1 A-3). */
async function trendData(db: IDBDatabase): Promise<TrendData> {
  const transaction = db.transaction([HANDS_STORE, SESSIONS_STORE], 'readonly');
  const [handValues, sessionValues] = await Promise.all([
    requested<unknown[]>(transaction.objectStore(HANDS_STORE).getAll()),
    requested<unknown[]>(transaction.objectStore(SESSIONS_STORE).getAll()),
  ]);
  const hands: TrendHand[] = [];
  for (const value of handValues) {
    try {
      hands.push(trendHand(parseHandRecord(value)));
    } catch {
      // Skipped (A-3).
    }
  }
  const sessionStarts = new Map<string, string>();
  for (const value of sessionValues) {
    try {
      const { sessionId, startedAt } = parseSessionRecord(value);
      sessionStarts.set(sessionId, startedAt);
    } catch {
      // Skipped (A-3).
    }
  }
  return { hands, sessionStarts };
}

/**
 * An IndexedDB HandStore: add-only hand records, one replaceable record per session and one write-once report
 * per ended session. The database opens on the first call; if opening fails, every call rejects with that
 * error. Records are validated by parseHandRecord / parseSessionRecord / parseSessionReport / parseSettings when
 * read.
 */
export function openHandStore(
  factory: IDBFactory = indexedDB,
  name = DB_NAME,
): HandStore & SessionEnder & TrendReader & SettingsReader {
  let db: Promise<IDBDatabase> | null = null;
  const database = (): Promise<IDBDatabase> => (db ??= opened(factory, name));
  const readOnly = async (store: string): Promise<IDBObjectStore> =>
    (await database()).transaction(store, 'readonly').objectStore(store);
  return {
    async add(record, session) {
      const transaction =
        session === undefined
          ? (await database()).transaction(HANDS_STORE, 'readwrite', { durability: 'strict' })
          : (await database()).transaction([HANDS_STORE, SESSIONS_STORE], 'readwrite', {
              durability: 'strict',
            });
      const request = transaction.objectStore(HANDS_STORE).add(record);
      if (session !== undefined) transaction.objectStore(SESSIONS_STORE).put(session);
      return completed(transaction, request);
    },
    async putSession(session) {
      const transaction = (await database()).transaction(SESSIONS_STORE, 'readwrite', {
        durability: 'strict',
      });
      return completed(transaction, transaction.objectStore(SESSIONS_STORE).put(session));
    },
    async getSession(sessionId) {
      const value: unknown = await requested((await readOnly(SESSIONS_STORE)).get(sessionId));
      return value === undefined ? null : parseSessionRecord(value);
    },
    async pausedSession() {
      const values: unknown[] = await requested((await readOnly(SESSIONS_STORE)).getAll());
      return findPausedSession(values);
    },
    async get(sessionId, handNumber) {
      const value: unknown = await requested(
        (await readOnly(HANDS_STORE)).get([sessionId, handNumber]),
      );
      return value === undefined ? null : parseHandRecord(value);
    },
    async count() {
      return requested((await readOnly(HANDS_STORE)).count());
    },
    async endSession(sessionId, endedAt) {
      return ended(await database(), sessionId, endedAt);
    },
    async endPausedSessions(sessionId, endedAt) {
      const report = await ended(await database(), sessionId, endedAt);
      const values: unknown[] = await requested((await readOnly(SESSIONS_STORE)).getAll());
      const rejected: Error[] = [];
      for (const value of values) {
        let record: SessionRecord;
        try {
          record = parseSessionRecord(value);
        } catch {
          continue;
        }
        if (isEnded(record) || record.sessionId === sessionId) continue;
        try {
          await ended(await database(), record.sessionId, new Date(record.updatedAt));
        } catch (error) {
          rejected.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
      return { report, rejected };
    },
    async getReport(sessionId) {
      const value: unknown = await requested((await readOnly(REPORTS_STORE)).get(sessionId));
      return value === undefined ? null : parseSessionReport(value);
    },
    async trendData() {
      return trendData(await database());
    },
    async readSettings() {
      const value: unknown = await requested((await readOnly(SETTINGS_STORE)).get(SETTINGS_KEY));
      return value === undefined ? DEFAULT_SETTINGS : parseSettings(value);
    },
  };
}

let shared: (HandStore & SessionEnder & TrendReader & SettingsReader) | null = null;

/** The app-wide store, created on first call (never at module load). */
export function sharedHandStore(): HandStore & SessionEnder & TrendReader & SettingsReader {
  return (shared ??= openHandStore());
}
