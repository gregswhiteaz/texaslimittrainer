import { describe, expect, it } from 'vitest';
import {
  BOT_STYLES,
  configForGameType,
  configForLineUp,
  configWithSeatStyle,
  DEFAULT_SESSION_CONFIG,
  type BotStyle,
} from '../../src/table/session';

describe('configWithSeatStyle', () => {
  it('configWithSeatStyle changes one seat only and rejects user seats, missing seats and unknown styles', () => {
    expect(BOT_STYLES).toEqual(['TAG', 'Calling station', 'Maniac', 'Rock']);
    expect(Object.isFrozen(BOT_STYLES)).toBe(true);

    const c = configForLineUp(
      configForGameType(DEFAULT_SESSION_CONFIG, 'sit-and-go', DEFAULT_SESSION_CONFIG.stake),
      9,
      'Mixed',
    );
    const edited = configWithSeatStyle(c, 'Mixed', 7, 'Rock');

    expect(c.seats.find((s) => s.seat === 7)?.style).not.toBe('Rock');
    expect(edited.seats).toEqual(c.seats.map((s) => (s.seat === 7 ? { ...s, style: 'Rock' } : s)));
    expect(edited.gameType).toBe('sit-and-go');
    expect('stake' in edited).toBe(false);
    expect(edited.speed).toBe(c.speed);
    expect(edited.players).toBe(9);
    expect(edited.userSeat).toBe(c.userSeat);
    expect(edited.button).toBe(c.button);
    expect(edited.seats.map((s) => s.name)).toEqual(c.seats.map((s) => s.name));
    expect(edited.lineUp).toBe('Custom');

    expect(() => configWithSeatStyle(c, 'Mixed', 5, 'Rock')).toThrow(
      new RangeError('Seat 5 is not a bot seat'),
    );
    expect(() => configWithSeatStyle(c, 'Mixed', 11, 'Rock')).toThrow(
      new RangeError('Seat 11 is not a bot seat'),
    );
    expect(() => configWithSeatStyle(c, 'Mixed', 7, 'Random' as BotStyle)).toThrow(
      new RangeError('Unknown bot style: Random'),
    );

    const current = c.seats.find((s) => s.seat === 7)?.style as BotStyle;
    const same = configWithSeatStyle(c, 'Mixed', 7, current);
    expect(same.lineUp).toBe('Mixed');
    expect(same.seats).toEqual(c.seats);
  });

  it('compares only against the given preset', () => {
    const soft = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Soft');
    const ava = soft.seats.find((s) => s.seat === 6)?.style as BotStyle;
    expect(configWithSeatStyle(soft, 'Soft', 6, ava).lineUp).toBe('Soft');
    expect(configWithSeatStyle(soft, 'Mixed', 6, ava).lineUp).toBe('Custom');
  });
});
