import { referenceSizeOf } from '../advice/preflop';
import type { ReferenceSize } from '../advice/preflop-chart';
import { NO_STAT, type StyleCounts } from './style-stats';
// The JSON import stays last, as in src/bots/tag.ts.
import healthyRanges from './healthy-ranges.json' with { type: 'json' };

export type StyleStatKey = 'vpip' | 'pfr' | 'aggression' | 'wtsd' | 'wsd';
export const STYLE_STAT_KEYS: readonly StyleStatKey[] = [
  'vpip',
  'pfr',
  'aggression',
  'wtsd',
  'wsd',
];
export const STYLE_STAT_NAMES: Readonly<Record<StyleStatKey, string>> = {
  vpip: 'VPIP',
  pfr: 'PFR',
  aggression: 'Aggression',
  wtsd: 'WTSD',
  wsd: 'W$SD',
};

/** Whole percents, both limits inclusive. */
export interface HealthyRange {
  readonly low: number;
  readonly high: number;
  readonly justification: string;
}
export type HealthyRanges = Readonly<
  Record<ReferenceSize, Readonly<Record<StyleStatKey, HealthyRange>>>
>;

const FORMAT = 'tlh-healthy-ranges';
const SIZES: readonly ReferenceSize[] = ['heads-up', '6-max', 'full-ring'];
const SIZE_NAMES: Readonly<Record<ReferenceSize, string>> = {
  'heads-up': 'heads-up',
  '6-max': '6-max',
  'full-ring': 'full ring',
};
/** Table sizes that use another size's ranges (REQ-005.4). */
const APPROXIMATE_PLAYERS: readonly number[] = [3, 4, 5, 7, 8];

type Fields = Readonly<Record<string, unknown>>;

function invalid(path: string): RangeError {
  return new RangeError(`Invalid healthy ranges: ${path}`);
}

/** `value` as an object with exactly `keys`; RangeError naming `path`, or `path.<key>` for a missing,
 *  extra key. */
function exact(value: unknown, path: string, keys: readonly string[]): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(path);
  const extra = Object.keys(value).find((key) => !keys.includes(key));
  if (extra !== undefined) throw invalid(`${path}.${extra}`);
  return value as Fields;
}

const isPercent = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 100;

/** One trimmed, non-empty sentence ending in a full stop (A-10). */
const isSentence = (value: unknown): boolean =>
  typeof value === 'string' &&
  value.length > 1 &&
  value === value.trim() &&
  value.endsWith('.') &&
  !/[.!?]\s/.test(value);

function parseRange(value: unknown, path: string): HealthyRange {
  const range = exact(value, path, ['low', 'high', 'justification']);
  if (!isPercent(range.low)) throw invalid(`${path}.low`);
  if (!isPercent(range.high) || range.high <= range.low) throw invalid(`${path}.high`);
  if (!isSentence(range.justification)) throw invalid(`${path}.justification`);
  return range as unknown as HealthyRange;
}

/** Validates a healthy-range data file: exactly the 3 reference sizes and 5 stats, no extra keys.
 *  RangeError('Invalid healthy ranges: <path>'), e.g. 'ranges.6-max.vpip.high'. */
export function parseHealthyRanges(value: unknown): HealthyRanges {
  const file = exact(value, 'file', ['format', 'version', 'ranges']);
  if (file.format !== FORMAT) throw invalid('format');
  if (file.version !== 1) throw invalid('version');
  const ranges = exact(file.ranges, 'ranges', SIZES);
  for (const size of SIZES) {
    const path = `ranges.${size}`;
    const stats = exact(ranges[size], path, STYLE_STAT_KEYS);
    for (const key of STYLE_STAT_KEYS) parseRange(stats[key], `${path}.${key}`);
  }
  return ranges as unknown as HealthyRanges;
}

/** The shipped ranges, validated at import. */
export const HEALTHY_RANGES: HealthyRanges = parseHealthyRanges(healthyRanges);

/** part/whole in tenths of a percent, rounded half up with integer arithmetic; null when whole is 0. */
export function statTenths(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return Math.floor((2000 * part + whole) / (2 * whole));
}

export type RangeLabel = 'in range' | 'too high' | 'too low' | 'not enough data';

/** Compares the rounded value with the inclusive limits (REQ-044.11). */
export function rangeLabel(tenths: number | null, range: HealthyRange): RangeLabel {
  if (tenths === null) return 'not enough data';
  if (tenths > range.high * 10) return 'too high';
  if (tenths < range.low * 10) return 'too low';
  return 'in range';
}

export interface StyleRow {
  readonly key: StyleStatKey;
  readonly name: string;
  /** '25.0%' or '—'. */
  readonly value: string;
  /** '20–28%'. */
  readonly range: string;
  readonly label: RangeLabel;
}

export interface StyleSection {
  readonly reference: ReferenceSize;
  readonly approximate: boolean;
  /** 'Your style vs healthy range (6-max)' or '(6-max, approximate)'. */
  readonly title: string;
  /** In STYLE_STAT_KEYS order. */
  readonly rows: readonly StyleRow[];
}

function fraction(c: StyleCounts, key: StyleStatKey): [number, number] {
  switch (key) {
    case 'vpip':
      return [c.voluntary, c.handsDealt];
    case 'pfr':
      return [c.preflopRaised, c.handsDealt];
    case 'aggression':
      return [c.postflopAggressive, c.postflopAggressive + c.postflopCalls];
    case 'wtsd':
      return [c.showdowns, c.sawFlop];
    case 'wsd':
      return [c.showdownsWon, c.showdowns];
  }
}

/** The report's style section for a session at `players` (2–10; RangeError otherwise). */
export function styleSection(
  players: number,
  counts: StyleCounts,
  ranges: HealthyRanges = HEALTHY_RANGES,
): StyleSection {
  const reference = referenceSizeOf(players);
  const approximate = APPROXIMATE_PLAYERS.includes(players);
  const name = SIZE_NAMES[reference];
  return {
    reference,
    approximate,
    title: `Your style vs healthy range (${approximate ? `${name}, approximate` : name})`,
    rows: STYLE_STAT_KEYS.map((key) => {
      const range = ranges[reference][key];
      const tenths = statTenths(...fraction(counts, key));
      return {
        key,
        name: STYLE_STAT_NAMES[key],
        value: tenths === null ? NO_STAT : `${(tenths / 10).toFixed(1)}%`,
        range: `${range.low}–${range.high}%`,
        label: rangeLabel(tenths, range),
      };
    }),
  };
}
