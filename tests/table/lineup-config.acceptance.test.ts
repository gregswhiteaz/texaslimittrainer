import { describe, expect, it } from 'vitest';
import { LINE_UP_PRESETS } from '../../src/bots/lineup';
import {
  botsClockwise,
  configForGameType,
  configForLineUp,
  DEFAULT_SESSION_CONFIG,
  seatSession,
  TABLE_SIZES,
} from '../../src/table/session';

const SOFT_SIX = [
  { seat: 6, name: 'Ava', style: 'Calling station' },
  { seat: 1, name: 'Ben', style: 'Rock' },
  { seat: 2, name: 'Cal', style: 'Calling station' },
  { seat: 3, name: 'Dee', style: 'Rock' },
  { seat: 4, name: 'Eli', style: 'Calling station' },
];

const rowsOf = (seats: readonly { seat: number; name: string; style: unknown; kind: string }[]) =>
  seats.filter((s) => s.kind === 'bot').map(({ seat, name, style }) => ({ seat, name, style }));

describe('Line-up config acceptance', () => {
  it('switching from 6 to 4 players with Soft gives Calling station, Rock, Calling station', () => {
    const six = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Soft');
    const four = configForLineUp(six, 4, 'Soft');

    const bots = botsClockwise(four);
    expect(bots.map((s) => s.style)).toEqual(['Calling station', 'Rock', 'Calling station']);
    expect(bots.map((s) => s.seat)).toEqual([1, 2, 3]);
    expect(four.userSeat).toBe(4);
    expect(four.lineUp).toBe('Soft');
  });

  it('start game with Soft at 6 seats the listed bots and records the line-up Soft', () => {
    const listed = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Soft');
    expect(rowsOf(botsClockwise(listed))).toEqual(SOFT_SIX);

    const cash = configForGameType(listed, 'cash', { smallBet: 4, bigBet: 8 });
    const sng = configForGameType(listed, 'sit-and-go', DEFAULT_SESSION_CONFIG.stake);
    for (const config of [cash, sng]) {
      const table = seatSession(config);
      expect(table.config.lineUp).toBe('Soft');
      expect(rowsOf(botsClockwise(table.config))).toEqual(SOFT_SIX);
      expect(rowsOf(table.seats)).toEqual(rowsOf(listed.seats));
      expect(table.seats.find((s) => s.kind === 'user')).toEqual({
        seat: 5,
        name: 'You',
        kind: 'user',
        style: null,
      });
    }
  });

  it("start game's button is a seat at every table size and preset", () => {
    for (const base of [DEFAULT_SESSION_CONFIG, { ...DEFAULT_SESSION_CONFIG, button: 10 }]) {
      for (const n of TABLE_SIZES) {
        for (const preset of LINE_UP_PRESETS) {
          const config = configForLineUp(base, n, preset);

          expect(Number.isInteger(config.button)).toBe(true);
          expect(config.button).toBeGreaterThanOrEqual(1);
          expect(config.button).toBeLessThanOrEqual(n);
          expect(config.button).toBe((Math.min(5, n) % n) + 1);
          expect(config.players).toBe(n);
          expect(config.seats).toHaveLength(n);
          expect(() => seatSession(configForGameType(config, 'cash', base.stake))).not.toThrow();
        }
      }
    }
  });
});
