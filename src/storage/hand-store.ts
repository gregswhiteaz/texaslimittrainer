import { parseHandRecord, type HandStore } from '../table/hand-record';

export const DB_NAME = 'tlh-trainer';
/** The only version marker until REQ-054 adds per-store schema versions. */
export const DB_VERSION = 1;
export const HANDS_STORE = 'hands';

function opened(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, DB_VERSION);
    request.onupgradeneeded = (event) => {
      if (event.oldVersion < 1) {
        request.result.createObjectStore(HANDS_STORE, { keyPath: ['sessionId', 'handNumber'] });
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

/**
 * An add-only IndexedDB HandStore. The database opens on the first call; if opening fails, every call
 * rejects with that error. Records are validated by parseHandRecord when read.
 */
export function openHandStore(factory: IDBFactory = indexedDB, name = DB_NAME): HandStore {
  let db: Promise<IDBDatabase> | null = null;
  const database = (): Promise<IDBDatabase> => (db ??= opened(factory, name));
  const readOnly = async (): Promise<IDBObjectStore> =>
    (await database()).transaction(HANDS_STORE, 'readonly').objectStore(HANDS_STORE);
  return {
    async add(record) {
      const transaction = (await database()).transaction(HANDS_STORE, 'readwrite', {
        durability: 'strict',
      });
      const request = transaction.objectStore(HANDS_STORE).add(record);
      return new Promise((resolve, reject) => {
        const fail = () => reject(request.error ?? transaction.error);
        transaction.oncomplete = () => resolve();
        transaction.onerror = fail;
        transaction.onabort = fail;
      });
    },
    async get(sessionId, handNumber) {
      const value: unknown = await requested((await readOnly()).get([sessionId, handNumber]));
      return value === undefined ? null : parseHandRecord(value);
    },
    async count() {
      return requested((await readOnly()).count());
    },
  };
}

let shared: HandStore | null = null;

/** The app-wide store, created on first call (never at module load). */
export function sharedHandStore(): HandStore {
  return (shared ??= openHandStore());
}
