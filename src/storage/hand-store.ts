import { parseHandRecord, type HandStore } from '../table/hand-record';
import { findPausedSession, parseSessionRecord } from '../table/session-record';
import {
  parseSessionReport,
  sessionReport,
  type SessionEnder,
  type SessionReport,
} from '../table/session-report';

export const DB_NAME = 'tlh-trainer';
/** The only version marker until REQ-054 adds per-store schema versions. v2 added SESSIONS_STORE, v3
 *  REPORTS_STORE. */
export const DB_VERSION = 3;
export const HANDS_STORE = 'hands';
export const SESSIONS_STORE = 'sessions';
export const REPORTS_STORE = 'reports';

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
 *  transaction, so a failure anywhere changes nothing. */
function ended(db: IDBDatabase, sessionId: string, endedAt: Date): Promise<SessionReport | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE, REPORTS_STORE], 'readwrite', {
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
      try {
        const session = parseSessionRecord(value);
        if (session.handsPlayed === 0) {
          sessions.delete(sessionId);
          return;
        }
        report = sessionReport(session, endedAt);
      } catch (error) {
        failure = error;
        transaction.abort();
        return;
      }
      sessions.put({ ...(value as object), endedAt: report.endedAt });
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

/**
 * An IndexedDB HandStore: add-only hand records, one replaceable record per session and one write-once report
 * per ended session. The database opens on the first call; if opening fails, every call rejects with that
 * error. Records are validated by parseHandRecord / parseSessionRecord / parseSessionReport when read.
 */
export function openHandStore(
  factory: IDBFactory = indexedDB,
  name = DB_NAME,
): HandStore & SessionEnder {
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
    async getReport(sessionId) {
      const value: unknown = await requested((await readOnly(REPORTS_STORE)).get(sessionId));
      return value === undefined ? null : parseSessionReport(value);
    },
  };
}

let shared: (HandStore & SessionEnder) | null = null;

/** The app-wide store, created on first call (never at module load). */
export function sharedHandStore(): HandStore & SessionEnder {
  return (shared ??= openHandStore());
}
