import { describe, expect, it } from 'vitest';
import { BOT_NAMES, LINE_UP_PRESETS, seatLineUp, type LineUpPreset } from '../../src/bots/lineup';

const SIZE_ERROR = new RangeError('Table size must be a whole number from 2 to 10');
const SEAT_ERROR = new RangeError('User seat must be a whole number from 1 to the table size');

describe('seatLineUp', () => {
  it('seatLineUp rejects bad input and matches the worked examples', () => {
    for (const size of [1, 11, 2.5, Number.NaN]) {
      expect(() => seatLineUp('Mixed', size, 1)).toThrow(SIZE_ERROR);
    }
    for (const seat of [0, 7, 1.5]) expect(() => seatLineUp('Mixed', 6, seat)).toThrow(SEAT_ERROR);
    expect(() => seatLineUp('Custom' as LineUpPreset, 6, 1)).toThrow(
      new RangeError('Unknown line-up preset: Custom'),
    );

    expect(seatLineUp('Tough', 6, 2)).toEqual(seatLineUp('Tough', 6, 2));
    expect(seatLineUp('Soft', 5, 5)).toEqual([
      { seat: 1, kind: 'bot', style: 'Calling station', name: 'Ava' },
      { seat: 2, kind: 'bot', style: 'Rock', name: 'Ben' },
      { seat: 3, kind: 'bot', style: 'Calling station', name: 'Cal' },
      { seat: 4, kind: 'bot', style: 'Rock', name: 'Dee' },
      { seat: 5, kind: 'user', style: null, name: null },
    ]);
    expect(seatLineUp('Tough', 3, 3)).toEqual([
      { seat: 1, kind: 'bot', style: 'Maniac', name: 'Ava' },
      { seat: 2, kind: 'bot', style: 'TAG', name: 'Ben' },
      { seat: 3, kind: 'user', style: null, name: null },
    ]);
    expect(seatLineUp('Tough', 2, 2)).toEqual([
      { seat: 1, kind: 'bot', style: 'TAG', name: 'Ava' },
      { seat: 2, kind: 'user', style: null, name: null },
    ]);
    expect(seatLineUp('Mixed', 10, 1).map((s) => s.name)).toEqual([null, ...BOT_NAMES]);
    expect(LINE_UP_PRESETS).toEqual(['Mixed', 'Tough', 'Soft']);
    expect(Object.isFrozen(LINE_UP_PRESETS) && Object.isFrozen(BOT_NAMES)).toBe(true);
  });
});
