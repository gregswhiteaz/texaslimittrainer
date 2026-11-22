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
