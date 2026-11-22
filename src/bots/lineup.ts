import type { LineUpName, SessionConfig, SessionSeat } from '../table/session';
import type { StyleName } from './style';

export type LineUpPreset = 'Mixed' | 'Tough' | 'Soft';
export const LINE_UP_PRESETS: readonly LineUpPreset[] = Object.freeze(['Mixed', 'Tough', 'Soft']);
/** Bot k (counted clockwise from the user) is named BOT_NAMES[k - 1]; 9 names cover a 10-seat table. */
export const BOT_NAMES: readonly string[] = Object.freeze([
  'Ava',
  'Ben',
  'Cal',
  'Dee',
  'Eli',
  'Fay',
  'Gus',
  'Hal',
  'Ivy',
]);
/** Names for replacement bots, in order; initials J–Z, none shared with BOT_NAMES. */
export const REPLACEMENT_NAMES: readonly string[] = Object.freeze([
  'Jay',
  'Kit',
  'Lou',
  'Max',
  'Ned',
  'Oli',
  'Pip',
  'Quin',
  'Ray',
  'Sam',
  'Tom',
  'Uma',
  'Val',
  'Wes',
  'Xia',
  'Yul',
  'Zed',
]);

export interface LineUpSeat {
  /** 1..size. */
  readonly seat: number;
  readonly kind: 'user' | 'bot';
  /** null only for the user. */
  readonly style: StyleName | null;
  /** null only for the user. */
  readonly name: string | null;
}

const MIXED_CYCLE: readonly StyleName[] = ['TAG', 'Calling station', 'Maniac', 'Rock'];

/** Bot k's style (k = 1..size-1, clockwise from the user). */
function presetStyle(preset: LineUpPreset, size: number, k: number): StyleName {
  if (preset === 'Mixed') return MIXED_CYCLE[(k - 1) % MIXED_CYCLE.length] as StyleName;
  if (preset === 'Tough') return size >= 3 && k === 1 ? 'Maniac' : 'TAG';
  return k % 2 === 1 ? 'Calling station' : 'Rock';
}

/** Ascending seat order, length size: bot k sits at seat ((userSeat - 1 + k) mod size) + 1.
 *  Throws RangeError on a bad size, user seat or preset. */
export function seatLineUp(
  preset: LineUpPreset,
  size: number,
  userSeat: number,
): readonly LineUpSeat[] {
  if (!Number.isInteger(size) || size < 2 || size > 10) {
    throw new RangeError('Table size must be a whole number from 2 to 10');
  }
  if (!Number.isInteger(userSeat) || userSeat < 1 || userSeat > size) {
    throw new RangeError('User seat must be a whole number from 1 to the table size');
  }
  if (!LINE_UP_PRESETS.includes(preset)) {
    throw new RangeError(`Unknown line-up preset: ${String(preset)}`);
  }
  return Array.from({ length: size }, (_, i): LineUpSeat => {
    const seat = i + 1;
    if (seat === userSeat) return { seat, kind: 'user', style: null, name: null };
    const k = (seat - userSeat + size) % size;
    return {
      seat,
      kind: 'bot',
      style: presetStyle(preset, size, k),
      name: BOT_NAMES[k - 1] as string,
    };
  });
}

/** Checks the §5 seat invariants and returns the user's seat. Throws RangeError on malformed seats. */
function checkedUserSeat(seats: readonly LineUpSeat[]): number {
  if (seats.length === 0 || seats.some((s, i) => s.seat !== i + 1)) {
    throw new RangeError('Seats must be numbered 1 to the table size in ascending order');
  }
  const users = seats.filter((s) => s.kind === 'user');
  if (users.length !== 1) throw new RangeError('A line-up must have exactly one user seat');
  if (seats.some((s) => s.kind === 'bot' && (s.style === null || s.name === null))) {
    throw new RangeError('Every bot seat must have a style and a name');
  }
  return (users[0] as LineUpSeat).seat;
}

/** REQ-009.6: `preset` when every bot seat's style equals seatLineUp(preset, seats.length, userSeat) at that
 *  seat, otherwise 'Custom' (only the chosen preset is compared). Names are ignored.
 *  Throws RangeError on malformed seats, a bad size or an unknown preset. */
export function resolveLineUpName(preset: LineUpPreset, seats: readonly LineUpSeat[]): LineUpName {
  const expected = seatLineUp(preset, seats.length, checkedUserSeat(seats));
  return seats.every((s) => s.kind === 'user' || s.style === expected[s.seat - 1]?.style)
    ? preset
    : 'Custom';
}

/** The SessionConfig for Start game: `base` with players, userSeat, lineUp and seats taken from the line-up
 *  (bots keep their name and style; the user is named 'You'). gameType, stake (cash only), speed and button
 *  come from `base`. Throws RangeError as resolveLineUpName does, or when `base.button` is not a seat. */
export function lineUpSessionConfig(
  base: SessionConfig,
  preset: LineUpPreset,
  seats: readonly LineUpSeat[],
): SessionConfig {
  const lineUp = resolveLineUpName(preset, seats);
  if (!Number.isInteger(base.button) || base.button < 1 || base.button > seats.length) {
    throw new RangeError('Button must be a seat at the table');
  }
  const sessionSeats = seats.map((s): SessionSeat =>
    s.kind === 'user'
      ? { seat: s.seat, name: 'You', kind: 'user', style: null }
      : { seat: s.seat, name: s.name as string, kind: 'bot', style: s.style },
  );
  const userSeat = (seats.find((s) => s.kind === 'user') as LineUpSeat).seat;
  return { ...base, players: seats.length, userSeat, lineUp, seats: sessionSeats };
}

/** REQ-007.7/007.8: distinct styles a replacement may have, in order TAG, Calling station, Maniac, Rock.
 *  'Custom' → all four. RangeError: size not an integer 2..10, or unknown line-up name. */
export function replacementStyles(lineUp: LineUpName, size: number): readonly StyleName[] {
  if (!Number.isInteger(size) || size < 2 || size > 10) {
    throw new RangeError('Table size must be a whole number from 2 to 10');
  }
  if (lineUp === 'Custom') return MIXED_CYCLE;
  if (!LINE_UP_PRESETS.includes(lineUp)) {
    throw new RangeError(`Unknown line-up: ${String(lineUp)}`);
  }
  const seated = seatLineUp(lineUp, size, 1).map((s) => s.style);
  return MIXED_CYCLE.filter((style) => seated.includes(style));
}

/** Name at `position` in the sequence: REPLACEMENT_NAMES[p mod 17], plus ` ${floor(p/17)+1}` when p ≥ 17.
 *  RangeError if position is not a non-negative safe integer. */
export function replacementName(position: number): string {
  if (!Number.isSafeInteger(position) || position < 0) {
    throw new RangeError('Name position must be a whole number of at least 0');
  }
  const name = REPLACEMENT_NAMES[position % REPLACEMENT_NAMES.length] as string;
  const round = Math.floor(position / REPLACEMENT_NAMES.length);
  return round === 0 ? name : `${name} ${round + 1}`;
}

/** The first name at position ≥ `position` not in `seated`, and the position after it. */
export function nextReplacementName(
  position: number,
  seated: readonly string[],
): { readonly name: string; readonly next: number } {
  let p = position;
  while (seated.includes(replacementName(p))) p++;
  return { name: replacementName(p), next: p + 1 };
}
