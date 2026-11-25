// TASK-13.2 (REQ-052.4): ask the browser once, on first launch, to keep the app's storage, and record the result.

export interface PersistentStorageReader {
  /** true/false = recorded result; null = no valid record (never asked, write failed, invalid record). */
  readPersistentStorage(): Promise<boolean | null>;
}

export interface PersistentStorageWriter {
  /** Puts { granted } under PERSISTENT_STORAGE_KEY in META_STORE (strict durability). */
  writePersistentStorage(granted: boolean): Promise<void>;
}

/** The stored record → its granted flag, or null if `value` is not { granted: boolean } (A-4). */
export function parsePersistentStorage(value: unknown): boolean | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const granted: unknown = (value as { granted?: unknown }).granted;
  return typeof granted === 'boolean' ? granted : null;
}

/** A caller for nav.storage.persist(), or undefined when nav.storage or nav.storage.persist is missing. */
export function browserPersist(
  nav: Pick<Navigator, 'storage'>,
): (() => Promise<unknown>) | undefined {
  // navigator.storage is undefined in insecure contexts, despite its type.
  const storage = nav.storage as StorageManager | undefined;
  if (typeof storage?.persist !== 'function') return undefined;
  // Called as a method: a detached persist throws "Illegal invocation" (A-7).
  return () => storage.persist();
}

/** Reads the record. If none exists, calls `persist` once and writes `granted`. Resolves to the stored or
 *  recorded flag, or null if it could not read or write. It never rejects. */
export async function requestPersistenceOnce(
  store: PersistentStorageReader & PersistentStorageWriter,
  persist: (() => Promise<unknown>) | undefined,
): Promise<boolean | null> {
  let recorded: boolean | null;
  try {
    recorded = await store.readPersistentStorage();
  } catch (error) {
    console.error('Persistent storage could not be checked', error);
    return null;
  }
  if (recorded !== null) return recorded;
  let granted = false;
  if (persist !== undefined) {
    try {
      granted = (await persist()) === true;
    } catch {
      // A rejection or a synchronous throw counts as not granted.
    }
  }
  try {
    await store.writePersistentStorage(granted);
  } catch (error) {
    console.error('Persistent storage result could not be saved', error);
    return null;
  }
  return granted;
}
