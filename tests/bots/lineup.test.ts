import { describe, expect, it } from 'vitest';
import {
  BOT_NAMES,
  LINE_UP_PRESETS,
  lineUpSessionConfig,
  resolveLineUpName,
  seatLineUp,
  type LineUpPreset,
  type LineUpSeat,
} from '../../src/bots/lineup';
import type { StyleName } from '../../src/bots/style';
import { configForGameType, DEFAULT_SESSION_CONFIG } from '../../src/table/session';

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

const withStyle = (seats: readonly LineUpSeat[], seat: number, style: StyleName): LineUpSeat[] =>
  seats.map((s) => (s.seat === seat ? { ...s, style } : s));

describe('resolveLineUpName and lineUpSessionConfig', () => {
  it('resolveLineUpName and lineUpSessionConfig follow the rules', () => {
    const defaultSeat = seatLineUp('Mixed', 6, 5);
    expect(defaultSeat[1]?.style).toBe('Maniac');
    expect(resolveLineUpName('Mixed', withStyle(defaultSeat, 2, 'Rock'))).toBe('Custom');

    const softPattern = seatLineUp('Soft', 6, 1);
    const mixedAsSoft = seatLineUp('Mixed', 6, 1).map((s, i) => ({
      ...s,
      style: softPattern[i]?.style ?? null,
    }));
    expect(resolveLineUpName('Mixed', mixedAsSoft)).toBe('Custom');
    expect(resolveLineUpName('Soft', mixedAsSoft)).toBe('Soft');

    const renamed = seatLineUp('Mixed', 6, 1).map((s) =>
      s.kind === 'bot' ? { ...s, name: 'Zed' } : s,
    );
    expect(resolveLineUpName('Mixed', renamed)).toBe('Mixed');

    expect(resolveLineUpName('Mixed', seatLineUp('Tough', 2, 2))).toBe('Mixed');
    expect(resolveLineUpName('Tough', seatLineUp('Mixed', 2, 1))).toBe('Tough');

    const sitAndGo = {
      ...configForGameType(DEFAULT_SESSION_CONFIG, 'sit-and-go', DEFAULT_SESSION_CONFIG.stake),
      button: 1,
    };
    const baseCopy = structuredClone(sitAndGo);
    const seats = seatLineUp('Soft', 4, 2);
    const seatsCopy = structuredClone(seats);
    const config = lineUpSessionConfig(sitAndGo, 'Soft', seats);
    expect(config.gameType).toBe('sit-and-go');
    expect('stake' in config).toBe(false);
    expect(config).toMatchObject({
      players: 4,
      userSeat: 2,
      lineUp: 'Soft',
      button: 1,
      speed: 'rapid',
    });
    expect(config.seats).toEqual([
      { seat: 1, name: 'Cal', kind: 'bot', style: 'Calling station' },
      { seat: 2, name: 'You', kind: 'user', style: null },
      { seat: 3, name: 'Ava', kind: 'bot', style: 'Calling station' },
      { seat: 4, name: 'Ben', kind: 'bot', style: 'Rock' },
    ]);
    expect(sitAndGo).toEqual(baseCopy);
    expect(seats).toEqual(seatsCopy);
  });

  it('resolveLineUpName and lineUpSessionConfig reject malformed input', () => {
    const six = seatLineUp('Mixed', 6, 1);
    const bot = (seat: number): LineUpSeat => ({ seat, kind: 'bot', style: 'TAG', name: 'Ava' });
    const user = (seat: number): LineUpSeat => ({ seat, kind: 'user', style: null, name: null });
    const cases: [LineUpPreset, readonly LineUpSeat[], string][] = [
      ['Mixed', [], 'Seats must be numbered 1 to the table size in ascending order'],
      ['Mixed', [user(1), bot(3)], 'Seats must be numbered 1 to the table size in ascending order'],
      ['Mixed', [bot(2), user(1)], 'Seats must be numbered 1 to the table size in ascending order'],
      ['Mixed', [bot(1), bot(2)], 'A line-up must have exactly one user seat'],
      ['Mixed', [user(1), user(2)], 'A line-up must have exactly one user seat'],
      [
        'Mixed',
        [user(1), { ...bot(2), style: null }],
        'Every bot seat must have a style and a name',
      ],
      [
        'Mixed',
        [user(1), { ...bot(2), name: null }],
        'Every bot seat must have a style and a name',
      ],
      [
        'Mixed',
        [user(1), ...Array.from({ length: 10 }, (_, i) => bot(i + 2))],
        'Table size must be a whole number from 2 to 10',
      ],
      ['Custom' as LineUpPreset, six, 'Unknown line-up preset: Custom'],
    ];
    for (const [preset, seats, message] of cases) {
      expect(() => resolveLineUpName(preset, seats)).toThrow(new RangeError(message));
      expect(() => lineUpSessionConfig(DEFAULT_SESSION_CONFIG, preset, seats)).toThrow(
        new RangeError(message),
      );
    }
    for (const button of [0, 7, 2.5]) {
      expect(() =>
        lineUpSessionConfig({ ...DEFAULT_SESSION_CONFIG, button }, 'Mixed', six),
      ).toThrow(new RangeError('Button must be a seat at the table'));
    }
  });
});
