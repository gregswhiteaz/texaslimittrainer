// TASK-12.1: the trainer's settings record (REQ-050), stored by src/storage/hand-store.ts. See
// docs/storage/settings.md.

export type DefaultSpeed = 'rapid' | 'realistic';

export interface Settings {
  /** REQ-050.1 */
  readonly defaultSpeed: DefaultSpeed;
  /** REQ-050.2 */
  readonly autoOpenReview: boolean;
  /** REQ-050.3 */
  readonly showOpponentStyles: boolean;
  /** REQ-050.4 */
  readonly fourColourDeck: boolean;
  /** E12-S07 */
  readonly botBanter: boolean;
}

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  defaultSpeed: 'rapid',
  autoOpenReview: true,
  showOpponentStyles: true,
  fourColourDeck: false,
  botBanter: true,
});

export interface SettingsReader {
  /** The stored settings, or DEFAULT_SETTINGS when none are stored; rejects if the stored record is invalid. */
  readSettings(): Promise<Settings>;
}

const BOOLEAN_FIELDS = [
  'autoOpenReview',
  'showOpponentStyles',
  'fourColourDeck',
  'botBanter',
] as const;

/** A copy of `value`'s five settings fields; throws RangeError('Invalid settings: <first bad field>'). */
export function parseSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RangeError('Invalid settings: settings');
  }
  const record = value as Record<string, unknown>;
  const { defaultSpeed } = record;
  if (defaultSpeed !== 'rapid' && defaultSpeed !== 'realistic') {
    throw new RangeError('Invalid settings: defaultSpeed');
  }
  for (const field of BOOLEAN_FIELDS) {
    if (typeof record[field] !== 'boolean') throw new RangeError(`Invalid settings: ${field}`);
  }
  return {
    defaultSpeed,
    autoOpenReview: record.autoOpenReview as boolean,
    showOpponentStyles: record.showOpponentStyles as boolean,
    fourColourDeck: record.fourColourDeck as boolean,
    botBanter: record.botBanter as boolean,
  };
}
