import type { Settings } from '../../table/settings';

// TASK-12.11: decides what a settled settings write means for the screen. Only the latest save drives it (A-1).

export type SaveOutcome =
  | { readonly kind: 'saved' }
  | { readonly kind: 'failed'; readonly revertTo: Settings; readonly error: unknown }
  /** A newer save started before this one settled; `error` is set if this one failed (it is still logged). */
  | { readonly kind: 'superseded'; readonly error?: unknown };

export interface SettingsSaver {
  /** Records the value known to be stored (launch read result, or DEFAULT_SETTINGS if it failed). */
  setSaved(settings: Settings): void;
  /** Starts write(next); resolves (never rejects) with the outcome once it settles. */
  save(next: Settings): Promise<SaveOutcome>;
}

export function createSettingsSaver(
  write: (settings: Settings) => Promise<void>,
  initial: Settings,
): SettingsSaver {
  let saved = initial;
  let latest = 0;
  return {
    setSaved(settings) {
      saved = settings;
    },
    save(next) {
      const sequence = ++latest;
      return write(next).then(
        (): SaveOutcome => {
          saved = next;
          return sequence === latest ? { kind: 'saved' } : { kind: 'superseded' };
        },
        (error: unknown): SaveOutcome =>
          sequence === latest
            ? { kind: 'failed', revertTo: saved, error }
            : { kind: 'superseded', error },
      );
    },
  };
}
