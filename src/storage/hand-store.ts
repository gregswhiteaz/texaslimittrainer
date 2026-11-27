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
import {
  parsePersistentStorage,
  type PersistentStorageReader,
  type PersistentStorageWriter,
} from './persistent-storage';
import {
  DEFAULT_SETTINGS,
  parseSettings,
  type SettingsReader,
  type SettingsWriter,
} from '../table/settings';

export const DB_NAME = 'tlh-trainer';
/** The only version marker until REQ-054 adds per-store schema versions. v2 added SESSIONS_STORE, v3
 *  REPORTS_STORE, v4 SETTINGS_STORE, v5 META_STORE. */
export const DB_VERSION = 5;
export const HANDS_STORE = 'hands';
export const SESSIONS_STORE = 'sessions';
export const REPORTS_STORE = 'reports';
export const SETTINGS_STORE = 'settings';
/** The out-of-line key of the one settings record in SETTINGS_STORE. */
export const SETTINGS_KEY = 'settings';
/** App metadata records under out-of-line keys (TASK-13.2). */
export const META_STORE = 'meta';
/** The META_STORE key of the persistent-storage record, { granted: boolean }. */
export const PERSISTENT_STORAGE_KEY = 'persistentStorage';

/** An open blocked by another connection that did not close on `versionchange` (e.g. an older app build). */
export class UpgradeBlockedError extends Error {
  override name = 'UpgradeBlockedError';
  constructor() {
    super('The database upgrade is blocked by another open connection');
  }
}

/** How long a store call waits for a still-pending blocked open to finish (e.g. its blocker just closed). */
const BLOCKED_GRACE_MS = 100;

/** How long an open waits for its first answer (blocked, upgradeneeded, success or error). A request queued behind
 *  another tab's blocked upgrade gets none; first answers normally take ~1 ms, so 10 s only catches that case. */
export const OPEN_TIMEOUT_MS = 10_000;

/** Opens the database. If the open is blocked, or gets no answer within `timeoutMs`, it rejects with
 *  UpgradeBlockedError, and `onBlocked` gets a promise that resolves when that request finally settles (until
 *  then, a new open would queue behind it). */
function opened(
  factory: IDBFactory,
  name: string,
  onBlocked: (settled: Promise<void>) => void,
  timeoutMs: number,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, DB_VERSION);
    let settle: (() => void) | null = null;
    const giveUp = (): void => {
      if (settle !== null) return;
      onBlocked(new Promise((done) => (settle = done)));
      reject(new UpgradeBlockedError());
    };
    const timer = setTimeout(giveUp, timeoutMs);
    request.onblocked = () => {
      clearTimeout(timer);
      giveUp();
    };
    request.onupgradeneeded = (event) => {
      clearTimeout(timer);
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
      // No record: its absence means persistent storage has not been requested yet.
      if (event.oldVersion < 5) request.result.createObjectStore(META_STORE);
    };
    request.onsuccess = () => {
      clearTimeout(timer);
      const db = request.result;
      // The caller already got UpgradeBlockedError; a late open must not hold the database.
      if (settle !== null) {
        db.close();
        settle();
        return;
      }
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => {
      clearTimeout(timer);
      settle?.();
      reject(request.error);
    };
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
 *  transaction, so a failure anywhere changes nothing. An already-ended session rejects with a
 *  'ConstraintError' DOMException and writes nothing (TASK-2.21 D-1). The report's style counts come from
 *  the session's stored hand records; a missing or invalid record is skipped (TASK-10.3 A-7). */
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
      // Checked in this transaction, so no other tab can end the session between the check and the writes.
      if (isEnded(session)) {
        failure = new DOMException('Session already ended', 'ConstraintError');
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

type AppStore = HandStore &
  SessionEnder &
  TrendReader &
  SettingsReader &
  SettingsWriter &
  PersistentStorageReader &
  PersistentStorageWriter;

/**
 * An IndexedDB HandStore: add-only hand records, one replaceable record per session and one write-once report
 * per ended session. The database opens on the first call; if opening fails, every call rejects with that
 * error, except that a blocked open, or one that gets no answer within `openTimeoutMs`, rejects with
 * UpgradeBlockedError and is retried on the next call; while that request is still pending, calls reject with
 * UpgradeBlockedError after a short wait. Records are validated by parseHandRecord / parseSessionRecord /
 * parseSessionReport / parseSettings when read.
 */
export function openHandStore(
  factory: IDBFactory = indexedDB,
  name = DB_NAME,
  openTimeoutMs = OPEN_TIMEOUT_MS,
): AppStore {
  let db: Promise<IDBDatabase> | null = null;
  // Settles when the last blocked (or timed-out) open request finishes; null until an open is blocked.
  let blockedOpen: Promise<void> | null = null;
  const database = async (): Promise<IDBDatabase> => {
    const pending = blockedOpen;
    if (pending !== null) {
      // A new open would queue behind the blocked one and hang, so wait briefly for it, then reject.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const released = await Promise.race([
        pending.then(() => true),
        new Promise<false>((done) => (timer = setTimeout(() => done(false), BLOCKED_GRACE_MS))),
      ]);
      clearTimeout(timer);
      if (!released) throw new UpgradeBlockedError();
    }
    if (db === null) {
      const opening = opened(
        factory,
        name,
        (settled) => {
          blockedOpen = settled;
        },
        openTimeoutMs,
      );
      db = opening;
      opening.catch((error: unknown) => {
        if (error instanceof UpgradeBlockedError) db = null;
      });
    }
    return db;
  };
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
    async writeSettings(settings) {
      const record = parseSettings(settings);
      const transaction = (await database()).transaction(SETTINGS_STORE, 'readwrite', {
        durability: 'strict',
      });
      return completed(
        transaction,
        transaction.objectStore(SETTINGS_STORE).put(record, SETTINGS_KEY),
      );
    },
    async readPersistentStorage() {
      const value: unknown = await requested(
        (await readOnly(META_STORE)).get(PERSISTENT_STORAGE_KEY),
      );
      return parsePersistentStorage(value);
    },
    async writePersistentStorage(granted) {
      const transaction = (await database()).transaction(META_STORE, 'readwrite', {
        durability: 'strict',
      });
      return completed(
        transaction,
        transaction.objectStore(META_STORE).put({ granted }, PERSISTENT_STORAGE_KEY),
      );
    },
  };
}

let shared: AppStore | null = null;

/** The app-wide store, created on first call (never at module load). */
export function sharedHandStore(): AppStore {
  return (shared ??= openHandStore());
}
